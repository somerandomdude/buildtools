/**
 * Generates HTML Open Graph meta tag markup.
 *
 * @param {Object} options - The OG tag options
 * @param {string} [options.title] - The og:title value
 * @param {string} [options.description] - The og:description value
 * @param {string} [options.url] - The og:url value
 * @param {string} [options.type] - The og:type value (e.g., "website", "article")
 * @param {string} [options.imageUrl] - The og:image value
 * @param {string} [options.imageAlt] - The og:image:alt value
 * @param {number} [options.imageWidth] - The og:image:width value
 * @param {number} [options.imageHeight] - The og:image:height value
 * @returns {string} - The generated OG meta tag markup
 */
export function generateOgTags(options = {}) {
  const tags = [];

  if (options.title) {
    tags.push(`<meta property="og:title" content="${escapeHtml(options.title)}" />`);
  }

  if (options.description) {
    tags.push(`<meta property="og:description" content="${escapeHtml(options.description)}" />`);
  }

  if (options.url) {
    tags.push(`<meta property="og:url" content="${escapeHtml(options.url)}" />`);
  }

  if (options.type) {
    tags.push(`<meta property="og:type" content="${escapeHtml(options.type)}" />`);
  }

  if (options.imageUrl) {
    tags.push(`<meta property="og:image" content="${escapeHtml(options.imageUrl)}" />`);

    const imageType = getImageMimeType(options.imageUrl);
    if (imageType) {
      tags.push(`<meta property="og:image:type" content="${imageType}" />`);
    }

    if (options.imageAlt) {
      tags.push(`<meta property="og:image:alt" content="${escapeHtml(options.imageAlt)}" />`);
    }

    if (options.imageWidth) {
      tags.push(`<meta property="og:image:width" content="${options.imageWidth}" />`);
    }

    if (options.imageHeight) {
      tags.push(`<meta property="og:image:height" content="${options.imageHeight}" />`);
    }
  }

  return tags.join("\n");
}

/**
 * Determines the MIME type based on the image URL extension.
 *
 * @param {string} imageUrl - The image URL
 * @returns {string|null} - The MIME type or null if not recognized
 */
function getImageMimeType(imageUrl) {
  const extension = imageUrl.split(".").pop()?.toLowerCase().split("?")[0];

  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
  };

  return mimeTypes[extension] || null;
}

/**
 * Escapes HTML special characters in a string.
 *
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(str).replace(/[&<>"']/g, (char) => htmlEntities[char]);
}
