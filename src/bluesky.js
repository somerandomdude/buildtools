// https://kulpinski.dev/posts/embed-card-links-on-bluesky/

import { AtpAgent } from "@atproto/api";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Parser from "rss-parser";
import { loadEnvFile } from "node:process";
import path from "node:path";

try {
  loadEnvFile();
} catch (e) {
  console.log("No local .env file");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates and authenticates a Bluesky agent.
 * Requires BLUESKY_USERNAME and BLUESKY_PASSWORD environment variables.
 *
 * @async
 * @private
 * @returns {Promise<AtpAgent>} Authenticated Bluesky agent.
 * @throws {Error} If BLUESKY_USERNAME environment variable is not set.
 * @throws {Error} If BLUESKY_PASSWORD environment variable is not set.
 */
const getBlueskyAgent = async () => {
  // Validate environment variables
  if (!process.env.BLUESKY_USERNAME) {
    throw new Error("BLUESKY_USERNAME environment variable is not set");
  }
  if (!process.env.BLUESKY_PASSWORD) {
    throw new Error("BLUESKY_PASSWORD environment variable is not set");
  }

  const agent = new AtpAgent({
    service: "https://bsky.social",
  });

  await agent.login({
    identifier: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
  });

  return agent;
};

/**
 * Reads and parses the RSS feed to get the latest post.
 * Expects the RSS file to be at ../dist/rss.xml relative to this module.
 *
 * @async
 * @private
 * @returns {Promise<Object>} Latest post object.
 * @returns {string} return.title - The title of the latest post.
 * @returns {string} return.link - The URL link of the latest post.
 * @throws {Error} If no items are found in the RSS feed.
 */
const getLatestRSSPost = async (rssUrl) => {
  const rssContent = readFileSync(rssUrl, "utf8");

  const parser = new Parser();
  const feed = await parser.parseString(rssContent);

  if (!feed.items || feed.items.length === 0) {
    throw new Error("No items found in RSS feed");
  }

  const latestPost = feed.items[0];
  return {
    title: latestPost.title || "",
    link: latestPost.link || "",
  };
};

/**
 * Checks if a link has been posted before by searching user's posts.
 * Searches up to 100 previous posts to avoid excessive API calls.
 *
 * @async
 * @private
 * @param {AtpAgent} agent - Authenticated Bluesky agent.
 * @param {string} link - Link URL to search for in previous posts.
 * @returns {Promise<boolean>} True if the link was found in previous posts, false otherwise.
 */
const hasLinkBeenPosted = async (agent, link) => {
  try {
    // Get the user's feed to check for previous posts
    const handle = agent.session.handle || agent.session.did;
    let cursor = undefined;
    let hasMore = true;
    const maxPostsToCheck = 100; // Limit to avoid checking too many posts
    let postsChecked = 0;

    while (hasMore && postsChecked < maxPostsToCheck) {
      const response = await agent.api.app.bsky.feed.getAuthorFeed({
        actor: handle,
        limit: 100,
        cursor: cursor,
      });

      if (!response.data || !response.data.feed) {
        break;
      }

      // Check each post for the link
      for (const feedItem of response.data.feed) {
        postsChecked++;
        const post = feedItem.post?.record;

        if (!post) continue;

        // Check if link is in the post text
        if (post.text && post.text.includes(link)) {
          return true;
        }

        // Check facets for links
        if (post.facets) {
          for (const facet of post.facets) {
            if (facet.features) {
              for (const feature of facet.features) {
                if (
                  feature.$type === "app.bsky.richtext.facet#link" &&
                  feature.uri === link
                ) {
                  return true;
                }
              }
            }
          }
        }
      }

      // Check if there are more posts to fetch
      cursor = response.data.cursor;
      hasMore = !!cursor;
    }

    return false;
  } catch (error) {
    // If search fails, log but don't block posting
    console.warn(
      "Warning: Could not search for previous posts:",
      error.message,
    );
    return false;
  }
};

/**
 * Sends a post to Bluesky with optional URL attachment.
 * If a URL is provided and not already in the text, it will be appended.
 * URLs are automatically converted to clickable links using Bluesky facets.
 *
 * Requires BLUESKY_USERNAME and BLUESKY_PASSWORD environment variables to be set.
 *
 * @async
 * @param {string} text - The text content of the post.
 * @param {string} [url] - Optional URL to include in the post as a clickable link.
 * @returns {Promise<Object>} The response from the Bluesky API containing the post URI.
 * @throws {Error} If text is not provided or is empty.
 * @throws {Error} If BLUESKY_USERNAME environment variable is not set.
 * @throws {Error} If BLUESKY_PASSWORD environment variable is not set.
 *
 * @example
 * // Post without URL
 * await sendBlueskyPost('Hello from my build tool!');
 *
 * @example
 * // Post with URL
 * await sendBlueskyPost('Check out my new blog post!', 'https://example.com/post');
 */
export const sendBlueskyPost = async (text, url) => {
  if (!text) {
    throw new Error("Post text is required");
  }

  const agent = await getBlueskyAgent();

  // Build the post record
  const record = {
    $type: "app.bsky.feed.post",
    text: text,
    createdAt: new Date().toISOString(),
  };

  // Add URL as a facet if provided
  if (url) {
    // Find where the URL appears in the text (or append it)
    const urlIndex = text.indexOf(url);
    let byteStart, byteEnd;

    if (urlIndex !== -1) {
      // URL is already in the text, create facet for it
      byteStart = urlIndex;
      byteEnd = urlIndex + url.length;
    } else {
      // URL not in text, append it
      const separator = text.endsWith(" ") ? "" : " ";
      record.text = text + separator + url;
      byteStart = record.text.length - url.length;
      byteEnd = record.text.length;
    }

    record.facets = [
      {
        index: {
          byteStart: byteStart,
          byteEnd: byteEnd,
        },
        features: [
          {
            $type: "app.bsky.richtext.facet#link",
            uri: url,
          },
        ],
      },
    ];
  }

  // Use the correct API method to create a post
  const response = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.bsky.feed.post",
    record: record,
  });

  return response;
};

