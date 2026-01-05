import fs from "fs";
import { DIST_PATH } from "./constants.js";

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
