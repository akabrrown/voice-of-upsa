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

/**
 * Transforms a snake_case database record from the ad_submissions table 
 * to a camelCase object used by the frontend.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformAdRecord(record: any): AdSubmission {
  if (!record) return record;
  
  return {
    id: record.id,
    firstName: record.first_name,
    lastName: record.last_name,
    email: record.email,
    phone: record.phone,
    company: record.company,
    businessType: record.business_type,
    adType: record.ad_type,
    adTitle: record.ad_title,
    adDescription: record.ad_description,
    targetAudience: record.target_audience,
    budget: record.budget,
    duration: record.duration,
    startDate: record.start_date,
    website: record.website,
    additionalInfo: record.additional_info,
    termsAccepted: record.terms_accepted,
    attachmentUrls: record.attachment_urls,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}


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


