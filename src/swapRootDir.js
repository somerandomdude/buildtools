import path from "path";

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
