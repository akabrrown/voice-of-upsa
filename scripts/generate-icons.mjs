// This script generates basic PWA icons
// You can replace these with proper icons later

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon as placeholder
const svgIcon = `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="192" height="192" fill="#001F3F"/>
<rect x="24" y="48" width="144" height="96" fill="#FFD700"/>
<text x="96" y="108" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#001F3F">VOU</text>
</svg>`;

// Write SVG files for different sizes
const sizes = [192, 512];
sizes.forEach(size => {
  const svgContent = svgIcon.replace(/width="192" height="192"/, `width="${size}" height="${size}"`);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svgContent);
});

console.log('PWA icons created successfully!');
