import fs from "fs";
import path from "path";
import { SRC_PATH, DIST_PATH } from "./constants.js";

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
