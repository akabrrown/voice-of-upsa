const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function processImage() {
  const inputPath = path.join(__dirname, "..", "public", "IMG-20260930-WA0033.jpg");
  const logoPath = path.join(__dirname, "..", "public", "logo.jpg");
  const iconPath = path.join(__dirname, "..", "app", "icon.png");

  try {
    console.log("Reading image:", inputPath);
    
    // Trim trims "boring" pixels (e.g. whitespace background) from all edges
    const image = sharp(inputPath).trim();

    // Save as logo
    await image
      .jpeg({ quality: 90 })
      .toFile(logoPath);
    console.log("Saved cropped logo to:", logoPath);

    // Save as icon (needs to be square usually, let's just resize it to fit within a square and make background transparent/white)
    // First, let's get the trimmed image buffer so we can resize it
    const trimmedBuffer = await image.toBuffer();
    
    await sharp(trimmedBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // white background
      })
      .png()
      .toFile(iconPath);
    console.log("Saved favicon icon to:", iconPath);

  } catch (err) {
    console.error("Error processing image:", err);
  }
}

processImage();
