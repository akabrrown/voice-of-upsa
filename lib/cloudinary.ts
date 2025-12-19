import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

/**
 * Validate that Cloudinary configuration is properly set
 */
export function validateCloudinaryConfig(): boolean {
  const config = {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
  
  console.log('Cloudinary config check:', {
    cloud_name: !!config.cloud_name,
    api_key: !!config.api_key,
    api_secret: !!config.api_secret,
    cloud_name_value: config.cloud_name,
    api_key_length: config.api_key?.length,
  });
  
  return !!(
    config.cloud_name &&
    config.api_key &&
    config.api_secret
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

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'image',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'voice_of_upsa',
      // Optimized settings for faster upload
      quality: 'auto:good', // Faster than 'auto' with good quality
      fetch_format: 'auto',
      // Remove invalid format parameter
      // format: 'auto', // This was causing the error
      // Add timeout to prevent hanging
      timeout: 30000, // 30 seconds timeout
      // Disable unnecessary processing for faster upload
      eager: [], // No eager transformations
      invalidate: false, // Don't invalidate CDN cache
      overwrite: true, // Allow overwriting for faster retries
      // Size limits to prevent large files
      max_file_size: 10485760, // 10MB (increased from 5MB)
      // Moderation and analysis (disable for speed)
      moderation: 'manual',
      // Metadata
      use_filename: true,
      unique_filename: false, // Don't generate unique filename to save time
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    console.error('Cloudinary config check:', {
      cloud_name: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'voice_of_upsa'
    });
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  const baseUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  
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
