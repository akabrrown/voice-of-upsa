import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';
import { Database } from '@/lib/database-types';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

type ArticleRow = Database['public']['Tables']['articles']['Row'];
type ArticleInsert = Database['public']['Tables']['articles']['Insert'];

const articlesQuerySchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'draft', 'published', 'archived', 'scheduled']).default('all'),
  page: z.coerce.number().min(1).max(100, 'Page number too high').default(1),
  pageSize: z.coerce.number().min(5, 'Page size too small').max(50, 'Page size too high').default(12)
});

// Enhanced validation schema - using passthrough to allow extra fields
const articleCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt too long').optional().default(''),
  featured_image: z.string().url('Invalid featured image URL').optional().nullable(),
  category: z.string().optional().nullable(),
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  published_at: z.string().nullable().optional(),
  contributor_name: z.string().optional().default(''),
  author_bio: z.string().optional().default(''),
  tags: z.array(z.string()).optional(),
  reading_time: z.number().optional(),
  is_featured: z.boolean().optional(),
  allow_comments: z.boolean().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  content_type: z.string().optional(),
  difficulty_level: z.string().optional(),
  estimated_read_time: z.number().optional(),
  media_files: z.array(z.any()).optional()
}).passthrough();

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  const supabaseAdmin = await getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Database connection failed');
  }
  const supabase = supabaseAdmin as SupabaseClient<Database>;

  // GET - Fetch editor's articles
  if (req.method === 'GET') {
    const { search, status, page, pageSize } = articlesQuerySchema.parse(req.query);
    const pageNum = page;
    const limitNum = pageSize;
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('articles')
      .select('*, author:users!author_id(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
      query = query.or(`title.ilike.%${sanitizedSearch}%,content.ilike.%${sanitizedSearch}%`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: queryData, error: fetchError, count: totalCount } = await query
      .range(offset, offset + limitNum - 1);

    if (fetchError) {
      console.error('Editor articles API: Query failed:', fetchError);
      return res.status(500).json({
        success: false,
        error: { code: 'GET_REQUEST_FAILED', message: 'Failed to fetch articles' },
        timestamp: new Date().toISOString()
      });
    }

    const articles = (queryData || []).map((article: ArticleRow & { author?: { name: string | null; email: string | null } }) => ({
      ...article,
      author_name: article.contributor_name || article.author?.name || 'Unknown',
      author_email: article.author?.email || 'Unknown'
    }));

    return res.status(200).json({
      success: true,
      data: { 
        articles,
        pagination: {
          currentPage: pageNum,
          totalPages: totalCount ? Math.ceil(totalCount / limitNum) : 0,
          totalArticles: totalCount || 0,
          hasNextPage: (offset + limitNum) < (totalCount || 0),
          hasPreviousPage: pageNum > 1,
          pageSize: limitNum
        },
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // POST - Create new article
  if (req.method === 'POST') {
    const validatedData = articleCreateSchema.parse(req.body);
    
    const slug = validatedData.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
    
    const categoryId = validatedData.category_id || validatedData.category || null;
    const validCategoryId = categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId) 
      ? categoryId 
      : null;
    
    const insertData: ArticleInsert = {
      title: validatedData.title,
      content: validatedData.content,
      excerpt: validatedData.excerpt || '',
      featured_image: validatedData.featured_image || null,
      category_id: validCategoryId,
      author_id: user.id,
      contributor_name: validatedData.contributor_name || '',
      status: validatedData.status,
      published_at: validatedData.status === 'published' 
        ? new Date().toISOString() 
        : (validatedData.status === 'scheduled' && validatedData.published_at ? validatedData.published_at : null),
      slug: slug,
      display_location: (validatedData.is_featured ? 'both' : 'category_page') as 'homepage' | 'category_page' | 'both' | 'none',
      views_count: 0
    };

    const { data: article, error } = await supabase
      .from('articles')
        // @ts-expect-error - forcing insert
        .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`Article creation failed for editor ${user.email}:`, error);
      return res.status(500).json({
        success: false,
        error: { code: 'ARTICLE_CREATION_FAILED', message: 'Failed to create article', details: error },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      data: { article },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET and POST methods are allowed' },
    timestamp: new Date().toISOString()
  });
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'edit:articles',
  auditAction: 'articles_managed'
}));
