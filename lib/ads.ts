import { z } from 'zod';
import { getSupabaseAdmin } from './supabaseAdminClient';

// Get admin client
const getSupabase = () => {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    console.error('Supabase admin client not available:', error);
    throw new Error('Database not available');
  }
};

// Ad submission schema (same as client)
export const adSubmissionSchema = z.object({
  id: z.string().optional(),
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
  status: z.enum(['pending', 'under-review', 'approved', 'rejected', 'published']).default('pending'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  admin_notes: z.string().optional(),
});

export type AdSubmission = z.infer<typeof adSubmissionSchema>;

// Get all ad submissions (for admin)
export async function getAdSubmissions() {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('ad_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching ad submissions:', error);
    throw error;
  }
}

// Update ad submission status
export async function updateAdSubmissionStatus(
  id: string, 
  status: string, 
  adminNotes?: string
): Promise<void> {
  const supabase = getSupabase();
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase
      .from('ad_submissions') as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating ad submission:', error);
    throw error;
  }
}

// Send email notification to admin
export async function sendAdminNotification(submission: Omit<AdSubmission, 'status'>) {
  try {
    const response = await fetch('/api/ads/notify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      throw new Error('Failed to send admin notification');
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

// Send status update email to user
export async function sendStatusUpdateEmail(submission: AdSubmission) {
  try {
    const response = await fetch('/api/ads/status-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      throw new Error('Failed to send status update email');
    }
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
}

// Initialize Paystack payment
export async function initializePaystackPayment(amount: number, email: string, reference: string) {
  try {
    const response = await fetch('/api/ads/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Paystack expects amount in kobo (cents)
        email,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/ads/payment/verify`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize Paystack payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    throw error;
  }
}

// Verify Paystack payment
export async function verifyPaystackPayment(reference: string) {
  try {
    const response = await fetch('/api/ads/paystack/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify Paystack payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    throw error;
  }
}

// Upload file to Cloudinary
export async function uploadAdFile(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'voice_of_upsa_ads');
    formData.append('folder', 'ad_submissions');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
