// Signed URLs for Secure Media Access
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';


interface SignedURLOptions {
  expiresIn?: number; // in seconds
  transformations?: string;
  quality?: number;
  format?: string;
}

class SignedURLManager {
  private static instance: SignedURLManager;
  private readonly DEFAULT_EXPIRY = 3600; // 1 hour
  private readonly SECRET_KEY = process.env.SIGNED_URL_SECRET || 'default-secret-key';

  static getInstance(): SignedURLManager {
    if (!SignedURLManager.instance) {
      SignedURLManager.instance = new SignedURLManager();
    }
    return SignedURLManager.instance;
  }

  // Generate signed URL for Cloudinary media
  generateCloudinaryURL(
    publicId: string,
    resourceType: string = 'image',
    options: SignedURLOptions = {}
  ): string {
    const {
      expiresIn = this.DEFAULT_EXPIRY,
      transformations = '',
      quality = 80,
      format = 'auto'
    } = options;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials not configured');
    }

    // Build the URL
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + expiresIn;
    
    // Build transformation string
    let transformStr = transformations;
    if (quality) {
      transformStr += transformStr ? `,q_${quality}` : `q_${quality}`;
    }
    if (format) {
      transformStr += transformStr ? `,f_${format}` : `f_${format}`;
    }

    // Generate signature
    const toSign = [
      transformStr,
      resourceType,
      'upload',
      expiresAt.toString(),
      publicId
    ].filter(Boolean).join('/');

    const signature = crypto
      .createHash('sha1')
      .update(toSign + apiSecret)
      .digest('hex');

    // Build final URL
    const baseUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload`;
    const url = `${baseUrl}${transformStr ? '/' + transformStr : ''}/s--${signature}--/e_${expiresAt}/${publicId}`;

    return url;
  }

  // Generate signed URL for Supabase Storage (if used)
  async generateSupabaseURL(
    bucket: string,
    path: string,
    options: SignedURLOptions = {}
  ): Promise<string> {
    const { expiresIn = this.DEFAULT_EXPIRY } = options;

    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Supabase signed URL error:', error);
      throw error;
    }
  }

  // Validate signed URL parameters
  validateSignedURL(params: {
    token?: string;
    expires?: string;
    resource?: string;
    signature?: string;
  }): boolean {
    const { token, expires, resource, signature } = params;

    if (!token || !expires || !resource || !signature) {
      return false;
    }

    // Check if URL has expired
    const expiresAt = parseInt(expires);
    if (Date.now() / 1000 > expiresAt) {
      return false;
    }

    // Validate signature
    const expectedSignature = this.generateSignature(token, expires, resource);
    return signature === expectedSignature;
  }

  // Generate signature for custom signed URLs
  private generateSignature(token: string, expires: string, resource: string): string {
    const toSign = `${token}:${expires}:${resource}:${this.SECRET_KEY}`;
    return crypto.createHash('sha256').update(toSign).digest('hex');
  }

  // Generate custom signed URL
  generateCustomSignedURL(
    baseUrl: string,
    resource: string,
    options: SignedURLOptions = {}
  ): string {
    const { expiresIn = this.DEFAULT_EXPIRY } = options;
    
    const token = crypto.randomBytes(16).toString('hex');
    const expires = (Date.now() / 1000 + expiresIn).toString();
    const signature = this.generateSignature(token, expires, resource);

    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    url.searchParams.set('expires', expires);
    url.searchParams.set('resource', resource);
    url.searchParams.set('signature', signature);

    return url.toString();
  }

  // Get media URL with appropriate signing method
  async getMediaURL(
    mediaType: 'cloudinary' | 'supabase',
    identifier: string,
    options: SignedURLOptions = {}
  ): Promise<string> {
    switch (mediaType) {
      case 'cloudinary':
        return this.generateCloudinaryURL(identifier, 'image', options);
      
      case 'supabase':
        // For Supabase, identifier should be "bucket/path"
        const [bucket, ...pathParts] = identifier.split('/');
        const path = pathParts.join('/');
        return this.generateSupabaseURL(bucket, path, options);
      
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }
  }

  // Middleware to validate signed URLs
  validateSignedURLMiddleware = (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const { token, expires, resource, signature } = req.query;

    if (!this.validateSignedURL({ token: token as string, expires: expires as string, resource: resource as string, signature: signature as string })) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_SIGNED_URL',
          message: 'Invalid or expired signed URL',
          details: 'Please request a new signed URL'
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

// Export singleton instance
export const signedURLManager = SignedURLManager.getInstance();

// API endpoint for generating signed URLs
export const generateSignedURL = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { mediaType, identifier, options } = req.body;

    if (!mediaType || !identifier) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'mediaType and identifier are required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const url = await signedURLManager.getMediaURL(mediaType, identifier, options);

    return res.status(200).json({
      success: true,
      data: {
        url,
        expiresAt: Date.now() + (options?.expiresIn || 3600) * 1000
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'URL_GENERATION_FAILED',
        message: 'Failed to generate signed URL',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
};
