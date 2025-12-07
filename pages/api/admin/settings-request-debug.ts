import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== FRONTEND REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // Try to validate with Zod to see if error happens here
  try {
    const testSchema = z.object({
      site_logo: z.string().url().optional(),
    });
    
    const result = testSchema.safeParse(req.body);
    console.log('Zod validation result:', result);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors,
        body: req.body,
      });
    }
    
  } catch (error) {
    console.error('Zod error:', error);
  }
  
  return res.status(200).json({
    message: 'Request received successfully',
    body: req.body,
  });
}
