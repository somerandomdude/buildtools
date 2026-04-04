import fs from "fs";
import { globSync } from "glob";
import { SRC_PATH, DIST_PATH } from "./constants.js";
import { swapRootDir } from "./swapRootDir.js";
import { resizeJpg } from "./resizeJpg.js";
import { resizePng } from "./resizePng.js";

/**
 * Processes and copies all images and videos from source to destination directory.
 * JPG/GIF images are resized, PNG images are optimized, SVG and MP4 files are copied as-is.
 *
 * @async
 * @param {string} [contentDir=SRC_PATH] - The source directory containing images.
 * @param {string} [distDir=DIST_PATH] - The destination directory for processed images.
 * @returns {Promise<void>}
 * @throws {Error} If contentDir is not a string or is empty.
 * @throws {Error} If distDir is not a string or is empty.
 * @throws {Error} If the source directory does not exist.
 * @throws {Error} If the destination directory does not exist.
 *
 * @example
 * await writeImages('./src/content', './dist/content');
 */
export async function writeImages(contentDir = SRC_PATH, distDir = DIST_PATH) {
  // Validate contentDir parameter
  if (typeof contentDir !== "string" || contentDir.trim() === "") {
    throw new Error(
      "writeImages: 'contentDir' must be a non-empty string. Received: " +
        (typeof contentDir === "string"
          ? `"${contentDir}"`
          : typeof contentDir),
    );
  }

  // Validate distDir parameter
  if (typeof distDir !== "string" || distDir.trim() === "") {
    throw new Error(
      "writeImages: 'distDir' must be a non-empty string. Received: " +
        (typeof distDir === "string" ? `"${distDir}"` : typeof distDir),
    );
  }

  // Check if source directory exists
  if (!fs.existsSync(contentDir)) {
    throw new Error(
      `writeImages: Source directory "${contentDir}" does not exist.`,
    );
  }

  // Check if destination directory exists
  if (!fs.existsSync(distDir)) {
    throw new Error(
      `writeImages: Destination directory "${distDir}" does not exist.`,
    );
  }

  const MAX_IMAGE_WIDTH = 2000;
  const files = globSync(contentDir + "/**/*.{gif,jpg,png,svg,mp4}");

  const promises = files.map((file) => {
    const dest = swapRootDir(file, distDir);
    const ext = file.split(".").pop().toLowerCase();

    if (ext === "jpg" || ext === "gif") {
      return resizeJpg(file, dest, MAX_IMAGE_WIDTH);
    }
    if (ext === "png") {
      return resizePng(file, dest, MAX_IMAGE_WIDTH);
    }
    return fs.promises.copyFile(file, dest);
  });

  await Promise.all(promises);
}