/**
 * Reads the latest post from the RSS feed and posts it to Bluesky if not already posted.
 * This function performs the following steps:
 * 1. Reads the RSS feed from ./dist/rss.xml
 * 2. Extracts the latest post's title and link
 * 3. Checks if the link has already been posted to Bluesky
 * 4. If not already posted, creates a new Bluesky post with the title and link
 *
 * Requires BLUESKY_USERNAME and BLUESKY_PASSWORD environment variables to be set.
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If the RSS feed cannot be read or parsed.
 * @throws {Error} If the latest RSS post has no link.
 * @throws {Error} If BLUESKY_USERNAME environment variable is not set.
 * @throws {Error} If BLUESKY_PASSWORD environment variable is not set.
 *
 * @example
 * // Typically called after generating/updating the RSS feed
 * await postLatestToBluesky();
 */
export const postLatestToBluesky = async (rssUrl) => {
  const rssPath = path.isAbsolute(rssUrl) ? rssUrl : join(__dirname, rssUrl);

  try {
    console.log("Reading RSS feed...");
    const latestPost = await getLatestRSSPost(rssPath);

    if (!latestPost.link) {
      throw new Error("Latest RSS post has no link");
    }

    console.log(`Latest post: ${latestPost.title}`);
    console.log(`Link: ${latestPost.link}`);

    // Get authenticated agent
    const agent = await getBlueskyAgent();

    // Check if this link has been posted before
    console.log("Checking if link has been posted before...");
    const alreadyPosted = await hasLinkBeenPosted(agent, latestPost.link);

    if (alreadyPosted) {
      console.log("This link has already been posted. Skipping.");
      return;
    }

    // Create post text
    const postText = `${latestPost.title}` || "New post";

    // Post to Bluesky
    console.log("Posting to Bluesky...");
    const response = await sendBlueskyPost(postText, latestPost.link);

    console.log("Post created successfully:", response.data.uri);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};
