import fs from "fs";
import { DIST_PATH } from "./constants.js";
import { swapRootDir } from "./swapRootDir.js";

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
