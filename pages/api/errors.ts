import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { error, errorInfo, timestamp, url, userAgent } = req.body;

    // Validate required fields
    if (!error || !error.message) {
      return res.status(400).json({ error: 'Error information is required' });
    }

    // Log error to database for monitoring
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase as any)
      .from('error_logs')
      .insert({
        error_message: error.message,
        error_stack: error.stack || null,
        error_name: error.name || 'Unknown',
        component_stack: errorInfo?.componentStack || null,
        timestamp: timestamp || new Date().toISOString(),
        url: url || null,
        user_agent: userAgent || null,
        environment: process.env.NODE_ENV || 'development',
      });

    if (dbError) {
      console.error('Failed to log error to database:', dbError);
      // Don't fail the request if logging fails
    }

    // In production, you might want to integrate with external error tracking services
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // await sendToErrorTrackingService(error, errorInfo);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Error logged successfully' 
    });
  } catch (error) {
    console.error('Error logging failed:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
}

