const sharp = require("sharp");
const path = require("path");

async function processImage() {
  const inputPath = path.join(__dirname, "..", "public", "IMG-20260930-WA0033.jpg");
  const logoPath = path.join(__dirname, "..", "public", "logo.png");
  const iconPath = path.join(__dirname, "..", "app", "icon.png");

  try {
    console.log("Reading image:", inputPath);
    
    // First, let's aggressively trim any white/boring background from the edges
    // This ensures the logo perfectly touches the edges of the image bounding box.
    const trimmedBuffer = await sharp(inputPath)
      .trim({
        threshold: 20 // Adjust threshold if needed
      })
      .toBuffer();

    // Get the exact dimensions of the trimmed image
    const metadata = await sharp(trimmedBuffer).metadata();
    const size = Math.min(metadata.width, metadata.height);

    // Create a circular SVG mask perfectly matched to the trimmed logo size
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
      </svg>`
    );

    // Now, take the trimmed image, crop it to a perfect square, and apply the circular mask
    const circularBuffer = await sharp(trimmedBuffer)
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

    // Save out the perfectly cropped and masked image
    await sharp(circularBuffer)
      .resize(512, 512, { fit: 'contain' })
      .toFile(logoPath);
      
    console.log("Saved perfectly cropped circular logo to:", logoPath);

    // Save as favicon
    await sharp(circularBuffer)
      .resize(512, 512, { fit: 'contain' })
      .toFile(iconPath);
      
    console.log("Saved perfectly cropped favicon icon to:", iconPath);

  } catch (err) {
    console.error("Error processing image:", err);
  }
}

processImage();
