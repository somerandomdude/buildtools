import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Resizes a PNG image to a specified width while maintaining aspect ratio.
 *
 * @async
 * @param {string} imagePath - The path to the source PNG image file.
 * @param {string} output - The path for the output resized image.
 * @param {number} size - The target width in pixels.
 * @returns {Promise<string>} A promise that resolves to the output path on success.
 * @throws {Error} If imagePath is not a string or is empty.
 * @throws {Error} If output is not a string or is empty.
 * @throws {Error} If size is not a positive number.
 * @throws {Error} If the source image does not exist.
 *
 * @example
 * await resizePng('./src/image.png', './dist/image.png', 800);
 */
export async function resizePng(imagePath, output, size) {
  // Validate imagePath parameter
  if (typeof imagePath !== "string" || imagePath.trim() === "") {
    throw new Error(
      "resizePng: 'imagePath' must be a non-empty string. Received: " +
        (typeof imagePath === "string" ? `"${imagePath}"` : typeof imagePath),
    );
  }

  // Validate output parameter
  if (typeof output !== "string" || output.trim() === "") {
    throw new Error(
      "resizePng: 'output' must be a non-empty string. Received: " +
        (typeof output === "string" ? `"${output}"` : typeof output),
    );
  }

  // Validate size parameter
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    throw new Error(
      "resizePng: 'size' must be a positive number. Received: " + size,
    );
  }

  // Check if source file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`resizePng: Source image "${imagePath}" does not exist.`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(output);
  if (outputDir && !fs.existsSync(outputDir)) {
    throw new Error(
      `resizePng: Output directory "${outputDir}" does not exist.`,
    );
  }

  var promise = new Promise(function (resolve, reject) {
    sharp(imagePath)
      .resize({ width: size, withoutEnlargement: true })
      .png({
        palette: true,
      })
      .toFile(output, (err, info) => {
        if (err) {
          reject(
            new Error(
              `resizePng: Failed to resize image "${imagePath}". ${err.message}`,
            ),
          );
        }
        resolve(output);
      });
  });
  return promise;
}
