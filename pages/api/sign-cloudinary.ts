import { NextApiRequest, NextApiResponse } from 'next'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Cloudinary API Debug:', {
  cloudName: !!cloudName,
  apiKey: !!apiKey,
  apiSecret: !!apiSecret,
  cloudNameValue: cloudName,
  apiKeyLength: apiKey?.length,
});

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary environment variables:', {
    cloudName: !!cloudName,
    apiKey: !!apiKey,
    apiSecret: !!apiSecret,
  });
  throw new Error('Missing required Cloudinary environment variables');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { paramsToSign } = req.body

    if (!paramsToSign) {
      return res.status(400).json({ error: 'Missing params to sign' })
    }

    console.log('Signing Cloudinary params:', paramsToSign)

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )

    console.log('Generated signature:', signature)

    res.status(200).json({ signature })
  } catch (error) {
    console.error('Error signing Cloudinary params:', error)
    res.status(500).json({ error: 'Failed to sign parameters' })
  }
}
