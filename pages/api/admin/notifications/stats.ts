import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== NOTIFICATIONS STATS HANDLER CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  // Simple test response
  return res.status(200).json({
    success: true,
    message: 'Notifications endpoint is working',
    data: {
      stories: 0,
      messages: 0,
      comments: 0,
      total: 0
    }
  });
}
