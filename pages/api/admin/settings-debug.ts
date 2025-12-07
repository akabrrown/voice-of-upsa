import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== DEBUG SETTINGS API ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  if (req.method === 'PUT') {
    console.log('Validation errors:', req.body);
    
    // Return the body to see what's being sent
    return res.status(200).json({
      message: 'Debug - Received settings',
      body: req.body,
      headers: req.headers,
    });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
