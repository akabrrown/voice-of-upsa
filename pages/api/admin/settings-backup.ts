import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Server-side Supabase client - use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Schema for settings update
const settingsSchema = z.object({
  // General Settings
  site_name: z.string().min(1, 'Site name cannot be empty').optional(),
  site_description: z.string().min(1, 'Site description cannot be empty').optional(),
  site_url: z.string().optional(),
  
  // Logo Settings (accept both field names)
  logo_url: z.string().min(1, 'Logo URL cannot be empty').optional(),
  site_logo: z.string().min(1, 'Logo URL cannot be empty').optional(),
  
  logo_upload_size: z.number().min(1024, 'Upload size must be at least 1KB').max(10485760, 'Upload size cannot exceed 10MB').optional(),
  logo_allowed_types: z.array(z.string()).optional(),
  
  // Email Settings
  contact_email: z.string().email('Invalid contact email').optional(),
  notification_email: z.string().email('Invalid notification email').optional(),
  
  // Social Media Links (accept both flat and nested structures)
  social_facebook: z.string().optional(),
  social_twitter: z.string().optional(),
  social_instagram: z.string().optional(),
  social_youtube: z.string().optional(),
  social_tiktok: z.string().optional(),
  social_linkedin: z.string().optional(),
  
  // Nested social_links object (from frontend)
  social_links: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  
  // Feature Settings
  maintenance_mode: z.boolean().optional(),
  allow_comments: z.boolean().optional(),
  moderate_comments: z.boolean().optional(),
  
  // Upload Settings
  max_upload_size: z.number().min(1024, 'Upload size must be at least 1KB').max(104857600, 'Upload size cannot exceed 100MB').optional(),
  allowed_image_types: z.array(z.string()).optional(),
  
  // Ad Settings
  ad_enabled: z.boolean().optional(),
  ad_auto_approve: z.boolean().optional(),
  ad_max_per_user: z.number().min(1, 'Max ads per user must be at least 1').max(100, 'Max ads per user cannot exceed 100').optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check environment variables at runtime
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[admin/settings] Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return res.status(500).json({ 
      message: 'Database not configured. Please check environment variables.',
    });
  }

  try {
    // Get the auth token from request
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('[admin/settings] Auth error:', authError?.message || 'No user');
      return res.status(401).json({ 
        error: 'Unauthorized - Invalid token',
        details: authError?.message,
      });
    }

    // Check if user is admin from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[admin/settings] User lookup error:', userError);
      return res.status(403).json({ 
        error: 'Failed to verify user permissions',
        details: userError.message,
        code: userError.code,
      });
    }

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Insufficient permissions - Admin access required',
        userRole: userData?.role || 'none',
      });
    }

    // GET - Fetch current settings
    if (req.method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('[admin/settings] Error fetching settings:', error);
          return res.status(500).json({ 
            error: 'Failed to fetch settings',
            details: error.message,
            code: error.code,
          });
        }

        // If no settings exist, return default settings
        if (!data) {
          const defaultSettings = {
            // General Settings
            site_name: 'Voice of UPSA',
            site_description: 'Official student publication of UPSA',
            site_url: 'http://localhost:3000',
            
            // Logo Settings
            logo_url: '/logo.jpg',
            logo_upload_size: 2097152, // 2MB
            logo_allowed_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            
            // Email Settings
            contact_email: 'voice.of.upsa.mail@gmail.com',
            notification_email: 'voice.of.upsa.mail@gmail.com',
            
            // Social Media Links
            social_facebook: '',
            social_twitter: '',
            social_instagram: '',
            social_youtube: '',
            social_tiktok: '',
            social_linkedin: '',
            
            // Feature Settings
            maintenance_mode: false,
            allow_comments: true,
            moderate_comments: false,
            
            // Upload Settings
            max_upload_size: 5242880, // 5MB
            allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            
            // Ad Settings
            ad_enabled: true,
            ad_auto_approve: false,
            ad_max_per_user: 5,
          };
          return res.status(200).json(defaultSettings);
        }

        return res.status(200).json(data);
      } catch (error) {
        console.error('[admin/settings] Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    // PUT - Update settings
    if (req.method === 'PUT') {
      const validationResult = settingsSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.error('[admin/settings] Validation errors:', validationResult.error.errors);
        console.error('[admin/settings] Request body:', req.body);
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        });
      }

      const settingsData = validationResult.data;

      // Map frontend field names to database field names
      const mappedData = {
        ...settingsData,
        // Handle logo URL mapping
        logo_url: settingsData.logo_url || settingsData.site_logo || '/logo.jpg',
        
        // Handle social links mapping (flatten nested object)
        social_facebook: settingsData.social_facebook || settingsData.social_links?.facebook || '',
        social_twitter: settingsData.social_twitter || settingsData.social_links?.twitter || '',
        social_instagram: settingsData.social_instagram || settingsData.social_links?.instagram || '',
        social_youtube: settingsData.social_youtube || settingsData.social_links?.youtube || '',
        social_tiktok: settingsData.social_tiktok || settingsData.social_links?.tiktok || '',
        social_linkedin: settingsData.social_linkedin || settingsData.social_links?.linkedin || '',
        
        // Remove frontend-specific fields
        site_logo: undefined,
        social_links: undefined,
      };

      try {
        // First try to update existing settings
        const { data, error } = await supabase
          .from('settings')
          .upsert({
            id: 1, // Use fixed ID for settings row
            ...mappedData,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('[admin/settings] Database error:', error);
          console.error('[admin/settings] Mapped data:', mappedData);
          return res.status(500).json({ 
            error: 'Failed to save settings',
            details: error.message,
            code: error.code,
          });
        }

        return res.status(200).json({ 
          message: 'Settings saved successfully',
          settings: data
        });
      } catch (error) {
        console.error('[admin/settings] Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[admin/settings] Admin settings API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Internal server error',
      details: errorMessage,
    });
  }
}
