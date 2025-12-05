import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';
import { withErrorHandler, withAuth, validateRequest, withRateLimit } from '@/lib/api/middleware';
import { commonSchemas } from '@/lib/api/middleware/validation';
import { generateSlug } from '@/lib/utils';

// Types
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author_id: string;
  category_id?: string;
}

interface ArticleListResponse {
  articles: Article[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalArticles: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// GET - List articles
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  // Validate query parameters
  const query = validateRequest({
    page: { type: 'number', min: 1, default: 1 },
    limit: { type: 'number', min: 1, max: 50, default: 12 },
    search: { type: 'string', maxLength: 255 },
    status: { type: 'enum', enum: ['draft', 'published', 'all'], default: 'published' },
    category: { type: 'string' },
    author: { type: 'string' },
    sort: { type: 'enum', enum: ['published_at', 'created_at', 'title', 'views_count'], default: 'published_at' },
    order: { type: 'enum', enum: ['asc', 'desc'], default: 'desc' }
  }, 'query')(req);

  const {
    page = 1,
    limit = 12,
    search,
    status = 'published',
    category,
    author,
    sort = 'published_at',
    order = 'desc'
  } = query as {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    author?: string;
    sort?: string;
    order?: string;
  };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  // Build the query with proper joins
  let dbQuery = supabase
    .from('articles')
    .select(`
      *,
      author:users(id, name, avatar_url),
      category:categories(id, name, slug, color)
    `, { count: 'exact' });

  // Apply filters
  if (status !== 'all') {
    dbQuery = dbQuery.eq('status', status);
  }

  if (search) {
    dbQuery = dbQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  if (category && category !== 'all') {
    // First get the category ID from the slug
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();
    
    if (!categoryError && categoryData) {
      dbQuery = dbQuery.eq('category_id', categoryData.id);
    } else {
      // If category doesn't exist, return no results
      dbQuery = dbQuery.eq('category_id', 'non-existent-id');
    }
  }

  if (author) {
    dbQuery = dbQuery.eq('author_id', author);
  }

  // Apply sorting
  const sortOrder = order === 'asc';
  dbQuery = dbQuery.order(sort, { ascending: sortOrder });

  // Apply pagination
  dbQuery = dbQuery.range(offset, offset + limitNum - 1);

  const { data: articles, error, count } = await dbQuery;

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Transform the data to match expected format
  const transformedArticles = articles?.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featured_image: article.featured_image,
    status: article.status,
    published_at: article.published_at,
    created_at: article.created_at,
    updated_at: article.updated_at,
    views_count: article.views_count || 0,
    likes_count: article.likes_count || 0,
    comments_count: article.comments_count || 0,
    bookmarks_count: article.bookmarks_count || 0,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    meta_keywords: article.meta_keywords,
    author_id: article.author_id,
    category_id: article.category_id,
    author: article.author || {
      id: article.author_id,
      name: 'Unknown Author',
      avatar_url: null
    },
    category: article.category || null
  })) || [];

  // Calculate pagination
  const totalArticles = count || 0;
  const totalPages = Math.ceil(totalArticles / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPreviousPage = pageNum > 1;

  const response: ArticleListResponse = {
    articles: transformedArticles,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalArticles,
      hasNextPage,
      hasPreviousPage
    }
  };

  res.status(200).json({
    success: true,
    data: response,
    timestamp: new Date().toISOString()
  });
}

// POST - Create article
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: { id: string }) {
  // Validate request body
  const body = validateRequest(commonSchemas.articleCreate, 'body')(req);

  const {
    title,
    content,
    excerpt,
    featured_image,
    status = 'draft',
    category_id,
    meta_title,
    meta_description,
    meta_keywords
  } = body as {
    title: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    status?: 'draft' | 'published';
    category_id?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
  };

  // Generate unique slug
  let slug = generateSlug(title);
  
  // Check if slug already exists and make it unique
  const { data: existingArticle } = await supabase
    .from('articles')
    .select('slug')
    .eq('slug', slug)
    .single();

  if (existingArticle) {
    slug = `${slug}-${Date.now()}`;
  }

  const articleData = {
    title,
    slug,
    content,
    excerpt: excerpt || '',
    featured_image: featured_image || null,
    status,
    author_id: user.id,
    category_id: category_id || null,
    meta_title: meta_title || title.substring(0, 60),
    meta_description: meta_description || excerpt?.substring(0, 160) || content.substring(0, 160),
    meta_keywords: meta_keywords || '',
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  const { data: article, error } = await supabase
    .from('articles')
    .insert(articleData)
    .select(`
      *,
      author:users(id, name, avatar_url),
      category:categories(id, name, slug, color)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create article: ${error.message}`);
  }

  res.status(201).json({
    success: true,
    data: article,
    timestamp: new Date().toISOString()
  });
}

// Main handler with middleware
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply rate limiting
  withRateLimit(100, 60000, (req: NextApiRequest) => (req.headers['x-forwarded-for'] as string) || 'unknown')(req); // 100 requests per minute

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return withAuth(handlePost, { requiredRole: 'user' })(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed',
          timestamp: new Date().toISOString()
        }
      });
  }
}

// Export with error handler wrapper
export default withErrorHandler(handler);

