import fs from "fs";
import path from "path";
import { Feed } from "feed";
import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";
import customHeadingId from "marked-custom-heading-id";
import frontMatter from "front-matter";
import sharp from "sharp";
import { globSync } from "glob";

/** @constant {string} SRC_PATH - Default source directory path */
export const SRC_PATH = "./src";

/** @constant {string} DIST_PATH - Default distribution directory path */
export const DIST_PATH = "./dist";

marked.setOptions({});
marked.use(markedSmartypants(), customHeadingId());

/**
 * Recursively searches a directory for files with a specific extension.
 *
 * @param {string} dir - The directory path to search in.
 * @param {string} ext - The file extension to filter by (e.g., '.md', '.html').
 * @param {string[]} [fileList=[]] - Accumulator array for recursive calls. Typically not provided by caller.
 * @returns {string[]} An array of file paths matching the specified extension.
 * @throws {Error} If dir is not a string or is empty.
 * @throws {Error} If ext is not a string or is empty.
 * @throws {Error} If the directory does not exist.
 * @throws {Error} If the path is not a directory.
 *
 * @example
 * const mdFiles = getFilesByType('./content', '.md');
 * // Returns: ['./content/post1.md', './content/blog/post2.md']
 */
export function getFilesByType(dir, ext, fileList = []) {
  // Validate dir parameter
  if (typeof dir !== "string" || dir.trim() === "") {
    throw new Error(
      "getFilesByType: 'dir' must be a non-empty string. Received: " +
        (typeof dir === "string" ? `"${dir}"` : typeof dir),
    );
  }

  // Validate ext parameter
  if (typeof ext !== "string" || ext.trim() === "") {
    throw new Error(
      "getFilesByType: 'ext' must be a non-empty string. Received: " +
        (typeof ext === "string" ? `"${ext}"` : typeof ext),
    );
  }

  // Check if directory exists
  if (!fs.existsSync(dir)) {
    throw new Error(`getFilesByType: Directory "${dir}" does not exist.`);
  }

  // Check if path is a directory
  const stats = fs.statSync(dir);
  if (!stats.isDirectory()) {
    throw new Error(`getFilesByType: Path "${dir}" is not a directory.`);
  }

  // Validate fileList is an array
  if (!Array.isArray(fileList)) {
    throw new Error(
      "getFilesByType: 'fileList' must be an array. Received: " +
        typeof fileList,
    );
  }

  // Read the contents of the directory
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    // Construct the full path of the file
    const filePath = path.join(dir, file);
    // Get the stats of the file to check if it's a file or directory
    const fileStats = fs.statSync(filePath);

    if (fileStats.isDirectory()) {
      // If it's a directory, recursively search within it
      getFilesByType(filePath, ext, fileList);
    } else if (fileStats.isFile() && file.endsWith(ext)) {
      // If it's a file and ends with the extension, add it to the list
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Recursively searches a directory for JavaScript and TypeScript files.
 *
 * @deprecated Use getFilesByType(dir, '.js') or getFilesByType(dir, '.ts') instead.
 * @param {string} dir - The directory path to search in.
 * @param {string[]} [fileList=[]] - Accumulator array for recursive calls. Typically not provided by caller.
 * @returns {string[]} An array of file paths ending with .js or .ts.
 * @throws {Error} If dir is not a string or is empty.
 * @throws {Error} If the directory does not exist.
 * @throws {Error} If the path is not a directory.
 *
 * @example
 * const jsFiles = findJsTsFiles('./src');
 * // Returns: ['./src/index.js', './src/utils/helpers.ts']
 */
export function findJsTsFiles(dir, fileList = []) {
  // Validate dir parameter
  if (typeof dir !== "string" || dir.trim() === "") {
    throw new Error(
      "findJsTsFiles: 'dir' must be a non-empty string. Received: " +
        (typeof dir === "string" ? `"${dir}"` : typeof dir),
    );
  }

  // Check if directory exists
  if (!fs.existsSync(dir)) {
    throw new Error(`findJsTsFiles: Directory "${dir}" does not exist.`);
  }

  // Check if path is a directory
  const stats = fs.statSync(dir);
  if (!stats.isDirectory()) {
    throw new Error(`findJsTsFiles: Path "${dir}" is not a directory.`);
  }

  // Validate fileList is an array
  if (!Array.isArray(fileList)) {
    throw new Error(
      "findJsTsFiles: 'fileList' must be an array. Received: " +
        typeof fileList,
    );
  }

  // Read the contents of the directory
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    // Construct the full path of the file
    const filePath = path.join(dir, file);
    // Get the stats of the file to check if it's a file or directory
    const fileStats = fs.statSync(filePath);

    if (fileStats.isDirectory()) {
      // If it's a directory, recursively search within it
      findJsTsFiles(filePath, fileList);
    } else if (
      fileStats.isFile() &&
      (file.endsWith(".js") || file.endsWith(".ts"))
    ) {
      // If it's a file and ends with .js or .ts, add it to the list
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Initializes the distribution directory by removing any existing dist folder
 * and creating a fresh one with optional subdirectories.
 *
 * @param {string[]} [paths=[]] - An array of subdirectory names to create inside the dist folder.
 * @returns {void}
 * @throws {Error} If paths is not an array.
 * @throws {Error} If any path in the array is not a string.
 *
 * @example
 * setupDist(['css', 'js', 'images']);
 * // Creates: ./dist/, ./dist/css/, ./dist/js/, ./dist/images/
 */
export function setupDist(paths = []) {
  // Validate paths parameter
  if (!Array.isArray(paths)) {
    throw new Error(
      "setupDist: 'paths' must be an array. Received: " + typeof paths,
    );
  }

  // Validate each path in the array
  for (let i = 0; i < paths.length; i++) {
    if (typeof paths[i] !== "string") {
      throw new Error(
        `setupDist: Each path must be a string. paths[${i}] is ${typeof paths[i]}.`,
      );
    }
    if (paths[i].trim() === "") {
      throw new Error(`setupDist: Path at index ${i} is an empty string.`);
    }
  }

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

/**
 * Copies an array of files to a destination directory, preserving relative paths
 * by swapping the root directory.
 *
 * @param {string[]} files - An array of file paths to copy.
 * @param {string} [destination=DIST_PATH] - The destination directory path.
 * @returns {void}
 * @throws {Error} If files is not an array.
 * @throws {Error} If files array is empty.
 * @throws {Error} If any file path is not a string.
 * @throws {Error} If destination is not a string.
 * @throws {Error} If a source file does not exist.
 *
 * @example
 * copyFiles(['./src/style.css', './src/app.js'], './dist');
 * // Copies to: ./dist/style.css, ./dist/app.js
 */
export function copyFiles(files, destination = DIST_PATH) {
  // Validate files parameter
  if (!Array.isArray(files)) {
    throw new Error(
      "copyFiles: 'files' must be an array. Received: " + typeof files,
    );
  }

  if (files.length === 0) {
    throw new Error("copyFiles: 'files' array is empty. Nothing to copy.");
  }

  // Validate destination parameter
  if (typeof destination !== "string" || destination.trim() === "") {
    throw new Error(
      "copyFiles: 'destination' must be a non-empty string. Received: " +
        (typeof destination === "string"
          ? `"${destination}"`
          : typeof destination),
    );
  }

  for (let i = 0; i < files.length; i++) {
    // Validate each file path
    if (typeof files[i] !== "string") {
      throw new Error(
        `copyFiles: Each file path must be a string. files[${i}] is ${typeof files[i]}.`,
      );
    }

    if (files[i].trim() === "") {
      throw new Error(`copyFiles: File path at index ${i} is an empty string.`);
    }

    // Check if source file exists
    if (!fs.existsSync(files[i])) {
      throw new Error(`copyFiles: Source file "${files[i]}" does not exist.`);
    }

    fs.copyFileSync(files[i], swapRootDir(files[i], destination));
  }
}

/**
 * Recursively copies all files and directories from source to destination
 * with an optional filter function.
 *
 * @param {string} src - The source directory path.
 * @param {string} dest - The destination directory path.
 * @param {Function} [filter=() => true] - A filter function that receives the source path
 *   and returns true to include or false to exclude the file/directory.
 * @returns {void}
 * @throws {Error} If src is not a string or is empty.
 * @throws {Error} If dest is not a string or is empty.
 * @throws {Error} If filter is not a function.
 * @throws {Error} If the source directory does not exist.
 *
 * @example
 * // Copy all files except .map files
 * copyAllFiles('./src', './dist', (src) => !src.endsWith('.map'));
 */
export function copyAllFiles(
  src,
  dest,
  filter = function () {
    return true;
  },
) {
  // Validate src parameter
  if (typeof src !== "string" || src.trim() === "") {
    throw new Error(
      "copyAllFiles: 'src' must be a non-empty string. Received: " +
        (typeof src === "string" ? `"${src}"` : typeof src),
    );
  }

  // Validate dest parameter
  if (typeof dest !== "string" || dest.trim() === "") {
    throw new Error(
      "copyAllFiles: 'dest' must be a non-empty string. Received: " +
        (typeof dest === "string" ? `"${dest}"` : typeof dest),
    );
  }

  // Validate filter parameter
  if (typeof filter !== "function") {
    throw new Error(
      "copyAllFiles: 'filter' must be a function. Received: " + typeof filter,
    );
  }

  // Check if source directory exists
  if (!fs.existsSync(src)) {
    throw new Error(`copyAllFiles: Source directory "${src}" does not exist.`);
  }

  fs.cpSync(src, dest, { recursive: true, filter: filter });
}

/**
 * Parses a markdown file with front matter and converts it to HTML.
 * Extracts metadata from YAML front matter and renders the markdown body.
 *
 * @param {string} markdown - The raw markdown string including front matter.
 * @param {Object} [opts={}] - Optional configuration options.
 * @param {string} [opts.url] - The full URL for the entry.
 * @param {string} [opts.uri] - The URI path for the entry.
 * @param {string} [opts.nextEntry] - Reference to the next entry in a series.
 * @returns {Object} An entry object containing:
 *   - {Object} attributes - The parsed front matter attributes.
 *   - {string} body - The raw markdown body.
 *   - {string} title - The title from front matter.
 *   - {Date} date - The parsed date from front matter.
 *   - {string} description - The description from front matter.
 *   - {string} lastmod - The last modified date from front matter.
 *   - {string} hero - The hero image path from front matter.
 *   - {string} hero_alt - The hero image alt text from front matter.
 *   - {string} content - The rendered HTML content.
 *   - {Date} dateUTC - The last modified date or original date as Date object.
 *   - {string} url - The full URL (from opts).
 *   - {string} uri - The URI path (from opts).
 *   - {string} nextEntry - The next entry reference (from opts).
 * @throws {Error} If markdown is not a string.
 * @throws {Error} If opts is not an object.
 *
 * @example
 * const md = `---
 * title: My Post
 * date: 2024-01-15
 * ---
 * # Hello World`;
 * const entry = compileMarkdown(md, { url: 'https://example.com/post' });
 */
export function compileMarkdown(markdown, opts = {}) {
  // Validate markdown parameter
  if (typeof markdown !== "string") {
    throw new Error(
      "compileMarkdown: 'markdown' must be a string. Received: " +
        typeof markdown,
    );
  }

  // Validate opts parameter
  if (opts === null || typeof opts !== "object" || Array.isArray(opts)) {
    throw new Error(
      "compileMarkdown: 'opts' must be an object. Received: " +
        (opts === null ? "null" : Array.isArray(opts) ? "array" : typeof opts),
    );
  }

  let entry;
  try {
    entry = frontMatter(markdown);
  } catch (err) {
    throw new Error(
      "compileMarkdown: Failed to parse front matter. " + err.message,
    );
  }

  entry.title = entry.attributes.title;
  entry.date = new Date(entry.attributes.date);
  entry.description = entry.attributes.description;
  entry.lastmod = entry.attributes.lastmod;
  entry.hero = entry.attributes.hero;
  entry.hero_alt = entry.attributes.hero_alt;

  try {
    entry.content = marked(entry.body);
  } catch (err) {
    throw new Error(
      "compileMarkdown: Failed to parse markdown body. " + err.message,
    );
  }

  entry.dateUTC = entry.lastmod
    ? new Date(entry.lastmod)
    : new Date(entry.date);
  entry.url = opts.url ?? "";
  entry.uri = opts.uri ?? "";
  entry.nextEntry = opts.nextEntry ?? "";

  return entry;
}

/**
 * Replaces placeholders in a template string with provided values.
 *
 * @param {string} template - The template string containing placeholders.
 * @param {Object[]} replacements - An array of replacement objects.
 * @param {string} replacements[].key - The placeholder pattern to search for (used as regex).
 * @param {string} replacements[].value - The value to replace the placeholder with.
 * @returns {string} The template string with all placeholders replaced.
 * @throws {Error} If template is not a string.
 * @throws {Error} If replacements is not an array.
 * @throws {Error} If any replacement object is missing 'key' or 'value' properties.
 *
 * @example
 * const template = '<h1>{{TITLE}}</h1><p>{{CONTENT}}</p>';
 * const result = buildFromTemplate(template, [
 *   { key: '{{TITLE}}', value: 'Hello' },
 *   { key: '{{CONTENT}}', value: 'World' }
 * ]);
 * // Returns: '<h1>Hello</h1><p>World</p>'
 */
export function buildFromTemplate(template, replacements) {
  // Validate template parameter
  if (typeof template !== "string") {
    throw new Error(
      "buildFromTemplate: 'template' must be a string. Received: " +
        typeof template,
    );
  }

  // Validate replacements parameter
  if (!Array.isArray(replacements)) {
    throw new Error(
      "buildFromTemplate: 'replacements' must be an array. Received: " +
        typeof replacements,
    );
  }

  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i];

    // Validate replacement object structure
    if (replacement === null || typeof replacement !== "object") {
      throw new Error(
        `buildFromTemplate: replacements[${i}] must be an object. Received: ` +
          (replacement === null ? "null" : typeof replacement),
      );
    }

    if (!("key" in replacement)) {
      throw new Error(
        `buildFromTemplate: replacements[${i}] is missing required property 'key'.`,
      );
    }

    if (!("value" in replacement)) {
      throw new Error(
        `buildFromTemplate: replacements[${i}] is missing required property 'value'.`,
      );
    }

    if (typeof replacement.key !== "string") {
      throw new Error(
        `buildFromTemplate: replacements[${i}].key must be a string. Received: ` +
          typeof replacement.key,
      );
    }

    template = template.replaceAll(
      new RegExp(replacement.key, "g"),
      String(replacement.value),
    );
  }

  return template;
}

/**
 * Fetches CSS content from a remote URL.
 *
 * @async
 * @param {string} url - The URL to fetch CSS from.
 * @returns {Promise<string|null>} The CSS text content, or null if fetch fails.
 * @throws {Error} If url is not a string or is empty.
 * @throws {Error} If url is not a valid URL format.
 *
 * @example
 * const css = await fetchCSS('https://cdn.example.com/styles.css');
 */
export async function fetchCSS(url) {
  // Validate url parameter
  if (typeof url !== "string" || url.trim() === "") {
    throw new Error(
      "fetchCSS: 'url' must be a non-empty string. Received: " +
        (typeof url === "string" ? `"${url}"` : typeof url),
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(`fetchCSS: '${url}' is not a valid URL.`);
  }

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

/**
 * Resizes a JPEG/GIF image to a specified width while maintaining aspect ratio.
 *
 * @async
 * @param {string} imagePath - The path to the source image file.
 * @param {string} output - The path for the output resized image.
 * @param {number} size - The target width in pixels.
 * @returns {Promise<string>} A promise that resolves to the output path on success.
 * @throws {Error} If imagePath is not a string or is empty.
 * @throws {Error} If output is not a string or is empty.
 * @throws {Error} If size is not a positive number.
 * @throws {Error} If the source image does not exist.
 *
 * @example
 * await resizeJpg('./src/image.jpg', './dist/image.jpg', 800);
 */
export async function resizeJpg(imagePath, output, size) {
  // Validate imagePath parameter
  if (typeof imagePath !== "string" || imagePath.trim() === "") {
    throw new Error(
      "resizeJpg: 'imagePath' must be a non-empty string. Received: " +
        (typeof imagePath === "string" ? `"${imagePath}"` : typeof imagePath),
    );
  }

  // Validate output parameter
  if (typeof output !== "string" || output.trim() === "") {
    throw new Error(
      "resizeJpg: 'output' must be a non-empty string. Received: " +
        (typeof output === "string" ? `"${output}"` : typeof output),
    );
  }

  // Validate size parameter
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    throw new Error(
      "resizeJpg: 'size' must be a positive number. Received: " + size,
    );
  }

  // Check if source file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`resizeJpg: Source image "${imagePath}" does not exist.`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(output);
  if (outputDir && !fs.existsSync(outputDir)) {
    throw new Error(
      `resizeJpg: Output directory "${outputDir}" does not exist.`,
    );
  }

  var promise = new Promise(function (resolve, reject) {
    sharp(imagePath)
      .resize({ width: size, withoutEnlargement: true })
      .jpeg({
        quality: 80,
        trellisQuantisation: true,
        force: false,
      })
      .toFile(output, (err, info) => {
        if (err) {
          reject(
            new Error(
              `resizeJpg: Failed to resize image "${imagePath}". ${err.message}`,
            ),
          );
        }
        resolve(output);
      });
  });
  return promise;
}

/**
 * Resizes a PNG image to a specified width while maintaining aspect ratio.
 *
 * @async
 * @param {string} imagePath - The path to the source PNG image file.
 * @param {string} output - The path for the output resized image.
 * @param {number} size - The target width in pixels.
 * @returns {Promise<string>} A promise that resolves to the output path on success.
 * @throws {Error} If imagePath is not a string or is empty.
 * @throws {Error} If output is not a string or is empty.
 * @throws {Error} If size is not a positive number.
 * @throws {Error} If the source image does not exist.
 *
 * @example
 * await resizePng('./src/image.png', './dist/image.png', 800);
 */
export async function resizePng(imagePath, output, size) {
  // Validate imagePath parameter
  if (typeof imagePath !== "string" || imagePath.trim() === "") {
    throw new Error(
      "resizePng: 'imagePath' must be a non-empty string. Received: " +
        (typeof imagePath === "string" ? `"${imagePath}"` : typeof imagePath),
    );
  }

  // Validate output parameter
  if (typeof output !== "string" || output.trim() === "") {
    throw new Error(
      "resizePng: 'output' must be a non-empty string. Received: " +
        (typeof output === "string" ? `"${output}"` : typeof output),
    );
  }

  // Validate size parameter
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    throw new Error(
      "resizePng: 'size' must be a positive number. Received: " + size,
    );
  }

  // Check if source file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`resizePng: Source image "${imagePath}" does not exist.`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(output);
  if (outputDir && !fs.existsSync(outputDir)) {
    throw new Error(
      `resizePng: Output directory "${outputDir}" does not exist.`,
    );
  }

  var promise = new Promise(function (resolve, reject) {
    sharp(imagePath)
      .resize({ width: size, withoutEnlargement: true })
      .png({
        palette: true,
      })
      .toFile(output, (err, info) => {
        if (err) {
          reject(
            new Error(
              `resizePng: Failed to resize image "${imagePath}". ${err.message}`,
            ),
          );
        }
        resolve(output);
      });
  });
  return promise;
}

/**
 * Processes and copies all images and videos from source to destination directory.
 * JPG/GIF images are resized, PNG images are optimized, SVG and MP4 files are copied as-is.
 *
 * @async
 * @param {string} [contentDir=SRC_PATH] - The source directory containing images.
 * @param {string} [distDir=DIST_PATH] - The destination directory for processed images.
 * @returns {Promise<void>}
 * @throws {Error} If contentDir is not a string or is empty.
 * @throws {Error} If distDir is not a string or is empty.
 * @throws {Error} If the source directory does not exist.
 * @throws {Error} If the destination directory does not exist.
 *
 * @example
 * await writeImages('./src/content', './dist/content');
 */
export async function writeImages(contentDir = SRC_PATH, distDir = DIST_PATH) {
  // Validate contentDir parameter
  if (typeof contentDir !== "string" || contentDir.trim() === "") {
    throw new Error(
      "writeImages: 'contentDir' must be a non-empty string. Received: " +
        (typeof contentDir === "string"
          ? `"${contentDir}"`
          : typeof contentDir),
    );
  }

  // Validate distDir parameter
  if (typeof distDir !== "string" || distDir.trim() === "") {
    throw new Error(
      "writeImages: 'distDir' must be a non-empty string. Received: " +
        (typeof distDir === "string" ? `"${distDir}"` : typeof distDir),
    );
  }

  // Check if source directory exists
  if (!fs.existsSync(contentDir)) {
    throw new Error(
      `writeImages: Source directory "${contentDir}" does not exist.`,
    );
  }

  // Check if destination directory exists
  if (!fs.existsSync(distDir)) {
    throw new Error(
      `writeImages: Destination directory "${distDir}" does not exist.`,
    );
  }

  let jpgs = globSync(contentDir + "/**/*.{gif,jpg}");
  for (var i = 0; i < jpgs.length; i++) {
    resizeJpg(jpgs[i], swapRootDir(jpgs[i], distDir), 2000);
  }

  let pngs = globSync(contentDir + "/**/*.png");

  for (var i = 0; i < pngs.length; i++) {
    resizePng(pngs[i], swapRootDir(pngs[i], distDir), 2000);
  }

  let svgs = globSync(contentDir + "/**/*.svg");
  for (var i = 0; i < svgs.length; i++) {
    fs.copyFileSync(svgs[i], swapRootDir(svgs[i], distDir));
  }

  let videos = globSync(contentDir + "/**/*.mp4");
  for (var i = 0; i < videos.length; i++) {
    fs.copyFileSync(videos[i], swapRootDir(videos[i], distDir));
  }
}

/**
 * Extracts text content from within a specified HTML tag.
 *
 * @param {string} htmlString - The HTML string to search in.
 * @param {string} tagName - The HTML tag name to extract content from.
 * @returns {string|null} The text content inside the tag, or null if not found.
 * @throws {Error} If htmlString is not a string.
 * @throws {Error} If tagName is not a string or is empty.
 *
 * @example
 * const html = '<h1>Hello World</h1><p>Content</p>';
 * const title = extractTextByRegex(html, 'h1');
 * // Returns: 'Hello World'
 */
export function extractTextByRegex(htmlString, tagName) {
  // Validate htmlString parameter
  if (typeof htmlString !== "string") {
    throw new Error(
      "extractTextByRegex: 'htmlString' must be a string. Received: " +
        typeof htmlString,
    );
  }

  // Validate tagName parameter
  if (typeof tagName !== "string" || tagName.trim() === "") {
    throw new Error(
      "extractTextByRegex: 'tagName' must be a non-empty string. Received: " +
        (typeof tagName === "string" ? `"${tagName}"` : typeof tagName),
    );
  }

  // Create a regular expression to match the text inside the specified tag
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, "i");
  const match = htmlString.match(regex);
  return match ? match[1] : null;
}

/**
 * Recursively creates a directory tree at the destination path
 * that mirrors the directory structure of the source path.
 * Only creates directories, does not copy files.
 *
 * @param {string} [src=SRC_PATH] - The source directory path to mirror.
 * @param {string} [dest=DIST_PATH] - The destination directory path.
 * @returns {void}
 * @throws {Error} If src is not a string or is empty.
 * @throws {Error} If dest is not a string or is empty.
 * @throws {Error} If the source directory does not exist.
 *
 * @example
 * mirrorDirectory('./src', './dist');
 * // Creates ./dist with the same folder structure as ./src
 */
export function mirrorDirectory(src = SRC_PATH, dest = DIST_PATH) {
  // Validate src parameter
  if (typeof src !== "string" || src.trim() === "") {
    throw new Error(
      "mirrorDirectory: 'src' must be a non-empty string. Received: " +
        (typeof src === "string" ? `"${src}"` : typeof src),
    );
  }

  // Validate dest parameter
  if (typeof dest !== "string" || dest.trim() === "") {
    throw new Error(
      "mirrorDirectory: 'dest' must be a non-empty string. Received: " +
        (typeof dest === "string" ? `"${dest}"` : typeof dest),
    );
  }

  // Check if the source directory exists
  if (!fs.existsSync(src)) {
    throw new Error(
      `mirrorDirectory: Source directory "${src}" does not exist.`,
    );
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
    }
  }
}

/**
 * Replaces the root directory of a file path with a new root folder.
 *
 * @param {string} originalPath - The original file path.
 * @param {string} newRootFolder - The new root folder name to replace the first directory.
 * @returns {string} The path with the root directory swapped.
 * @throws {Error} If originalPath is not a string or is empty.
 * @throws {Error} If newRootFolder is not a string or is empty.
 *
 * @example
 * swapRootDir('./src/css/style.css', './dist');
 * // Returns: './dist/css/style.css'
 */
export function swapRootDir(originalPath, newRootFolder) {
  // Validate originalPath parameter
  if (typeof originalPath !== "string" || originalPath.trim() === "") {
    throw new Error(
      "swapRootDir: 'originalPath' must be a non-empty string. Received: " +
        (typeof originalPath === "string"
          ? `"${originalPath}"`
          : typeof originalPath),
    );
  }

  // Validate newRootFolder parameter
  if (typeof newRootFolder !== "string" || newRootFolder.trim() === "") {
    throw new Error(
      "swapRootDir: 'newRootFolder' must be a non-empty string. Received: " +
        (typeof newRootFolder === "string"
          ? `"${newRootFolder}"`
          : typeof newRootFolder),
    );
  }

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
