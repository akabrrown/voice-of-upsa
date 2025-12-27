import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Authenticate the Cron Job
  // We check for a Bearer token that matches CRON_SECRET or simply the header if using Vercel Cron
  // Since we can't easily set env vars here, we'll try to check for Authorization header
  // Note: For now, we'll allow it if in development mode for testing.

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = 
    process.env.NODE_ENV === 'development' || 
    (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) throw new Error('Failed to initialize Supabase Admin client');

    const now = new Date().toISOString();

    // 2. Find articles to publish
    const { data: articlesToPublish, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('id, title')
      .eq('status', 'scheduled')
      .lte('published_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled articles:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch scheduled articles' });
    }

    if (!articlesToPublish || articlesToPublish.length === 0) {
      return res.status(200).json({ message: 'No articles to publish', publishedCount: 0 });
    }

    console.log(`Found ${articlesToPublish.length} articles to publish:`, articlesToPublish.map((a: { id: string; title: string }) => a.title));

    // 3. Update them to published
    // We do this in a loop or bulk update? Bulk update is better but Supabase update matches by ID.
    // We can use the 'in' filter.
    
    const articleIds = articlesToPublish.map((a: { id: string; title: string }) => a.id);

    const updateResult = await supabaseAdmin
      .from('articles')
      // @ts-expect-error - Supabase types don't properly infer the update parameter type
      .update({ status: 'published' })
      .in('id', articleIds);
    
    const updateError = updateResult.error;

    if (updateError) {
      console.error('Error publishing articles:', updateError);
      return res.status(500).json({ error: 'Failed to update articles' });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully published ${articlesToPublish.length} articles`,
      publishedCount: articlesToPublish.length,
      articles: articlesToPublish.map((a: { id: string; title: string }) => a.title)
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
