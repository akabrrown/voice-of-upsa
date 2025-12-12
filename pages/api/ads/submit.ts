import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
// import { CSRFProtection } from '@/lib/csrf'; // TODO: Re-enable when frontend token handling is implemented

// Supabase client
const supabase = getSupabaseAdmin();

// Type for API submission (without database fields)
type AdSubmissionInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  businessType: 'individual' | 'small-business' | 'corporate' | 'non-profit' | 'other';
  adLocations: string[];
  adTitle: string;
  adDescription: string;
  targetAudience: string;
  budget: string;
  duration: '1-week' | '2-weeks' | '1-month' | '3-months' | '6-months' | '1-year' | 'custom';
  startDate: string;
  website?: string;
  additionalInfo?: string;
  termsAccepted: boolean;
  attachmentUrls?: string[];
  customDuration?: string;
};

// Type for database insertion (includes database fields)
type AdSubmissionInsert = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string;
  business_type: string;
  ad_type: string;
  ad_title: string;
  ad_description: string;
  target_audience: string;
  budget: string;
  duration: string;
  custom_duration?: string;
  start_date: string;
  website?: string;
  additional_info?: string;
  terms_accepted: boolean;
  attachment_urls?: string[];
  status?: string;
  payment_status?: string;
  created_at?: string;
  updated_at?: string;
};


// Function to store ad locations
async function storeAdLocations(submissionId: string, locationNames: string[]) {
  try {
    // Get location IDs from names
    const { data: locations, error: locationError } = await supabase
      .from('ad_locations')
      .select('id')
      .in('name', locationNames);

    if (locationError) {
      console.error('Error fetching location IDs:', locationError);
      return;
    }

    if (!locations || locations.length === 0) {
      console.log('No valid locations found');
      return;
    }

    // Insert into junction table
    const locationInserts = locations.map(location => ({
      ad_submission_id: submissionId,
      ad_location_id: location.id
    }));

    const { error: insertError } = await supabase
      .from('ad_submission_locations')
      .insert(locationInserts);

    if (insertError) {
      console.error('Error storing ad locations:', insertError);
    } else {
      console.log(`Successfully stored ${locationInserts.length} ad locations`);
    }
  } catch (error) {
    console.error('Error in storeAdLocations:', error);
  }
}

