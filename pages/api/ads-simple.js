// Simple ads API without authentication - save as pages/api/ads-simple.js
// This will show if the data is accessible

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Simple query to get ads
    const { data, error } = await supabase
      .from('ad_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      });
    }

    // Transform data to match frontend format
    const transformedAds = (data || []).map(ad => ({
      id: ad.id,
      firstName: ad.first_name,
      lastName: ad.last_name,
      email: ad.email,
      phone: ad.phone,
      company: ad.company,
      businessType: ad.business_type,
      adType: ad.ad_type,
      adTitle: ad.ad_title,
      adDescription: ad.ad_description,
      targetAudience: ad.target_audience,
      budget: ad.budget,
      duration: ad.duration,
      startDate: ad.start_date,
      website: ad.website,
      additionalInfo: ad.additional_info,
      termsAccepted: ad.terms_accepted,
      attachmentUrls: ad.attachment_urls,
      status: ad.status,
      paymentStatus: ad.payment_status,
      paymentReference: ad.payment_reference,
      paymentAmount: ad.payment_amount,
      paymentDate: ad.payment_date,
      adminNotes: ad.admin_notes,
      created_at: ad.created_at,
      updated_at: ad.updated_at,
    }));

    return res.status(200).json({
      success: true,
      total: transformedAds.length,
      ads: transformedAds,
      message: `Found ${transformedAds.length} ads`
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'API error', 
      details: error.message 
    });
  }
}
