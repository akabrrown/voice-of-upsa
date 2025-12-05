import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate, checkRole } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Authenticate user
  const user = await authenticate(req);

  // Authorize admin access
  if (!checkRole(user.role, ['admin'])) {
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

  const { userId, email } = req.body;
  
  if (!userId || !email) {
    return res.status(400).json({
      success: false,
      error: 'User ID and email are required'
    });
  }

  // Generate a password reset token for the user
  console.log('Generating reset link for:', { userId, email });
  
  // First check if user exists in Supabase Auth
  console.log('Checking if user exists in Supabase Auth...');
  
  // Try multiple methods to find the user
  let existingUser = null;
  let userCheckError = null;
  
  // Method 1: Try getUserById (works for confirmed users)
  const { data: userByIdData, error: userByIdError } = await supabaseAdmin.auth.admin.getUserById(userId);
  
  if (!userByIdError && userByIdData?.user) {
    existingUser = userByIdData.user;
  } else {
    // Method 2: Try listUsers with filter (works for unconfirmed users)
    console.log('Trying listUsers method for unconfirmed user...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (!listError && users?.users) {
      existingUser = users.users.find(u => u.id === userId);
    }
    
    if (!existingUser) {
      userCheckError = userByIdError || listError || new Error('User not found');
    }
  }
  
  if (!existingUser) {
    console.error('User not found in Supabase Auth:', userCheckError);
    return res.status(404).json({
      success: false,
      error: 'User not found in Supabase Auth. Please ensure the user exists before generating invitation.',
      details: userCheckError?.message
    });
  }
  
  // Use email from existingUser if available, otherwise fallback to request body email
  const targetEmail = existingUser.email || email;
  
  if (!targetEmail) {
    throw new Error('No email address available for invitation');
  }

  // For unconfirmed users, we need to use the invite method instead of recovery
  console.log('Generating invitation link for user:', targetEmail);
  
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite', // Use invite type for unconfirmed users
    email: targetEmail,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      data: {
        target_email: targetEmail
      }
    }
  });

  if (error) {
    console.error('Error generating invitation link:', error);
    // If invite fails, try magic link as fallback
    console.log('Trying magic link as fallback...');
    const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      }
    });
    
    if (magicError) {
      console.error('Magic link also failed:', magicError);
      throw new Error(`Failed to generate invitation link: ${error.message}`);
    }
    
    const resetLink = magicData.properties?.action_link;
    
    return res.status(200).json({
      success: true,
      data: {
        resetLink,
        email: targetEmail,
        instructions: 'Share this invitation link with the user so they can set their password'
      },
      message: 'Invitation link generated successfully using magic link'
    });
  }

  const resetLink = data.properties?.action_link;

  if (!resetLink) {
    console.error('No invitation link in response data:', data);
    throw new Error('Failed to generate invitation link: No action link returned');
  }

  return res.status(200).json({
    success: true,
    data: {
      resetLink,
      email: targetEmail,
      instructions: 'Share this invitation link with the user so they can set their password'
    },
    message: 'Invitation link generated successfully'
  });
}

export default withErrorHandler(handler);

