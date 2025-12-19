import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema - using passthrough to allow extra fields
const articleCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt too long').optional().default(''),
  featured_image: z.string().url('Invalid featured image URL').optional().nullable(),
  // Accept both 'category' and 'category_id'
  category: z.string().optional().nullable(),
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  published_at: z.string().optional().nullable(),
  contributor_name: z.string().optional().default(''),
  author_bio: z.string().optional().default(''),
  // Allow extra fields from the form
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

// User interface for authenticated users
interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Editor Articles API - No authorization header');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Supabase (NOT simple-auth)
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Database connection failed');
    }

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      console.error('Editor Articles API - Token validation error:', authError);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, name')
      .eq('id', authUser.id)
      .single();

    let userRole = 'user';
    let userName = authUser.email;
    
    if (!userError && userData) {
      userRole = (userData as { role: string; name?: string }).role || 'user';
      userName = (userData as { role: string; name?: string }).name || authUser.email;
    }

    console.log('Editor Articles API - User authenticated:', authUser.email, 'Role:', userRole);

    const user: AuthenticatedUser = {
      id: authUser.id,
      email: authUser.email || '',
      role: userRole,
      name: userName
    };

    // Check if user has appropriate role (admin or editor)
    if (user.role !== 'admin' && user.role !== 'editor') {
      console.log('Editor Articles API - User lacks permission. Role:', user.role);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Apply rate limiting
    const rateLimitMiddleware = withRateLimit(100, 60 * 1000, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

      // GET - Fetch editor's articles
    if (req.method === 'GET') {
      try {
        // Get query parameters with validation
        const { 
          search = '', 
          status = 'all', 
          page = '1', 
          limit = '10' 
        } = req.query;
        
        console.log(`Editor articles GET request:`, {
          userId: user.id,
          userEmail: user.email,
          queryParams: { search, status, page, limit }
        });
        
        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 50); // Cap at 50
        const offset = (pageNum - 1) * limitNum;

        console.log('Editor articles API: Attempting to query articles table...');

        let articles: Record<string, unknown>[] = [];
        let totalCount = 0;
        let queryError = null;

        try {
          // Build query
          const supabase = await supabaseAdmin;
          let query = supabase
            .from('articles')
            .select('*, author:users!author_id(name, email)');
            // .eq('author_id', user.id); // Removed to allow all articles

          // Add search filter with sanitization
          if (search && typeof search === 'string') {
            const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
            query = query.or(`title.ilike.%${sanitizedSearch}%,content.ilike.%${sanitizedSearch}%`);
          }

          // Add status filter
          if (status !== 'all' && ['draft', 'published', 'archived'].includes(status as string)) {
            query = query.eq('status', status);
          }

          // Add ordering and pagination
          const { data: queryData, error: fetchError } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

          if (fetchError) {
            queryError = fetchError;
            console.error('Editor articles API: Query failed:', fetchError);
          } else {
            // Flatten author details
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            articles = (queryData || []).map((article: any) => ({
              ...article,
              author_name: article.contributor_name || article.author?.name || 'Unknown',
              author_email: article.author?.email || 'Unknown'
            }));
            console.log('Editor articles API: Query successful, got', articles.length, 'articles');
          }

          // Try to get count if main query succeeded
          if (!queryError) {
            try {
              // Store user ID to ensure it's accessible in this block
              const supabase = await supabaseAdmin;
              
              let countQuery = supabase
                .from('articles')
                .select('*', { count: 'exact', head: true });
                // .eq('author_id', userId); // Removed to allow all articles to be counted

              if (status !== 'all' && ['draft', 'published', 'archived'].includes(status as string)) {
                countQuery = countQuery.eq('status', status);
              }

              if (search && typeof search === 'string') {
                const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
                countQuery = countQuery.or(`title.ilike.%${sanitizedSearch}%,content.ilike.%${sanitizedSearch}%`);
              }

              const { count } = await countQuery;
              totalCount = count || 0;
            } catch (countError) {
              console.warn('Editor articles API: Count query failed, using data length:', countError);
              totalCount = articles.length;
            }
          }

        } catch (error) {
          queryError = error;
          console.error('Editor articles API: Database query exception:', error);
        }

        // If we have a query error, return empty results with proper response
        if (queryError) {
          console.warn('Editor articles API: Returning empty results due to query error:', queryError);
          
          return res.status(200).json({
            success: true,
            data: { 
              articles: [],
              pagination: {
                page: pageNum,
                limit: limitNum,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            },
            timestamp: new Date().toISOString()
          });
        }

        console.log(`Articles returned to editor ${user.email}:`, {
          count: articles?.length || 0,
          page: pageNum,
          timestamp: new Date().toISOString()
        });

        return res.status(200).json({
          success: true,
          data: { 
            articles: articles || [],
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              totalPages: totalCount ? Math.ceil(totalCount / limitNum) : 0,
              hasNextPage: (offset + limitNum) < (totalCount || 0),
              hasPreviousPage: pageNum > 1,
            },
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Editor articles GET error for user ${user.email}:`, error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'GET_REQUEST_FAILED',
            message: 'Failed to fetch articles',
            details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
          },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // POST - Create new article
    if (req.method === 'POST') {
      try {
        // Validate input
        const validatedData = articleCreateSchema.parse(req.body);

        // Determine the author name - usage removed as column doesn't exist
        // const authorName = validatedData.contributor_name || user.name || user.email || 'Anonymous';
        
        // Generate slug from title
        const slug = validatedData.title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);
        
        // Handle category_id - use category_id if provided, otherwise try category
        const categoryId = validatedData.category_id || validatedData.category || null;
        // Validate it's a valid UUID or null
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
          // author_name: authorName, // Column does not exist in DB
          // author_bio: validatedData.author_bio || null, // Column does not exist in DB
          status: validatedData.status,
          published_at: validatedData.status === 'published' ? new Date().toISOString() : null,
          slug: slug,
          // tags: validatedData.tags || [], // Column does not exist in DB
          // is_featured: validatedData.is_featured || false, // Column does not exist in DB
          
          // Required by schema but missing from form:
          display_location: (validatedData.is_featured ? 'homepage' : 'none') as 'homepage' | 'category_page' | 'both' | 'none',
          views_count: 0,
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Creating article with data:', insertData);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: article, error } = await supabaseAdmin
          .from('articles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(insertData as Record<string, unknown> as any)
          .select()
          .single();

        if (error) {
          console.error(`Article creation failed for editor ${user.email}:`, error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'ARTICLE_CREATION_FAILED',
              message: 'Failed to create article',
              details: process.env.NODE_ENV === 'development' ? error.message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Log article creation
        const createdArticle = article as Record<string, unknown>;
        console.info(`Article created by editor: ${user.email}`, {
          articleId: createdArticle?.id,
          title: createdArticle?.title,
          status: createdArticle?.status,
          timestamp: new Date().toISOString()
        });

        return res.status(201).json({
          success: true,
          data: { article: createdArticle },
          timestamp: new Date().toISOString()
        });
      } catch (validationError) {
        console.error('Article validation error:', validationError);
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid article data',
            details: process.env.NODE_ENV === 'development' ? (validationError as Error).message : null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and POST methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Editor articles API error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing articles',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply error handler only
export default withErrorHandler(handler);
      
