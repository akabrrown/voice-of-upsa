import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { submissionId, amount, email } = req.body;

    if (!submissionId || !amount || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from('ad_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ message: 'Ad submission not found' });
    }

    // Check if submission is approved
    if (submission.status !== 'approved') {
      return res.status(400).json({ message: 'Ad submission must be approved first' });
    }

    // Check if payment already exists
    if (submission.payment_status === 'paid') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    // Initialize Paystack transaction
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({ message: 'Paystack not configured' });
    }

    // Generate unique reference
    const reference = `VOU-AD-${submission.id}-${Date.now()}`;

    // Create Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amount * 100, // Convert to kobo (cents)
        reference: reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/ads/payment/callback`,
        logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.jpg`, // Add logo URL
        metadata: {
          submission_id: submissionId,
          ad_title: submission.ad_title,
          customer_name: `${submission.first_name} ${submission.last_name}`,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error('Paystack error:', paystackData);
      return res.status(500).json({ 
        message: 'Failed to initialize payment',
        error: paystackData 
      });
    }

    // Update submission with payment reference
    await supabase
      .from('ad_submissions')
      .update({
        payment_reference: reference,
        payment_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    res.status(200).json({
      message: 'Payment initialized successfully',
      payment_url: paystackData.data.authorization_url,
      reference: reference,
      access_code: paystackData.data.access_code,
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
