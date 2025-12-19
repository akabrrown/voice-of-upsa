import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema for auto-save
const autoSaveSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must not exceed 500 characters').optional(),
  featured_image: z.string().url('Invalid image URL').nullable().optional(),
  status: z.enum(['draft', 'published', 'pending_review']).default('draft'),
  tags: z.array(z.string()).optional(),
  reading_time: z.number().min(1).optional(),
  is_featured: z.boolean().default(false),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Handle authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: { user }, error: authError } = await (await supabaseAdmin as any).auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Apply rate limiting
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Validate request body
    const validationResult = autoSaveSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationResult.error.errors
        },
        timestamp: new Date().toISOString()
      });
    }

    const articleData = validationResult.data;

    // Check if user has an existing draft for this article
    const { data: existingDraft, error: fetchError } = await (await supabaseAdmin as any)
      .from('articles')
      .select('id')
      .eq('author_id', user.id)
      .eq('status', 'draft')
      .eq('title', articleData.title)
      .single();

    let result;
    
    if (existingDraft && !fetchError) {
      // Update existing draft
      const { data: updatedDraft, error: updateError } = await (await supabaseAdmin as any)
        .from('articles')
        .update({
          ...articleData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .select('id, updated_at')
        .single();

      if (updateError) {
        console.error('Auto-save update error:', updateError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update draft',
            details: process.env.NODE_ENV === 'development' ? updateError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }
      
      result = updatedDraft;
    } else {
      // Create new draft
      const { data: newDraft, error: insertError } = await (await supabaseAdmin as any)
        .from('articles')
        .insert({
          ...articleData,
          author_id: user.id,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, updated_at')
        .single();

      if (insertError) {
        console.error('Auto-save insert error:', insertError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'INSERT_ERROR',
            message: 'Failed to create draft',
            details: process.env.NODE_ENV === 'development' ? insertError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }
      
      result = newDraft;
    }

    console.log(`Auto-save successful for user ${user.email}:`, {
      articleId: result.id,
      title: articleData.title,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        id: result.id,
        updated_at: result.updated_at,
        message: 'Draft auto-saved successfully'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auto-save API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during auto-save',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);
