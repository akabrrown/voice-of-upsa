import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { reference } = req.query;

    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Verify payment with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({ message: 'Paystack not configured' });
    }

    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error('Paystack verification error:', paystackData);
      return res.status(500).json({ 
        message: 'Failed to verify payment',
        error: paystackData 
      });
    }

    const paymentData = paystackData.data;

    if (paymentData.status !== 'success') {
      return res.status(400).json({ 
        message: 'Payment not successful',
        status: paymentData.status 
      });
    }

    // Find submission by payment reference
    const { data: submission, error: fetchError } = await supabase
      .from('ad_submissions')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ message: 'Submission not found for this payment' });
    }

    // Update submission with payment details
    const { error: updateError } = await supabase
      .from('ad_submissions')
      .update({
        payment_status: 'paid',
        payment_date: paymentData.paid_at,
        status: 'published', // Auto-publish after payment
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return res.status(500).json({ message: 'Failed to update submission' });
    }

    // Send confirmation email (you can implement this later)
    // await sendPaymentConfirmationEmail(submission, paymentData);

    res.status(200).json({
      message: 'Payment verified successfully',
      status: 'success',
      submission: {
        id: submission.id,
        ad_title: submission.ad_title,
        amount: paymentData.amount / 100, // Convert back from kobo
        paid_at: paymentData.paid_at,
      },
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
