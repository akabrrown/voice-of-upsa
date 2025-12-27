import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';
import { z } from 'zod';

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

  // GET - Fetch editor's articles
  if (req.method === 'GET') {
    const { 
      search = '', 
      status = 'all', 
      page = '1', 
      limit = '10' 
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('articles')
      .select('*, author:users!author_id(name, email)');

    if (search && typeof search === 'string') {
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
      query = query.or(`title.ilike.%${sanitizedSearch}%,content.ilike.%${sanitizedSearch}%`);
    }

    if (status !== 'all' && ['draft', 'published', 'archived'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const { data: queryData, error: fetchError, count: totalCount } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (fetchError) {
      console.error('Editor articles API: Query failed:', fetchError);
      return res.status(500).json({
        success: false,
        error: { code: 'GET_REQUEST_FAILED', message: 'Failed to fetch articles' },
        timestamp: new Date().toISOString()
      });
    }

    const articles = (queryData || []).map((article: any) => ({
      ...article,
      author_name: article.contributor_name || article.author?.name || 'Unknown',
      author_email: article.author?.email || 'Unknown'
    }));

    return res.status(200).json({
      success: true,
      data: { 
        articles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount || 0,
          totalPages: totalCount ? Math.ceil(totalCount / limitNum) : 0,
          hasNextPage: (offset + limitNum) < (totalCount || 0),
          hasPreviousPage: pageNum > 1,
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
    
    const insertData = {
      title: validatedData.title,
      content: validatedData.content,
      excerpt: validatedData.excerpt || null,
      featured_image: validatedData.featured_image || null,
      category_id: validCategoryId,
      author_id: user.id,
      contributor_name: validatedData.contributor_name || null,
      status: validatedData.status,
      published_at: validatedData.status === 'published' 
        ? new Date().toISOString() 
        : (validatedData.status === 'scheduled' && validatedData.published_at ? validatedData.published_at : null),
      slug: slug,
      display_location: (validatedData.is_featured ? 'both' : 'category_page') as 'homepage' | 'category_page' | 'both' | 'none',
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      console.error(`Article creation failed for editor ${user.email}:`, error);
      return res.status(500).json({
        success: false,
        error: { code: 'ARTICLE_CREATION_FAILED', message: 'Failed to create article' },
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
