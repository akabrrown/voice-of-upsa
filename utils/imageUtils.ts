import { getImageUrl, getOptimizedImageUrls } from '@/lib/cloudinary';

/**
 * Get Cloudinary public ID from URL
 * @param url - Cloudinary URL
 * @returns string - Public ID or null if not a Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      return null;
    }

    // Get everything after 'upload' and before version (if any)
    const publicIdParts = pathParts.slice(uploadIndex + 2);
    
    // Remove version if present (starts with v_)
    const lastPart = publicIdParts[publicIdParts.length - 1];
    if (lastPart.startsWith('v')) {
      publicIdParts.pop();
    }

    return publicIdParts.join('/');
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

/**
 * Get responsive image sources for different screen sizes
 * @param publicId - Cloudinary public ID
 * @param alt - Alt text for accessibility
 * @returns Object with srcset and sources for responsive images
 */
export function getResponsiveImageSources(publicId: string, alt: string = '') {
  const urls = getOptimizedImageUrls(publicId);

  return {
    src: urls.medium,
    srcset: `
      ${urls.thumbnail} 150w,
      ${urls.small} 400w,
      ${urls.medium} 800w,
      ${urls.large} 1200w
    `,
    sizes: `
      (max-width: 640px) 150px,
      (max-width: 768px) 400px,
      (max-width: 1024px) 800px,
      1200px
    `,
    alt,
  };
}

/**
 * Generate image URL for article featured image
 * @param url - Original image URL
 * @param size - Size variant (thumbnail, small, medium, large)
 * @returns string - Optimized image URL
 */
export function getArticleImageUrl(url: string, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string {
  const publicId = getPublicIdFromUrl(url);
  
  if (!publicId) {
    return url; // Return original URL if not Cloudinary
  }

  const sizeMap = {
    thumbnail: { width: 150, height: 150, crop: 'fill' },
    small: { width: 400, height: 300, crop: 'fill' },
    medium: { width: 800, height: 600, crop: 'fill' },
    large: { width: 1200, height: 900, crop: 'fill' },
  };

  return getImageUrl(publicId, sizeMap[size]);
}

/**
 * Generate avatar URL with circular crop
 * @param url - Original avatar URL
 * @param size - Size in pixels
 * @returns string - Optimized avatar URL
 */
export function getAvatarUrl(url: string, size: number = 100): string {
  const publicId = getPublicIdFromUrl(url);
  
  if (!publicId) {
    return url; // Return original URL if not Cloudinary
  }

  return getImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
  });
}

/**
 * Generate thumbnail URL with specific dimensions
 * @param url - Original image URL
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns string - Thumbnail URL
 */
export function getThumbnailUrl(url: string, width: number, height: number): string {
  const publicId = getPublicIdFromUrl(url);
  
  if (!publicId) {
    return url; // Return original URL if not Cloudinary
  }

  return getImageUrl(publicId, {
    width,
    height,
    crop: 'thumb',
  });
}

/**
 * Check if URL is a Cloudinary URL
 * @param url - URL to check
 * @returns boolean - true if Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') || false;
}

/**
 * Get image dimensions from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Object with width and height or null
 */
export function getImageDimensions(url: string): { width: number; height: number } | null {
  try {
    if (!isCloudinaryUrl(url)) {
      return null;
    }

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      return null;
    }

    // Look for dimensions in the URL (e.g., w_800,h_600)
    const transformationParts = pathParts.slice(uploadIndex + 1, -1);
    const dimensions: { width?: number; height?: number } = {};

    for (const part of transformationParts) {
      if (part.startsWith('w_')) {
        dimensions.width = parseInt(part.replace('w_', ''));
      } else if (part.startsWith('h_')) {
        dimensions.height = parseInt(part.replace('h_', ''));
      }
    }

    if (dimensions.width || dimensions.height) {
      return {
        width: dimensions.width || 0,
        height: dimensions.height || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting image dimensions:', error);
    return null;
  }
}

/**
 * Generate lazy loading image attributes
 * @param url - Image URL
 * @param alt - Alt text
 * @returns Object with lazy loading attributes
 */
export function getLazyImageProps(url: string, alt: string = '') {
  const publicId = getPublicIdFromUrl(url);
  
  return {
    src: publicId ? getThumbnailUrl(url, 10, 10) : url, // Tiny placeholder
    srcSet: publicId ? getResponsiveImageSources(publicId, alt).srcset : undefined,
    sizes: publicId ? getResponsiveImageSources(publicId, alt).sizes : undefined,
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}
