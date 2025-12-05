import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Validate that Cloudinary configuration is properly set
 */
export function validateCloudinaryConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload an image to Cloudinary
 * @param file - Base64 encoded image or file path
 * @param folder - Optional folder name in Cloudinary
 * @returns Upload result with public_id and secure_url
 */
export async function uploadImage(
  file: string,
  folder: string = 'articles'
): Promise<{ public_id: string; secure_url: string; width: number; height: number }> {
  try {
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is missing');
    }

    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'image',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'voice_of_upsa', // Configure in Cloudinary dashboard
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public_id of the image to delete
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    if (!validateCloudinaryConfig()) {
      throw new Error('Cloudinary configuration is missing');
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Get optimized image URL from Cloudinary
 * @param publicId - The public_id of the image
 * @param transformations - Optional transformation parameters
 */
export function getImageUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  }
): string {
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  if (!transformations) {
    return `${baseUrl}/${publicId}`;
  }

  const { width, height, crop = 'fill', quality = 'auto' } = transformations;
  const transforms: string[] = [];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (quality) transforms.push(`q_${quality}`);

  const transformString = transforms.join(',');
  return `${baseUrl}/${transformString}/${publicId}`;
}

/**
 * Get multiple optimized image URLs for responsive images
 * @param publicId - The public_id of the image
 */
export function getOptimizedImageUrls(publicId: string): {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  original: string;
} {
  return {
    thumbnail: getImageUrl(publicId, { width: 150, height: 150, quality: 'auto' }),
    small: getImageUrl(publicId, { width: 400, quality: 'auto' }),
    medium: getImageUrl(publicId, { width: 800, quality: 'auto' }),
    large: getImageUrl(publicId, { width: 1200, quality: 'auto' }),
    original: getImageUrl(publicId),
  };
}

export default cloudinary;
