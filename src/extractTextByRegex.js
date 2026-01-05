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
