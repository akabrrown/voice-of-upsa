import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { getSupabaseAdmin } from '@/lib/database-server';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' },
        timestamp: new Date().toISOString()
      });
    }

    const form = formidable({
      maxFileSize: 2 * 1024 * 1024, // 2MB
    });

    const [, files] = await form.parse(req);
    const file = Array.isArray(files.logo) ? files.logo[0] : files.logo;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'No logo file provided' },
        timestamp: new Date().toISOString()
      });
    }

    // Upload to Cloudinary
    console.log('Uploading logo to Cloudinary...');
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'site-assets',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    // Clean up temporary file
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    const logoUrl = result.secure_url;

    // Update settings in database
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Database connection failed');
    }

    console.log('Updating settings table with new logo URL:', logoUrl);
    const { data: updatedSettings, error: dbError } = await (supabaseAdmin as any)
      .from('settings')
      .update({ 
        site_logo: logoUrl, // Using site_logo as identified in check-settings-tables.cjs
        updated_at: new Date().toISOString()
      })
      .eq('id', 1) // Assuming single settings row with ID 1
      .select()
      .single();

    if (dbError) {
      console.error('Database update error:', dbError);
      throw new Error('Failed to update settings in database');
    }

    return res.status(200).json({
      success: true,
      message: 'Logo uploaded and settings updated successfully',
      data: { 
        logo_url: logoUrl,
        settings: updatedSettings,
        uploaded_by: user.id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logo upload API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process logo upload',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'upload:logo',
  auditAction: 'logo_uploaded'
}));
