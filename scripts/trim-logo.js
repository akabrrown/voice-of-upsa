const sharp = require("sharp");
const path = require("path");

async function processImage() {
  const inputPath = path.join(__dirname, "..", "public", "IMG-20260930-WA0033.jpg");
  const logoPath = path.join(__dirname, "..", "public", "logo.jpg");
  const iconPath = path.join(__dirname, "..", "app", "icon.png");

  try {
    console.log("Reading image:", inputPath);
    
    // First, let's get metadata to find the shortest dimension
    const metadata = await sharp(inputPath).metadata();
    const size = Math.min(metadata.width, metadata.height);

    // Create a circular SVG mask
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
      </svg>`
    );

    // 1. Crop to perfect square around the center, then apply circular mask
    // We will save this as a PNG so the outside of the circle is transparent
    const circularBuffer = await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .composite([{
        input: circleSvg,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    // Now save this perfectly circular, transparent-background image as logo.png
    // Wait, the app uses logo.jpg in many places. If we save as JPG, it will have a black/white background.
    // The user probably wants logo.png to support transparency, but the code references logo.jpg.
    // Let's save as logo.png and then we will update all references from logo.jpg to logo.png in the codebase!
    const logoPngPath = path.join(__dirname, "..", "public", "logo.png");
    
    await sharp(circularBuffer)
      .resize(512, 512, { fit: 'contain' })
      .toFile(logoPngPath);
      
    console.log("Saved circular logo to:", logoPngPath);

    // Save as favicon (icon.png)
    await sharp(circularBuffer)
      .resize(512, 512, { fit: 'contain' })
      .toFile(iconPath);
      
    console.log("Saved favicon icon to:", iconPath);

  } catch (err) {
    console.error("Error processing image:", err);
  }
}

processImage();
