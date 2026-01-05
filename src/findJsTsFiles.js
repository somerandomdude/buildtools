import fs from "fs";
import path from "path";

/**
 * Recursively searches a directory for JavaScript and TypeScript files.
 *
 * @deprecated Use getFilesByType(dir, '.js') or getFilesByType(dir, '.ts') instead.
 * @param {string} dir - The directory path to search in.
 * @param {string[]} [fileList=[]] - Accumulator array for recursive calls. Typically not provided by caller.
 * @returns {string[]} An array of file paths ending with .js or .ts.
 * @throws {Error} If dir is not a string or is empty.
 * @throws {Error} If the directory does not exist.
 * @throws {Error} If the path is not a directory.
 *
 * @example
 * const jsFiles = findJsTsFiles('./src');
 * // Returns: ['./src/index.js', './src/utils/helpers.ts']
 */
export function findJsTsFiles(dir, fileList = []) {
  // Validate dir parameter
  if (typeof dir !== "string" || dir.trim() === "") {
    throw new Error(
      "findJsTsFiles: 'dir' must be a non-empty string. Received: " +
        (typeof dir === "string" ? `"${dir}"` : typeof dir),
    );
  }

  // Check if directory exists
  if (!fs.existsSync(dir)) {
    throw new Error(`findJsTsFiles: Directory "${dir}" does not exist.`);
  }

  // Check if path is a directory
  const stats = fs.statSync(dir);
  if (!stats.isDirectory()) {
    throw new Error(`findJsTsFiles: Path "${dir}" is not a directory.`);
  }

  // Validate fileList is an array
  if (!Array.isArray(fileList)) {
    throw new Error(
      "findJsTsFiles: 'fileList' must be an array. Received: " +
        typeof fileList,
    );
  }

  // Read the contents of the directory
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    // Construct the full path of the file
    const filePath = path.join(dir, file);
    // Get the stats of the file to check if it's a file or directory
    const fileStats = fs.statSync(filePath);

    if (fileStats.isDirectory()) {
      // If it's a directory, recursively search within it
      findJsTsFiles(filePath, fileList);
    } else if (
      fileStats.isFile() &&
      (file.endsWith(".js") || file.endsWith(".ts"))
    ) {
      // If it's a file and ends with .js or .ts, add it to the list
      fileList.push(filePath);
    }
  });

  return fileList;
}
