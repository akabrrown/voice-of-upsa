import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';

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
    // User is already authenticated and verified as admin by withCMSSecurity middleware
    // The middleware passes the user object to the handler

    console.log('🔄 Starting manual user sync...');

    // Get the admin client (it's a Promise)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminClient: any = await supabaseAdmin;

    // Get all users from Supabase auth
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
    
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
        const { data: existingUser, error: fetchError } = await adminClient
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
          const { error: insertError } = await adminClient
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              role: 'user',
              avatar_url: authUser.user_metadata?.avatar_url || null,
              status: 'active',
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
            existingUser.avatar_url !== (authUser.user_metadata?.avatar_url || null);

          if (needsUpdate) {
            const { error: updateError } = await adminClient
              .from('users')
              .update({
                email: authUser.email,
                name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                avatar_url: authUser.user_metadata?.avatar_url || null,
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

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:users',
  auditAction: 'users_sync_all'
}));
