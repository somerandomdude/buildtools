import fs from "fs";
import path from "path";
import { Feed } from "feed";
import { DIST_PATH } from "./constants.js";

/**
 * Generates and writes an RSS 2.0 feed file from provided entries.
 *
 * @param {Object} rssData - Configuration object for the RSS feed.
 * @param {string} rssData.title - The title of the RSS feed.
 * @param {string} rssData.siteUrl - The base URL of the website.
 * @param {string} rssData.authorName - The name of the feed author.
 * @param {string} rssData.authorEmail - The email of the feed author.
 * @param {string} rssData.authorSite - The website URL of the author.
 * @param {string} rssData.category - The category for the feed.
 * @param {Object[]} entries - An array of entry objects to include in the feed.
 * @param {string} entries[].title - The title of the entry.
 * @param {string} entries[].url - The URL of the entry.
 * @param {string} [entries[].description] - The description of the entry.
 * @param {string} [entries[].content] - The full content of the entry (used if no description).
 * @param {Date} entries[].date - The publication date of the entry.
 * @param {string} [writePath=DIST_PATH/rss.xml] - The path to write the RSS file.
 * @returns {void}
 * @throws {Error} If rssData is not an object or is missing required properties.
 * @throws {Error} If entries is not an array.
 * @throws {Error} If any entry is missing required properties (title, url, date).
 * @throws {Error} If writePath is not a string.
 *
 * @example
 * writeRSS(
 *   {
 *     title: 'My Blog',
 *     siteUrl: 'https://example.com',
 *     authorName: 'John Doe',
 *     authorEmail: 'john@example.com',
 *     authorSite: 'https://johndoe.com',
 *     category: 'Technology'
 *   },
 *   [{ title: 'Post 1', url: 'https://example.com/post1', date: new Date() }],
 *   './dist/feed.xml'
 * );
 */
export function writeRSS(
  rssData,
  entries,
  writePath = path.join(DIST_PATH, "rss.xml"),
) {
  // Validate rssData parameter
  if (
    rssData === null ||
    typeof rssData !== "object" ||
    Array.isArray(rssData)
  ) {
    throw new Error(
      "writeRSS: 'rssData' must be an object. Received: " +
        (rssData === null
          ? "null"
          : Array.isArray(rssData)
            ? "array"
            : typeof rssData),
    );
  }

  // Validate required rssData properties
  const requiredRssFields = [
    "title",
    "siteUrl",
    "authorName",
    "authorEmail",
    "authorSite",
    "category",
  ];
  for (const field of requiredRssFields) {
    if (!(field in rssData)) {
      throw new Error(
        `writeRSS: 'rssData' is missing required property '${field}'.`,
      );
    }
    if (typeof rssData[field] !== "string") {
      throw new Error(
        `writeRSS: 'rssData.${field}' must be a string. Received: ${typeof rssData[field]}.`,
      );
    }
    if (rssData[field].trim() === "") {
      throw new Error(
        `writeRSS: 'rssData.${field}' cannot be an empty string.`,
      );
    }
  }

  // Validate entries parameter
  if (!Array.isArray(entries)) {
    throw new Error(
      "writeRSS: 'entries' must be an array. Received: " + typeof entries,
    );
  }

  // Validate each entry
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry === null || typeof entry !== "object") {
      throw new Error(
        `writeRSS: entries[${i}] must be an object. Received: ` +
          (entry === null ? "null" : typeof entry),
      );
    }

    if (!("title" in entry) || typeof entry.title !== "string") {
      throw new Error(
        `writeRSS: entries[${i}] must have a 'title' property of type string.`,
      );
    }

    if (!("url" in entry) || typeof entry.url !== "string") {
      throw new Error(
        `writeRSS: entries[${i}] must have a 'url' property of type string.`,
      );
    }

    if (!("date" in entry) || !(entry.date instanceof Date)) {
      throw new Error(
        `writeRSS: entries[${i}] must have a 'date' property of type Date.`,
      );
    }

    if (isNaN(entry.date.getTime())) {
      throw new Error(`writeRSS: entries[${i}].date is an invalid Date.`);
    }
  }

  // Validate writePath parameter
  if (typeof writePath !== "string" || writePath.trim() === "") {
    throw new Error(
      "writeRSS: 'writePath' must be a non-empty string. Received: " +
        (typeof writePath === "string" ? `"${writePath}"` : typeof writePath),
    );
  }

  // Ensure the directory for writePath exists
  const writeDir = path.dirname(writePath);
  if (!fs.existsSync(writeDir)) {
    throw new Error(
      `writeRSS: Directory "${writeDir}" does not exist. Cannot write RSS file.`,
    );
  }

  var feed = new Feed({
    title: rssData.title,
    description: "",
    id: rssData.siteUrl,
    link: rssData.siteUrl,
    language: "en",
    favicon: rssData.siteUrl + "/favicon.png",
    copyright: "All rights reserved 2024, " + rssData.authorName,
    author: {
      name: rssData.authorName,
      email: rssData.authorEmail,
      link: rssData.authorSite,
    },
  });

  entries.forEach((entry) => {
    feed.addItem({
      title: entry.title,
      id: entry.url,
      link: entry.url,
      content: entry.description ?? entry.content,
      author: [
        {
          name: rssData.authorName,
          email: rssData.authorEmail,
          link: rssData.authorSite,
        },
      ],
      date: entry.date,
    });
  });

  feed.addCategory(rssData.category);

  fs.writeFileSync(writePath, feed.rss2());
}
