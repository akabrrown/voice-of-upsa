// Temporary admin API bypass - save this as pages/api/admin/ads-bypass.js
// This will allow you to view ads without authentication

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Temporary bypass - skip all authentication
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('ad_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ads:', error);
        return res.status(500).json({ error: 'Failed to fetch ads' });
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(record => ({
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
        paymentStatus: record.payment_status,
        paymentReference: record.payment_reference,
        paymentAmount: record.payment_amount,
        paymentDate: record.payment_date,
        adminNotes: record.admin_notes,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));

      return res.status(200).json({ 
        submissions: transformedData,
        total: transformedData.length 
      });
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
