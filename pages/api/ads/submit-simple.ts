import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adSubmissionSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  company: z.string().optional(),
  businessType: z.enum(['individual', 'small-business', 'corporate', 'non-profit', 'other']),
  adType: z.enum(['banner', 'sidebar', 'in-article', 'popup', 'sponsored-content', 'other']),
  adTitle: z.string().min(5),
  adDescription: z.string().min(20),
  targetAudience: z.string().min(10),
  budget: z.string().min(1),
  duration: z.enum(['1-week', '2-weeks', '1-month', '3-months', '6-months', '1-year', 'custom']),
  startDate: z.string().min(1),
  website: z.string().url().optional().or(z.literal('')),
  additionalInfo: z.string().optional(),
  termsAccepted: z.boolean(),
  attachmentUrls: z.array(z.string()).optional(),
  customDuration: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== SIMPLIFIED AD SUBMISSION ===');
    
    // Validate input
    const validatedData = adSubmissionSchema.parse(req.body);
    console.log('Validation passed');

    // Prepare database data - map frontend names to database names
    const dbData = {
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      company: validatedData.company || null,
      business_type: validatedData.businessType,
      ad_type: validatedData.adType,
      ad_title: validatedData.adTitle,
      ad_description: validatedData.adDescription,
      target_audience: validatedData.targetAudience,
      budget: validatedData.budget,
      duration: validatedData.duration,
      start_date: validatedData.startDate,
      website: validatedData.website || null,
      additional_info: validatedData.additionalInfo || null,
      terms_accepted: validatedData.termsAccepted,
      attachment_urls: validatedData.attachmentUrls || null,
      custom_duration: validatedData.customDuration || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Data prepared for database');

    // Insert into database
    const { data: submission, error } = await supabase
      .from('ad_submissions')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to store ad submission', error: error.message });
    }

    console.log('Database insert successful');

    res.status(200).json({ 
      message: 'Ad submission created successfully',
      submission 
    });

  } catch (error) {
    console.error('Error in ad submission:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
}
