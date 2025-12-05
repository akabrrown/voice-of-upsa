import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    // Authenticate user (must be admin)
    const user = await authenticate(req);
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔄 Starting manual user sync...');

    // Get all users from Supabase auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw new Error('Failed to fetch auth users');
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth system`);

    let syncedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Sync each auth user to our users table
    for (const authUser of authUsers.users) {
      try {
        const { data: existingUser, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error(`Error checking user ${authUser.id}:`, fetchError);
          errorCount++;
          continue;
        }

        if (!existingUser) {
          // Create new user record
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              role: 'user',
              avatar_url: authUser.user_metadata?.avatar_url || null,
              bio: null,
              website: null,
              location: null,
              social_links: {},
              preferences: {},
              email_verified: authUser.email_confirmed_at ? true : false,
              created_at: authUser.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`Error creating user ${authUser.id}:`, insertError);
            errorCount++;
          } else {
            console.log(`✅ Created user: ${authUser.email}`);
            syncedCount++;
          }
        } else {
          // Update existing user if needed
          const needsUpdate = 
            existingUser.email !== authUser.email ||
            existingUser.name !== (authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User') ||
            existingUser.avatar_url !== (authUser.user_metadata?.avatar_url || null) ||
            existingUser.email_verified !== (authUser.email_confirmed_at ? true : false);

          if (needsUpdate) {
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                email: authUser.email,
                name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                avatar_url: authUser.user_metadata?.avatar_url || null,
                email_verified: authUser.email_confirmed_at ? true : false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', authUser.id);

            if (updateError) {
              console.error(`Error updating user ${authUser.id}:`, updateError);
              errorCount++;
            } else {
              console.log(`🔄 Updated user: ${authUser.email}`);
              updatedCount++;
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing user ${authUser.id}:`, error);
        errorCount++;
      }
    }

    console.log(`📈 Sync complete: ${syncedCount} created, ${updatedCount} updated, ${errorCount} errors`);

    return res.status(200).json({
      success: true,
      data: {
        message: 'User sync completed',
        stats: {
          totalAuthUsers: authUsers.users.length,
          syncedCount,
          updatedCount,
          errorCount
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('User sync error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_FAILED',
        message: 'Failed to sync users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
