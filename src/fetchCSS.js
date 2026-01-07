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
