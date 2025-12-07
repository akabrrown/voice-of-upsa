import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
  }).optional(),
  maintenance_mode: z.boolean(),
  allow_comments: z.boolean(),
  moderate_comments: z.boolean(),
  max_upload_size: z.number().int().positive(),
  allowed_image_types: z.array(z.string()),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        // Add timestamp
        updated_at: new Date().toISOString(),
      };

      // Use direct REST API calls
      const response = await fetch(`${supabaseUrl}/rest/v1/settings?id=eq.1`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dbUpdates)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Direct API error:', error);
        
        // If update fails, try insert
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/settings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ ...dbUpdates, id: 1 })
        });

        if (!insertResponse.ok) {
          const insertError = await insertResponse.text();
          return res.status(500).json({ 
            error: 'Failed to update and insert settings',
            details: { updateError: error, insertError }
          });
        }

        const data = await insertResponse.json();
        return res.status(200).json({ message: 'Settings created successfully', data });
      }

      const data = await response.json();
      return res.status(200).json({ message: 'Settings updated successfully', data });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Handle GET request
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/settings?id=eq.1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('GET error:', error);
        
        // Return default settings if table is empty
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

      const data = await response.json();
      
      // Transform flat social fields back to nested object
      const settings = data.length > 0 ? {
        ...data[0],
        social_links: {
          facebook: data[0].social_facebook || '',
          twitter: data[0].social_twitter || '',
          instagram: data[0].social_instagram || '',
          linkedin: data[0].social_linkedin || '',
          tiktok: data[0].social_tiktok || '',
          youtube: data[0].social_youtube || '',
        }
      } : null;

      return res.status(200).json(settings);

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
