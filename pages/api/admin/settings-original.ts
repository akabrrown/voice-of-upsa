import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Create admin client with service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
    }
  }
});

const settingsSchema = z.object({
  site_name: z.string().min(1, 'Site name is required'),
  site_description: z.string().min(1, 'Site description is required'),
  site_url: z.string().url('Invalid site URL'),
  site_logo: z.string().min(1, 'Logo URL is required').optional(),
  contact_email: z.string().email('Invalid email address'),
  notification_email: z.string().email('Invalid notification email'),
  social_links: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
  }),
  maintenance_mode: z.boolean(),
  allow_comments: z.boolean(),
  moderate_comments: z.boolean(),
  max_upload_size: z.number().int().positive(),
  allowed_image_types: z.array(z.string()),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        
        // If table doesn't exist or no data, return default settings
        if (error.code === 'PGRST116' || error.code === '42501') {
          const defaultSettings = {
            site_name: 'Voice of UPSA',
            site_description: 'Official student publication of UPSA',
            site_url: 'http://localhost:3000',
            site_logo: '/logo.jpg',
            contact_email: 'voice.of.upsa.mail@gmail.com',
            notification_email: 'voice.of.upsa.mail@gmail.com',
            social_links: {
              facebook: '',
              twitter: '',
              instagram: '',
              linkedin: '',
              tiktok: '',
              youtube: '',
            },
            maintenance_mode: false,
            allow_comments: true,
            moderate_comments: false,
            max_upload_size: 5242880,
            allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          };
          return res.status(200).json(defaultSettings);
        }
        
        return res.status(500).json({ 
          error: 'Failed to fetch settings',
          details: error 
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Server error fetching settings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const validationResult = settingsSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
      }

      const updates = validationResult.data;

      // Transform the data to match database schema
      const dbUpdates = {
        ...updates,
        // Flatten social_links object to individual columns
        social_facebook: updates.social_links?.facebook || '',
        social_twitter: updates.social_links?.twitter || '',
        social_instagram: updates.social_links?.instagram || '',
        social_linkedin: updates.social_links?.linkedin || '',
        social_tiktok: updates.social_links?.tiktok || '',
        social_youtube: updates.social_links?.youtube || '',
        // Remove the nested object
        social_links: undefined,
      };

      console.log('Original updates:', updates);
      console.log('Transformed dbUpdates:', dbUpdates);



      // First try to get the existing settings row
      const { data: existingSettings } = await supabaseAdmin
        .from('settings')
        .select('id')
        .single();
      
      console.log('Existing settings:', existingSettings);
      
      let result;
      
      if (existingSettings && existingSettings.id) {
        // Update existing record
        console.log('Updating existing record:', existingSettings.id);
        result = await supabaseAdmin
          .from('settings')
          .update(dbUpdates)
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Insert new record (let DB generate UUID)
        console.log('Inserting new record');
        result = await supabaseAdmin
          .from('settings')
          .insert(dbUpdates)
          .select()
          .single();
      }

      const { data, error } = result;
      
      console.log('Database operation result:', { data, error });


      if (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ 
          error: 'Failed to update settings',
          details: error 
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Server error updating settings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
