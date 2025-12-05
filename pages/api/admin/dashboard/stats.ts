import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { verifySupabaseToken, requireRole } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await verifySupabaseToken(req.headers.authorization?.replace('Bearer ', '') || '');

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    await requireRole(req, ['admin']);

    // Get dashboard statistics
    const [articlesCount, usersCount, commentsCount, recentArticles] = await Promise.all([
      supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('comments').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Get additional statistics
    const [
      { data: viewsData },
      { count: publishedArticles },
      { count: draftArticles }
    ] = await Promise.all([
      supabaseAdmin.from('articles').select('views_count'),
      supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
    ]);

    // Calculate total views
    const totalViews = viewsData?.reduce((sum, article) => sum + (article.views_count || 0), 0) || 0;

    const stats = {
      totalArticles: articlesCount.count || 0,
      totalUsers: usersCount.count || 0,
      totalViews,
      totalComments: commentsCount.count || 0,
      recentArticles: recentArticles.count || 0,
      publishedArticles: publishedArticles || 0,
      draftArticles: draftArticles || 0
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

