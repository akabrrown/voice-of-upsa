import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { amount, email, reference, callback_url } = req.body;

    // Validate required fields
    if (!amount || !email || !reference) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Paystack secret key
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ message: 'Paystack secret key not configured' });
    }

    // Generate unique reference if not provided
    const paymentReference = reference || `VOU_ADS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize payment with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to kobo/cents
        email,
        reference: paymentReference,
        callback_url: callback_url || `${process.env.NEXT_PUBLIC_SITE_URL}/ads/payment/verify`,
        metadata: {
          custom_fields: [
            {
              display_name: "Ad Payment",
              variable_name: "ad_payment",
              value: "Advertisement payment for Voice of UPSA"
            }
          ]
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack error:', data);
      return res.status(400).json({ 
        message: 'Failed to initialize payment', 
        error: data 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      }
    });

  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
