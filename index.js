import fs from "fs";
import path from "path";
import { Feed } from "feed";
import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";
import customHeadingId from "marked-custom-heading-id";
import frontMatter from "front-matter";
import sharp from "sharp";
import { globSync } from "glob";

export const SRC_PATH = "./src";
export const DIST_PATH = "./dist";

marked.setOptions({});

export function setupDist(paths = []) {
  console.log("dist exists?", fs.existsSync(DIST_PATH));
  if (fs.existsSync(DIST_PATH)) {
    fs.rmSync(DIST_PATH, { recursive: true, force: true });
  }

  fs.mkdirSync(DIST_PATH);

  for (let i = 0; i < paths.length; i++) {
    if (!fs.existsSync(DIST_PATH + "/" + paths[i])) {
      fs.mkdirSync(DIST_PATH + "/" + paths[i]);
    }
  }
}

marked.use(markedSmartypants(), customHeadingId());

export function compileMarkdown(markdown, opts = {}) {
  let entry = frontMatter(markdown);
  //console.log(entry);
  entry.title = entry.attributes.title;
  entry.date = new Date(entry.attributes.date);
  entry.description = entry.attributes.description;
  entry.lastmod = entry.attributes.lastmod;
  entry.content = marked(entry.body);
  entry.dateUTC = entry.lastmod
    ? new Date(entry.lastmod)
    : new Date(entry.date);
  entry.url = opts.url ?? "";
  entry.uri = opts.uri ?? "";
  entry.nextEntry = opts.nextEntry ?? "";

  return entry;
}

export function buildFromTemplate(template, replacements) {
  for (let i = 0; i < replacements.length; i++) {
    template = template.replaceAll(
      new RegExp(replacements[i].key, "g"),
      replacements[i].value,
    );
  }

  return template;
}

export async function fetchCSS(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const cssText = await response.text();
    return cssText;
  } catch (error) {
    console.error("Error fetching CSS:", error);
    return null;
  }
}

export function writeRSS(
  rssData,
  entries,
  writePath = path.join(DIST_PATH, "rss.xml"),
) {
  var feed = new Feed({
    title: rssData.title,
    description: "",
    id: rssData.siteUrl,
    link: rssData.siteUrl,
    language: "en",
    //image: "http://example.com/image.png",
    favicon: rssData.siteUrl + "/favicon.png",
    copyright: "All rights reserved 2024, " + rssData.authorName,
    //updated: new Date(), // optional, default = today
    /*
    feedLinks: {
      json: "https://example.com/json",
      atom: "https://example.com/atom"
    },
    */
    author: {
      name: rssData.authorName,
      email: rssData.authorEmail,
      link: rssData.authorSite,
    },
  });

  //console.log(entries);

  entries.forEach((entry) => {
    feed.addItem({
      title: entry.title,
      id: entry.url,
      link: entry.url,
      //description: post.description,
      content: entry.description,
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

  // Output: RSS 2.0
  fs.writeFile(writePath, feed.rss2(), (err) => {
    if (err) throw err;
    console.log("The RSS file has been saved!");
  });
}

export async function resizeJpg(path, output, size) {
  var promise = new Promise(function (resolve, reject) {
    sharp(path)
      .resize({ width: size, withoutEnlargement: true })
      .jpeg({
        quality: 80,
        trellisQuantisation: true,
        force: false,
      })
      .toFile(output, (err, info) => {
        if (err) {
          reject(err);
        }
        resolve(output);
      });
  });
  return promise;
}

export async function resizePng(path, output, size) {
  var promise = new Promise(function (resolve, reject) {
    sharp(path)
      .resize({ width: size, withoutEnlargement: true })
      .png({
        palette: true,
      })
      .toFile(output, (err, info) => {
        if (err) {
          reject(err);
        }
        resolve(output);
      });
  });
  return promise;
}

export async function writeImages(contentDir = SRC_PATH, distDir = DIST_PATH) {
  console.log("WRITE PHOTOS", contentDir + "/**/*.png");

  let jpgs = globSync(contentDir + "/**/*.{gif,jpg}");
  for (var i = 0; i < jpgs.length; i++) {
    console.log(contentDir, jpgs[i]);
    resizeJpg(jpgs[i], swapRootDir(jpgs[i], distDir), 2000);
  }

  let pngs = globSync(contentDir + "/**/*.png");

  for (var i = 0; i < pngs.length; i++) {
    console.log(contentDir, pngs[i]);
    resizePng(pngs[i], swapRootDir(pngs[i], distDir), 2000);
  }

  let svgs = globSync(contentDir + "/**/*.svg");
  console.log("SVGs", svgs);
  for (var i = 0; i < svgs.length; i++) {
    fs.copyFileSync(svgs[i], swapRootDir(svgs[i], distDir));
  }

  let videos = globSync(contentDir + "/**/*.mp4");
  console.log("Videos", videos);
  for (var i = 0; i < videos.length; i++) {
    fs.copyFileSync(videos[i], swapRootDir(videos[i], distDir));
  }
}

/**
 * Recursively creates a directory tree at the destination path
 * that mirrors the directory tree at the source path.
 *
 * @param {string} src - The source directory path.
 * @param {string} dest - The destination directory path.
 */
export function mirrorDirectory(src = SRC_PATH, dest = DIST_PATH) {
  // Check if the source directory exists
  if (!fs.existsSync(src)) {
    console.error(`Source directory "${src}" does not exist.`);
    process.exit(1);
  }

  // Create the destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read the contents of the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  // Iterate over the contents of the source directory
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively mirror the subdirectory
      mirrorDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      // Create an empty file at the destination path
      //fs.closeSync(fs.openSync(destPath, "w"));
    }
  }
}

export function swapRootDir(originalPath, newRootFolder) {
  // Normalize the original path to handle different OS path formats
  const normalizedPath = path.normalize(originalPath);

  // Split the path into an array of folders
  const pathParts = normalizedPath.split(path.sep);

  // Replace the first folder with the new root folder
  pathParts[0] = newRootFolder;

  // Join the path parts back into a single path string
  const newPath = path.join(...pathParts);

  return newPath;
}

/*
 * -------------------------
 * Helper functions
 * -------------------------
 */
function chunkArray(myArray, chunk_size) {
  var results = [];

  while (myArray.length) {
    results.push(myArray.splice(0, chunk_size));
  }

  return results;
}
