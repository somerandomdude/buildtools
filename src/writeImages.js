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

  let jpgs = globSync(contentDir + "/**/*.{gif,jpg}");
  for (var i = 0; i < jpgs.length; i++) {
    resizeJpg(jpgs[i], swapRootDir(jpgs[i], distDir), 2000);
  }

  let pngs = globSync(contentDir + "/**/*.png");

  for (var i = 0; i < pngs.length; i++) {
    resizePng(pngs[i], swapRootDir(pngs[i], distDir), 2000);
  }

  let svgs = globSync(contentDir + "/**/*.svg");
  for (var i = 0; i < svgs.length; i++) {
    fs.copyFileSync(svgs[i], swapRootDir(svgs[i], distDir));
  }

  let videos = globSync(contentDir + "/**/*.mp4");
  for (var i = 0; i < videos.length; i++) {
    fs.copyFileSync(videos[i], swapRootDir(videos[i], distDir));
  }
}
