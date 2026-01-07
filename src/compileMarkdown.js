import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";
import customHeadingId from "marked-custom-heading-id";
import frontMatter from "front-matter";

marked.setOptions({});
marked.use(markedSmartypants(), customHeadingId());

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
