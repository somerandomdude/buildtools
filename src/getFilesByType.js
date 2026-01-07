import fs from "fs";
import path from "path";

/**
 * Recursively searches a directory for files with a specific extension.
 *
 * @param {string} dir - The directory path to search in.
 * @param {string} ext - The file extension to filter by (e.g., '.md', '.html').
 * @param {string[]} [fileList=[]] - Accumulator array for recursive calls. Typically not provided by caller.
 * @returns {string[]} An array of file paths matching the specified extension.
 * @throws {Error} If dir is not a string or is empty.
 * @throws {Error} If ext is not a string or is empty.
 * @throws {Error} If the directory does not exist.
 * @throws {Error} If the path is not a directory.
 *
 * @example
 * const mdFiles = getFilesByType('./content', '.md');
 * // Returns: ['./content/post1.md', './content/blog/post2.md']
 */
export function getFilesByType(dir, ext, fileList = []) {
  // Validate dir parameter
  if (typeof dir !== "string" || dir.trim() === "") {
    throw new Error(
      "getFilesByType: 'dir' must be a non-empty string. Received: " +
        (typeof dir === "string" ? `"${dir}"` : typeof dir),
    );
  }

  // Validate ext parameter
  if (typeof ext !== "string" || ext.trim() === "") {
    throw new Error(
      "getFilesByType: 'ext' must be a non-empty string. Received: " +
        (typeof ext === "string" ? `"${ext}"` : typeof ext),
    );
  }

  // Check if directory exists
  if (!fs.existsSync(dir)) {
    throw new Error(`getFilesByType: Directory "${dir}" does not exist.`);
  }

  // Check if path is a directory
  const stats = fs.statSync(dir);
  if (!stats.isDirectory()) {
    throw new Error(`getFilesByType: Path "${dir}" is not a directory.`);
  }

  // Validate fileList is an array
  if (!Array.isArray(fileList)) {
    throw new Error(
      "getFilesByType: 'fileList' must be an array. Received: " +
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
      getFilesByType(filePath, ext, fileList);
    } else if (fileStats.isFile() && file.endsWith(ext)) {
      // If it's a file and ends with the extension, add it to the list
      fileList.push(filePath);
    }
  });

  return fileList;
}
