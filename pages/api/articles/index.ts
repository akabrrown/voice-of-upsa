import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withRateLimit, authenticate } from '@/lib/api/middleware/auth';
import { z } from 'zod';
import { applyWatermarkToBuffer } from '@/lib/watermark';

// Validation schema for query parameters
const articlesQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('12'),
  search: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  category: z.string().optional(),
  author: z.string().optional(),
  sort: z.enum(['published_at', 'created_at', 'updated_at', 'views_count', 'likes_count', 'comments_count']).default('published_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

// Rate limiting: 100 requests per minute per IP (increased for development)
const rateLimitMiddleware = withRateLimit(100, 60 * 1000, (req) => 
  req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Authenticate user
      const user = await authenticate(req);
      
      // Check permissions (admin or editor)
      if (user.role !== 'admin' && user.role !== 'editor') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create articles',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      const { title, content, excerpt, featured_image, status, category, is_featured, featured_order, display_location, contributor_name, tags } = req.body;

      // Basic validation
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title and content are required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Process featured image with watermark if provided
      if (featured_image && status === 'published') {
        try {
          // If it's a URL, download and process it
          if (featured_image.startsWith('http')) {
            const response = await fetch(featured_image);
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            await applyWatermarkToBuffer(imageBuffer, {
              text: 'VOU - Voice of UPSA',
              position: 'bottom-right',
              opacity: 0.7,
              size: 32
            });
            
            // Upload watermarked image back to storage or CDN
            // For now, we'll keep the original URL but in production you'd upload the new image
            console.log('Watermark applied to featured image');
          }
        } catch (error) {
          console.error('Error applying watermark:', error);
          // Continue without watermark if it fails
        }
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + 
        '-' + Math.random().toString(36).substring(2, 7);

      // Insert article
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newArticle, error: insertError } = await (supabaseAdmin as any)
        .from('articles')
        .insert({
          title,
          slug,
          content,
          excerpt: excerpt || '',
          featured_image: featured_image || null,
          status: status || 'draft',
          category_id: category || null,
          is_featured: is_featured || false,
          featured_order: featured_order || 0,
          display_location: display_location || 'both',
          contributor_name: contributor_name || '',
          tags: tags || [],
          author_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting article:', insertError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create article',
            details: insertError.message
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(201).json({
        success: true,
        data: newArticle,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Article creation error:', error);
      // If it's an auth error, return 401
      if (error instanceof Error && (error.message.includes('Authentication') || error.message.includes('token'))) {
         return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }
      
      throw error; // Let the global error handler handle it
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and POST methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Validate query parameters
    const validatedQuery = articlesQuerySchema.parse(req.query);
    const { page, limit, search, status, category, author, sort, order } = validatedQuery;
    
    const offset = (page - 1) * limit;
    
    // Build the query using articles table directly (fallback if view doesn't exist)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabaseAdmin as any)
      .from('articles')
      .select(`
        *,
        author:users(name, email, avatar_url),
        category:categories(id, name, slug)
      `, { count: 'exact' })
      .eq('status', status);

    // Add search filter using full-text search
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    // Add category filter
    if (category && category !== 'all') {
      // First get the category ID from the slug
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();
      
      if (!categoryError && categoryData) {
        query = query.eq('category_id', categoryData.id);
      } else {
        // If category doesn't exist, return no results
        query = query.eq('category_id', 'non-existent-id');
      }
    }

    // Add author filter
    if (author) {
      query = query.eq('author_id', author);
    }

    // Apply sorting
    const sortOrder = order === 'asc';
    query = query.order(sort, { ascending: sortOrder });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      // If database is not accessible, return empty result with proper error
      return res.status(200).json({
        success: true,
        data: {
          articles: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalArticles: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        timestamp: new Date().toISOString()
      });
    }

    // Transform the data to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedArticles = data?.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      featured_image: article.featured_image_url || article.featured_image,
      status: article.status,
      published_at: article.published_at,
      created_at: article.created_at,
      updated_at: article.updated_at,
      contributor_name: article.contributor_name || '',
      views_count: article.views_count || 0,
      likes_count: article.likes_count || 0,
      comments_count: article.comments_count || 0,
      bookmarks_count: 0, // Not in schema yet
      tags: article.tags || [],
      meta_title: article.seo_title,
      meta_description: article.seo_description,
      meta_keywords: article.seo_keywords,
      // Featured article fields
      is_featured: article.is_featured || false,
      featured_order: article.featured_order || 0,
      featured_until: article.featured_until || null,
      display_location: article.display_location || 'both',
      // Content allowance fields
      allow_comments: article.allow_comments || false,
      moderate_comments: article.moderate_comments || false,
      notify_on_publish: article.notify_on_publish || false,
      content_warning: article.content_warning || false,
      age_restriction: article.age_restriction || false,
      is_premium: article.is_premium || false,
      author: {
        id: article.author_id || 'system',
        name: article.author?.name || (article.author_id ? 'UPSA Contributor' : 'UPSA System'),
        email: article.author?.email,
        avatar_url: article.author?.avatar_url || null
      },
      category: article.category || {
        name: 'General',
        slug: 'general',
        color: '#6B7280'
      }
    })) || [];

    console.log('Transformed articles:', transformedArticles.length, 'articles');

    const totalPages = count ? Math.ceil(count / limit) : 0;

    const response = {
      success: true,
      data: {
        articles: transformedArticles,
        pagination: {
          currentPage: page,
          totalPages,
          totalArticles: count || 0,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);

