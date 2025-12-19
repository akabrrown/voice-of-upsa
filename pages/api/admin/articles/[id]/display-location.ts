import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for display location
const updateDisplayLocationSchema = z.object({
  display_location: z.enum(['homepage', 'category_page', 'both', 'none'])
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow PUT for updating display location
    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only PUT method is allowed for updating display location',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    const validatedData = updateDisplayLocationSchema.parse(req.body);
    const { display_location } = validatedData;

    // Get article ID from query params
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Article ID is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log admin display location update action
    console.log(`Admin article display location update initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      articleId: id,
      newDisplayLocation: display_location,
      timestamp: new Date().toISOString()
    });

    // Verify article exists before updating
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: existingArticle, error: fetchError } = await (await supabaseAdmin as any)
      .from('articles')
      .select('id, title, display_location')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Admin display location fetch error:', fetchError);
      return res.status(404).json({
        success: false,
        error: {
          code: 'ARTICLE_NOT_FOUND',
          message: 'Article not found',
          details: process.env.NODE_ENV === 'development' ? fetchError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update article display location
    const { data: article, error: updateError } = await (await supabaseAdmin as any)
      .from('articles')
      .update({
        display_location: validatedData.display_location,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        title,
        display_location,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Admin display location update error:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update display location',
          details: process.env.NODE_ENV === 'development' ? updateError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful display location update
    console.log(`Admin article display location updated successfully`, {
      adminId: user.id,
      articleId: article.id,
      articleTitle: article.title,
      oldDisplayLocation: existingArticle.display_location,
      newDisplayLocation: article.display_location,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Display location updated successfully',
      data: {
        article,
        updated_by: user.id,
        updated_at: article.updated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin display location API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating display location',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));
