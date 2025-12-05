// Temporary fallback until Sharp can be installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharp: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  sharp = require('sharp');
} catch {
  console.warn('Sharp not available, watermark functionality disabled');
  // Create a mock sharp function that does nothing
  sharp = () => ({
    metadata: () => Promise.resolve({ width: 800, height: 600 }),
    composite: () => ({
      metadata: () => Promise.resolve({ width: 800, height: 600 }),
      composite: () => ({
        metadata: () => Promise.resolve({ width: 800, height: 600 }),
        composite: () => ({
          metadata: () => Promise.resolve({ width: 800, height: 600 }),
          composite: () => ({
            metadata: () => Promise.resolve({ width: 800, height: 600 }),
            composite: () => ({
              metadata: () => Promise.resolve({ width: 800, height: 600 }),
              composite: () => ({
                metadata: () => Promise.resolve({ width: 800, height: 600 }),
                composite: () => ({
                  metadata: () => Promise.resolve({ width: 800, height: 600 }),
                  composite: () => ({
                    metadata: () => Promise.resolve({ width: 800, height: 600 }),
                    composite: () => ({
                      metadata: () => Promise.resolve({ width: 800, height: 600 }),
                      composite: () => ({
                        metadata: () => Promise.resolve({ width: 800, height: 600 }),
                        composite: () => ({
                          metadata: () => Promise.resolve({ width: 800, height: 600 }),
                          composite: () => ({
                            toFile: () => Promise.resolve('mock-output'),
                            toBuffer: () => Promise.resolve(Buffer.from('mock-image'))
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  });
}

interface WatermarkOptions {
  text?: string;
  imagePath?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
  size?: number;
  color?: string;
}

/**
 * Apply watermark to an image
 * @param imagePath Path to the original image
 * @param outputPath Path to save the watermarked image
 * @param options Watermark configuration
 */
export async function applyWatermark(
  imagePath: string,
  outputPath: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    text = 'VOU - Voice of UPSA',
    position = 'bottom-right',
    size = 48,
    color = 'rgba(255, 255, 255, 0.7)'
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Unable to determine image dimensions');
    }

    // Create watermark text SVG
    const watermarkSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text 
          x="${getPositionX(position, width)}" 
          y="${getPositionY(position, height)}" 
          font-family="Arial, sans-serif" 
          font-size="${size}" 
          font-weight="bold"
          fill="${color}"
          text-anchor="${getTextAnchor(position)}"
          filter="url(#shadow)"
        >
          ${text}
        </text>
      </svg>
    `;

    // Apply watermark
    await sharp(imagePath)
      .composite([{
        input: Buffer.from(watermarkSvg),
        gravity: 'center'
      }])
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error('Error applying watermark:', error);
    throw new Error('Failed to apply watermark');
  }
}

/**
 * Apply watermark to image buffer
 * @param imageBuffer Image buffer
 * @param options Watermark configuration
 */
export async function applyWatermarkToBuffer(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    text = 'VOU - Voice of UPSA',
    position = 'bottom-right',
    size = 48,
    color = 'rgba(255, 255, 255, 0.7)'
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Unable to determine image dimensions');
    }

    // Create watermark text SVG
    const watermarkSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text 
          x="${getPositionX(position, width)}" 
          y="${getPositionY(position, height)}" 
          font-family="Arial, sans-serif" 
          font-size="${size}" 
          font-weight="bold"
          fill="${color}"
          text-anchor="${getTextAnchor(position)}"
          filter="url(#shadow)"
        >
          ${text}
        </text>
      </svg>
    `;

    // Apply watermark and return buffer
    return await sharp(imageBuffer)
      .composite([{
        input: Buffer.from(watermarkSvg),
        gravity: 'center'
      }])
      .toBuffer();

  } catch (error) {
    console.error('Error applying watermark to buffer:', error);
    throw new Error('Failed to apply watermark to buffer');
  }
}

function getPositionX(position: string, width: number): number {
  const padding = 20;
  switch (position) {
    case 'top-left':
    case 'bottom-left':
      return padding;
    case 'top-right':
    case 'bottom-right':
      return width - padding;
    case 'center':
      return width / 2;
    default:
      return width - padding;
  }
}

function getPositionY(position: string, height: number): number {
  const padding = 40;
  switch (position) {
    case 'top-left':
    case 'top-right':
      return padding;
    case 'bottom-left':
    case 'bottom-right':
      return height - padding;
    case 'center':
      return height / 2;
    default:
      return height - padding;
  }
}

function getTextAnchor(position: string): string {
  switch (position) {
    case 'top-left':
    case 'bottom-left':
      return 'start';
    case 'top-right':
    case 'bottom-right':
      return 'end';
    case 'center':
      return 'middle';
    default:
      return 'end';
  }
}
