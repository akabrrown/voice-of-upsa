import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: 'Reference is required' });
    }

    // Paystack secret key
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ message: 'Paystack secret key not configured' });
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack verification error:', data);
      return res.status(400).json({ 
        message: 'Failed to verify payment', 
        error: data 
      });
    }

    const paymentData = data.data;

    // Check if payment was successful
    if (paymentData.status !== 'success') {
      return res.status(400).json({ 
        message: 'Payment not successful', 
        status: paymentData.status 
      });
    }

    // Update ad submission with payment information and publish it
    const { error: updateError } = await supabase
      .from('ad_submissions')
      .update({
        payment_status: 'paid',
        payment_reference: reference,
        payment_amount: paymentData.amount / 100, // Convert back from kobo
        payment_date: new Date().toISOString(),
        status: 'published', // Set status to published after successful payment
        updated_at: new Date().toISOString(),
      })
      .eq('payment_reference', reference);

    if (updateError) {
      console.error('Error updating ad submission:', updateError);
      // Don't fail the response, but log the error
    }

    res.status(200).json({
      success: true,
      data: {
        reference: paymentData.reference,
        status: paymentData.status,
        amount: paymentData.amount / 100,
        paid_at: paymentData.paid_at,
        customer: paymentData.customer,
      }
    });

  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
