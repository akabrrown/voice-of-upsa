import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if user is an editor
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || (userData.role !== 'editor' && userData.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Editor role required.'
      });
    }

    if (req.method === 'GET') {
      // Get single article
      const { data: article, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('author_id', user.id)
        .single();

      if (fetchError) {
        console.error('Article fetch error:', fetchError);
        return res.status(404).json({
          success: false,
          error: 'Article not found'
        });
      }

      return res.status(200).json({
        success: true,
        article
      });

    } else if (req.method === 'PUT') {
      // Update article
      const { title, content, excerpt, featured_image, status } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Title and content are required'
        });
      }

      // First verify the article belongs to this editor
      const { data: existingArticle, error: checkError } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('id', id)
        .eq('author_id', user.id)
        .single();

      if (checkError || !existingArticle) {
        return res.status(404).json({
          success: false,
          error: 'Article not found or access denied'
        });
      }

      const updateData: {
        title: string;
        content: string;
        excerpt: string;
        featured_image: string | null;
        status: 'draft' | 'published';
        updated_at: string;
        published_at?: string;
      } = {
        title,
        content,
        excerpt,
        featured_image,
        status,
        updated_at: new Date().toISOString()
      };

      // Set published_at if status is being changed to published
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { data: updatedArticle, error: updateError } = await supabaseAdmin
        .from('articles')
        .update(updateData)
        .eq('id', id)
        .eq('author_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Article update error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update article'
        });
      }

      return res.status(200).json({
        success: true,
        article: updatedArticle
      });

    } else if (req.method === 'DELETE') {
      // Delete article
      const { data: existingArticle, error: checkError } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('id', id)
        .eq('author_id', user.id)
        .single();

      if (checkError || !existingArticle) {
        return res.status(404).json({
          success: false,
          error: 'Article not found or access denied'
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id);

      if (deleteError) {
        console.error('Article delete error:', deleteError);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete article'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Article deleted successfully'
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Editor article API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
