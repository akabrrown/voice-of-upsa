import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema for account deletion confirmation
const deleteAccountSchema = z.object({
  confirmation: z.string().regex(/^DELETE MY ACCOUNT$/, 'Confirmation must be exactly "DELETE MY ACCOUNT"'),
  password: z.string().min(1, 'Password confirmation is required')
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Apply strict rate limiting for account deletion
    const rateLimit = getCMSRateLimit('DELETE');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Only allow DELETE
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
  // Validate deletion confirmation
    const validatedData = deleteAccountSchema.parse(req.body);
    const { password } = validatedData;

    // Verify password before deletion (additional security)
    const supabaseAdmin = await getSupabaseAdmin();
    const { error: passwordError } = await (await supabaseAdmin as any).auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (passwordError) {
      console.error(`Password verification failed for account deletion by user ${user.email}:`, passwordError);
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

    // Log account deletion initiation
    console.info(`Account deletion initiated for user: ${user.id}`, {
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // Start transaction-like deletion process
    const deletionErrors = [];

    try {
      // Delete user's articles
      const { error: articlesError } = await (await supabaseAdmin as any)
        .from('articles')
        .delete()
        .eq('author_id', user.id);
      
      if (articlesError) {
        deletionErrors.push(`Articles: ${articlesError.message}`);
      }

      // Delete user's comments
      const { error: commentsError } = await (await supabaseAdmin as any)
        .from('comments')
        .delete()
        .eq('user_id', user.id);
      
      if (commentsError) {
        deletionErrors.push(`Comments: ${commentsError.message}`);
      }

      // Delete user's bookmarks
      const { error: bookmarksError } = await (await supabaseAdmin as any)
        .from('article_bookmarks')
        .delete()
        .eq('user_id', user.id);
      
      if (bookmarksError) {
        deletionErrors.push(`Bookmarks: ${bookmarksError.message}`);
      }

      // Delete user profile from users table
      const { error: profileError } = await (await supabaseAdmin as any)
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        deletionErrors.push(`Profile: ${profileError.message}`);
      }

    } catch (cleanupError) {
      deletionErrors.push(`Cleanup: ${(cleanupError as Error).message}`);
    }

    // Delete user from Supabase Auth
    const { error: authDeleteError } = await (await supabaseAdmin as any).auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      deletionErrors.push(`Auth: ${authDeleteError.message}`);
    }

    // Check if any errors occurred
    if (deletionErrors.length > 0) {
      console.error(`Account deletion partially failed for user ${user.email}:`, deletionErrors);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETION_PARTIAL_FAILURE',
          message: 'Account deletion encountered errors',
          details: process.env.NODE_ENV === 'development' ? deletionErrors : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful account deletion
    console.info(`Account successfully deleted for user: ${user.email}`, {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Account successfully deleted'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Account deletion API error for user ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during account deletion',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'delete:account',
  auditAction: 'user_account_deleted'
}));

                      
