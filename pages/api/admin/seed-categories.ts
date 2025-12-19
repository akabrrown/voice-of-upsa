import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Failed to initialize Supabase admin client' });
    }

    const categories = [
      { name: 'News', slug: 'news', description: 'Latest news and updates from UPSA', is_active: true },
      { name: 'Announcements', slug: 'announcements', description: 'Official announcements and notices', is_active: true },
      { name: 'Events', slug: 'events', description: 'Upcoming and past events at UPSA', is_active: true },
      { name: 'Opinions', slug: 'opinions', description: 'Opinion pieces and editorials', is_active: true },
      { name: 'Features', slug: 'features', description: 'Feature articles and in-depth stories', is_active: true },
      { name: 'Sports', slug: 'sports', description: 'Sports news and updates', is_active: true },
      { name: 'Academics', slug: 'academics', description: 'Academic-related content and resources', is_active: true },
    ];

    const results = [];
    
    for (const category of categories) {
      // Try to insert, ignore if already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseAdmin as any)
        .from('categories')
        .upsert(category, { onConflict: 'slug' })
        .select();
      
      if (error) {
        console.error(`Error inserting category ${category.name}:`, error);
        results.push({ category: category.name, status: 'error', error: error.message });
      } else {
        results.push({ category: category.name, status: 'success' });
      }
    }

    // Get all categories to verify
    const { data: allCategories } = await supabaseAdmin
      .from('categories')
      .select('name, slug')
      .order('name');

    return res.status(200).json({
      success: true,
      message: 'Categories seeded successfully',
      results,
      categories: allCategories
    });

  } catch (error) {
    console.error('Error seeding categories:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
