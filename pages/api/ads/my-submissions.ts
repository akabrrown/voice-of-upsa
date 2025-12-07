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
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Fetching ad submissions for email:', email);

    // Fetch user's ad submissions
    const { data: submissions, error } = await supabase
      .from('ad_submissions')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return res.status(500).json({ message: 'Failed to fetch ad submissions' });
    }

    console.log(`Found ${submissions?.length || 0} submissions for ${email}`);

    res.status(200).json({ 
      message: 'Ad submissions fetched successfully',
      submissions: submissions || []
    });

  } catch (error) {
    console.error('Error in get-user-submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
