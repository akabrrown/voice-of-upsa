import { z } from 'zod';

// Ad submission schema
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
});

export type AdSubmission = z.infer<typeof adSubmissionSchema>;

// Upload file to Cloudinary
export async function uploadAdFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to upload file');
  }

  return data.secure_url;
}

// Initialize Paystack payment
export async function initializePaystackPayment(amount: number, email: string, reference?: string) {
  const response = await fetch('/api/ads/paystack/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      email,
      reference,
      callback_url: `${window.location.origin}/ads/payment/verify`,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initialize payment');
  }

  return data;
}

// Verify Paystack payment
export async function verifyPaystackPayment(reference: string) {
  const response = await fetch('/api/ads/paystack/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reference }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify payment');
  }

  return data;
}
