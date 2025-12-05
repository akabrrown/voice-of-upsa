import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('Bookmarks API called');
    
    // Simple auth check - get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization header',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
          details: error?.message
        },
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('User authenticated:', user.id);

    // Validate pagination parameters
    const paginationSchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(50).default(10)
    });
    const validatedParams = paginationSchema.parse(req.query);
    
    const limit = validatedParams.limit;
    const offset = (validatedParams.page - 1) * limit;
    
    console.log('Fetching bookmarks for user:', user.id, 'limit:', limit, 'offset:', offset);

    // Get user's bookmarked articles with direct joins
    const { data: bookmarks, error: bookmarksError } = await supabaseAdmin
      .from('article_bookmarks')
      .select(`
        id,
        article_id,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Bookmarks query result:', { bookmarks, bookmarksError });

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
      
      // Check if the table doesn't exist
      if (bookmarksError.message?.includes('does not exist') || bookmarksError.code === 'PGRST116') {
        return res.status(200).json({
          success: true,
          data: {
            message: 'Bookmarks table does not exist yet - please run the SQL schema',
            bookmarks: [],
            pagination: {
              currentPage: validatedParams.page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit,
              hasNextPage: false,
              hasPreviousPage: false
            }
          },
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'BOOKMARKS_QUERY_FAILED',
          message: 'Failed to fetch bookmarks',
          details: bookmarksError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // If no bookmarks found, return empty response
    if (!bookmarks || bookmarks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          bookmarks: [],
          pagination: {
            currentPage: validatedParams.page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Now fetch article details for each bookmark
    const transformedBookmarks = await Promise.all(
      bookmarks.map(async (bookmark) => {
        try {
          console.log('Processing bookmark:', bookmark);
          
          // Fetch article details separately
          const { data: article, error: articleError } = await supabaseAdmin
            .from('articles')
            .select('*')
            .eq('id', bookmark.article_id)
            .single();
          
          if (articleError || !article) {
            console.error('Error fetching article:', articleError);
            throw new Error('Article not found');
          }
          
          console.log('Article data:', article);
          
          // Fetch author information with error handling
          let authorName = 'Unknown';
          let authorAvatar = undefined;
          
          if (article.author_id) {
            try {
              const { data: author } = await supabaseAdmin
                .from('auth.users')
                .select('raw_user_meta_data, email')
                .eq('id', article.author_id)
                .single();
              
              authorName = author?.raw_user_meta_data?.name || author?.email || 'Unknown';
              authorAvatar = author?.raw_user_meta_data?.avatar_url;
            } catch (authorError) {
              console.error('Error fetching author:', authorError);
              authorName = 'Unknown';
            }
          }
          
          return {
            id: article.id,
            title: article.title || 'Untitled Article',
            slug: article.slug || '',
            excerpt: article.excerpt || '',
            featured_image: article.featured_image,
            author_name: authorName,
            author_avatar_url: authorAvatar,
            views_count: article.views_count || 0,
            likes_count: article.likes_count || 0,
            comments_count: article.comments_count || 0,
            bookmarks_count: 0, // Default to 0 since column doesn't exist
            published_at: article.published_at,
            bookmarked_at: bookmark.created_at
          };
        } catch (error) {
          console.error('Error processing bookmark:', error);
          // Return a minimal bookmark object if processing fails
          return {
            id: bookmark.id || 'error-' + Date.now(), // Use bookmark ID if available
            title: 'Error loading article',
            slug: '',
            excerpt: '',
            featured_image: undefined,
            author_name: 'Unknown',
            author_avatar_url: undefined,
            views_count: 0,
            likes_count: 0,
            comments_count: 0,
            bookmarks_count: 0,
            published_at: new Date().toISOString(),
            bookmarked_at: bookmark.created_at
          };
        }
      })
    );

    // Get total count of bookmarks
    let totalCount = 0;
    try {
      const { count, error: countError } = await supabaseAdmin
        .from('article_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!countError && count !== null) {
        totalCount = count;
      }
    } catch (error) {
      console.error('Error counting bookmarks:', error);
      // Continue with totalCount = 0
    }

    res.status(200).json({
      success: true,
      data: {
        bookmarks: transformedBookmarks,
        pagination: {
          currentPage: validatedParams.page,
          totalPages: Math.ceil((totalCount || 0) / limit),
          totalItems: totalCount || 0,
          itemsPerPage: limit,
          hasNextPage: (offset + limit) < (totalCount || 0),
          hasPreviousPage: validatedParams.page > 1
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bookmarks API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching bookmarks',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
