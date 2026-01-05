import fs from "fs";

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
