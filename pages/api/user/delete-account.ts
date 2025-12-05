import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema for account deletion confirmation
const deleteAccountSchema = z.object({
  confirmation: z.string().min(1, 'Confirmation is required'),
  password: z.string().min(1, 'Password confirmation is required')
});

// Rate limiting: 1 deletion attempt per hour per user
const rateLimitMiddleware = withRateLimit(1, 60 * 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only DELETE method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user
    const user = await authenticate(req);

    // Validate deletion confirmation
    const validatedData = deleteAccountSchema.parse(req.body);
    const { confirmation, password } = validatedData;

    // Require explicit confirmation text
    if (confirmation.toLowerCase() !== 'delete my account') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIRMATION',
          message: 'You must type "delete my account" exactly to confirm account deletion',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Verify password before deletion (additional security)
    const { error: passwordError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (passwordError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid password confirmation',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log account deletion attempt
    console.info(`Account deletion initiated for user: ${user.id}`, {
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // Delete user's data in order to respect foreign key constraints
    const deletionResults = {
      profile: false,
      articles: false,
      comments: false,
      reactions: false,
      bookmarks: false,
      authUser: false
    };

    // Delete user's profile from database first
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
    } else {
      deletionResults.profile = true;
    }

    // Delete user's articles
    const { error: articlesError } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('author_id', user.id);

    if (articlesError) {
      console.error('Error deleting user articles:', articlesError);
    } else {
      deletionResults.articles = true;
    }

    // Delete user's comments
    const { error: commentsError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('user_id', user.id);

    if (commentsError) {
      console.error('Error deleting user comments:', commentsError);
    } else {
      deletionResults.comments = true;
    }

    // Delete user's reactions
    const { error: reactionsError } = await supabaseAdmin
      .from('reactions')
      .delete()
      .eq('user_id', user.id);

    if (reactionsError) {
      console.error('Error deleting user reactions:', reactionsError);
    } else {
      deletionResults.reactions = true;
    }

    // Delete user's bookmarks
    const { error: bookmarksError } = await supabaseAdmin
      .from('article_bookmarks')
      .delete()
      .eq('user_id', user.id);

    if (bookmarksError) {
      console.error('Error deleting user bookmarks:', bookmarksError);
    } else {
      deletionResults.bookmarks = true;
    }

    // Delete the auth user (this will also invalidate all sessions)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
      true // Should delete user completely
    );

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ACCOUNT_DELETION_FAILED',
          message: 'Failed to delete account',
          details: deleteError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    deletionResults.authUser = true;

    // Log successful account deletion
    console.info(`Account deleted successfully for user: ${user.id}`, {
      email: user.email,
      deletionResults,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Account deleted successfully',
        deletionResults
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while deleting account',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

