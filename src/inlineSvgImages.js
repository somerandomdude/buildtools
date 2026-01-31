import fs from "fs";
import path from "path";

/**
 * Parses an HTML document and replaces <img> tags referencing SVG files
 * with the actual SVG markup.
 *
 * - Preserves classes from the img tag and adds them to the SVG element
 * - If a hash exists in the src (e.g., "icon.svg#dark"), adds it as data-modifier attribute
 *
 * @param {string} html - The HTML content to process
 * @param {string} basePath - The base directory path for resolving relative SVG file paths
 * @returns {string} - The processed HTML with inlined SVGs
 */
export function inlineSvgImages(html, basePath) {
  const imgTagRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+\.svg(?:#[^"']*)?)["'][^>]*\/?>/gi;

  return html.replace(imgTagRegex, (match, srcValue) => {
    const classMatch = match.match(/class\s*=\s*["']([^"']*)["']/i);
    const classes = classMatch ? classMatch[1] : "";

    let svgPath = srcValue;
    let modifier = null;

    const hashIndex = srcValue.indexOf("#");
    if (hashIndex !== -1) {
      svgPath = srcValue.substring(0, hashIndex);
      modifier = srcValue.substring(hashIndex + 1);
    }

    const fullPath = path.isAbsolute(svgPath)
      ? svgPath
      : path.resolve(basePath, svgPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`SVG file not found: ${fullPath}`);
      return match;
    }

    let svgContent = fs.readFileSync(fullPath, "utf8");

    svgContent = svgContent.replace(/<\?xml[^>]*\?>\s*/gi, "");
    svgContent = svgContent.replace(/<!DOCTYPE[^>]*>\s*/gi, "");

    if (classes || modifier) {
      svgContent = svgContent.replace(/<svg(\s|>)/i, (svgMatch, after) => {
        let attributes = "";

        if (classes) {
          const existingClassMatch = svgContent.match(/<svg[^>]*class\s*=\s*["']([^"']*)["']/i);
          if (existingClassMatch) {
            svgContent = svgContent.replace(
              /(<svg[^>]*class\s*=\s*["'])([^"']*)(["'])/i,
              `$1$2 ${classes}$3`
            );
            attributes = "";
          } else {
            attributes += ` class="${classes}"`;
          }
        }

        if (modifier) {
          attributes += ` data-modifier="${modifier}"`;
        }

        return `<svg${attributes}${after}`;
      });
    }

    return svgContent;
  });
}