// Validation schema
const adSubmissionSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  company: z.string().optional(),
  businessType: z.enum(['individual', 'small-business', 'corporate', 'non-profit', 'other']),
  adLocations: z.array(z.string()).min(1),
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
    // Apply rate limiting for ad submissions
    const rateLimit = getCMSRateLimit('POST');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Handle authentication - require authenticated users
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to submit ads',
          details: 'Please sign in to submit an advertisement'
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
          details: 'Please sign in again'
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('Received ad submission request from user:', user.email);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate input
    const validatedData = adSubmissionSchema.parse(req.body);
    console.log('Validation passed:', JSON.stringify(validatedData, null, 2));

    // Prepare data for insertion (map to snake_case)
    const insertData: AdSubmissionInsert = {
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      company: validatedData.company,
      business_type: validatedData.businessType,
      ad_type: 'other', // Default ad type since frontend doesn't collect it
      ad_title: validatedData.adTitle,
      ad_description: validatedData.adDescription,
      target_audience: validatedData.targetAudience,
      budget: validatedData.budget,
      duration: validatedData.duration,
      start_date: validatedData.startDate,
      website: validatedData.website,
      additional_info: validatedData.additionalInfo,
      terms_accepted: validatedData.termsAccepted,
      attachment_urls: validatedData.attachmentUrls,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Only include custom_duration if it exists and has a value
    if (validatedData.customDuration && validatedData.customDuration.trim()) {
      insertData.custom_duration = validatedData.customDuration;
    }

    console.log('Data for database insertion:', JSON.stringify(insertData, null, 2));

    // Store in database
    const { data: submission, error } = await supabase
      .from('ad_submissions')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If the error is about custom_duration column or any schema issue, try without optional fields
      if (error.message?.includes('custom_duration') || 
          error.message?.includes('column') || 
          error.code === '42703' ||
          error.code === '42702') {
        console.log('Attempting fallback without optional fields');
        
        // Create minimal insert data with only required fields
        const fallbackData: AdSubmissionInsert = {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          business_type: validatedData.businessType,
          ad_type: 'other', // Default ad type since frontend doesn't collect it
          ad_title: validatedData.adTitle,
          ad_description: validatedData.adDescription,
          target_audience: validatedData.targetAudience,
          budget: validatedData.budget,
          duration: validatedData.duration,
          start_date: validatedData.startDate,
          terms_accepted: validatedData.termsAccepted,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Add optional fields only if they exist
        if (validatedData.company) fallbackData.company = validatedData.company;
        if (validatedData.website) fallbackData.website = validatedData.website;
        if (validatedData.additionalInfo) fallbackData.additional_info = validatedData.additionalInfo;
        if (validatedData.attachmentUrls) fallbackData.attachment_urls = validatedData.attachmentUrls;
        
        const { data: fallbackSubmission, error: fallbackError } = await supabase
          .from('ad_submissions')
          .insert([fallbackData])
          .select()
          .single();
          
        if (fallbackError) {
          console.error('Fallback database error details:', {
            message: fallbackError.message,
            details: fallbackError.details,
            hint: fallbackError.hint,
            code: fallbackError.code
          });
          return res.status(500).json({ message: 'Failed to store ad submission', error: fallbackError.message });
        }
        
        console.log('Fallback submission successful:', fallbackSubmission);
        
        // Store ad locations for fallback submission
        if (validatedData.adLocations && validatedData.adLocations.length > 0) {
          await storeAdLocations(fallbackSubmission.id, validatedData.adLocations);
        }
        
        // Send emails with fallback submission
        try {
          await Promise.all([
            sendAdminNotification({ ...validatedData, ...fallbackSubmission }),
            sendUserConfirmation(validatedData),
          ]);
          console.log('Emails sent successfully');
        } catch (emailError) {
          console.error('Email error:', emailError);
          // Don't fail the submission if emails fail
        }

        return res.status(200).json({ 
          message: 'Ad submission created successfully',
          submission: fallbackSubmission 
        });
      }
      
      return res.status(500).json({ message: 'Failed to store ad submission', error: error.message });
    }

    console.log('Submission successful:', submission);

    // Store ad locations
    if (validatedData.adLocations && validatedData.adLocations.length > 0) {
      await storeAdLocations(submission.id, validatedData.adLocations);
    }

    console.log('Database insertion successful:', submission);

    // Send emails in parallel
    try {
      await Promise.all([
        sendAdminNotification(submission),
        sendUserConfirmation(validatedData),
      ]);
      console.log('Emails sent successfully');
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the submission if emails fail
    }

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

// Send email notification to admin
async function sendAdminNotification(submission: AdSubmissionInput & { id: string; status: string; created_at: string; custom_duration?: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@voiceofupsa.com';

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: adminEmail,
    subject: `New Ad Submission: ${submission.adTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">New Ad Submission Received</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Submission Details</h3>
          <p><strong>Name:</strong> ${submission.firstName} ${submission.lastName}</p>
          <p><strong>Email:</strong> ${submission.email}</p>
          <p><strong>Phone:</strong> ${submission.phone}</p>
          <p><strong>Company:</strong> ${submission.company || 'N/A'}</p>
          <p><strong>Business Type:</strong> ${submission.businessType}</p>
          <p><strong>Ad Locations:</strong> ${Array.isArray(submission.adLocations) ? submission.adLocations.join(', ') : 'N/A'}</p>
          <p><strong>Ad Title:</strong> ${submission.adTitle}</p>
          <p><strong>Budget:</strong> GHS ${submission.budget}</p>
          <p><strong>Duration:</strong> ${submission.duration}${submission.custom_duration ? ` (${submission.custom_duration})` : ''}</p>
          <p><strong>Start Date:</strong> ${submission.startDate}</p>
          <p><strong>Website:</strong> ${submission.website || 'N/A'}</p>
          
          <h4 style="color: #1e40af; margin-top: 20px;">Ad Description</h4>
          <p style="background: white; padding: 10px; border-radius: 4px;">${submission.adDescription}</p>
          
          <h4 style="color: #1e40af; margin-top: 20px;">Target Audience</h4>
          <p style="background: white; padding: 10px; border-radius: 4px;">${submission.targetAudience}</p>
          
          ${submission.additionalInfo ? `
            <h4 style="color: #1e40af; margin-top: 20px;">Additional Information</h4>
            <p style="background: white; padding: 10px; border-radius: 4px;">${submission.additionalInfo}</p>
          ` : ''}
          
          ${submission.attachmentUrls && submission.attachmentUrls.length > 0 ? `
            <h4 style="color: #1e40af; margin-top: 20px;">Attachments</h4>
            <ul>
              ${submission.attachmentUrls.map((url: string, index: number) => 
                `<li><a href="${url}" style="color: #1e40af;">Attachment ${index + 1}</a></li>`
              ).join('')}
            </ul>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/ads" 
             style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review in Admin Panel
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This email was sent from Voice of UPSA Ad Submission System
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Send confirmation email to user
async function sendUserConfirmation(data: AdSubmissionInput) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: data.email,
    subject: 'Ad Submission Received - Voice of UPSA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin: 30px 0;">
          <h1 style="color: #1e40af; margin: 0;">Voice of UPSA</h1>
          <p style="color: #6b7280;">Ad Submission Confirmation</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1e40af; text-align: center;">Thank You!</h2>
          <p style="text-align: center; font-size: 16px; color: #374151;">
            Your ad submission has been received successfully. Our team will review it within 24-48 hours.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Submission Details</h3>
            <p><strong>Ad Title:</strong> ${data.adTitle}</p>
            <p><strong>Ad Locations:</strong> ${Array.isArray(data.adLocations) ? data.adLocations.join(', ') : 'N/A'}</p>
            <p><strong>Budget:</strong> ${data.budget}</p>
            <p><strong>Duration:</strong> ${data.duration}${data.customDuration ? ` (${data.customDuration})` : ''}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background: #e0f2fe; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">What Happens Next?</h3>
            <ol style="color: #374151; padding-left: 20px;">
              <li>Our team reviews your submission (24-48 hours)</li>
              <li>We'll contact you to discuss details if needed</li>
              <li>Upon approval, we'll send payment instructions</li>
              <li>Your ad will go live on the agreed date</li>
            </ol>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}" 
             style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Visit Our Website
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            If you have any questions, please contact us at <a href="mailto:ads@voiceofupsa.com" style="color: #1e40af;">ads@voiceofupsa.com</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
