import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

interface UserUpdateData {
  name?: string;
  bio?: string;
  avatar_url?: string;
  role?: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // For GET requests, we require a token for consistent authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no token, we can't authenticate reliably with admin client
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // User is authenticated, proceed with request
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        avatar_url,
        bio,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(userData);

  } catch (error) {
    console.error('Error in handleGet:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user can update this profile (own profile or admin)
    if (user.id !== id) {
      const { data: requestingUser } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const { name, bio, avatar_url, role } = req.body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.length > 255)) {
      return res.status(400).json({ error: 'Invalid name' });
    }

    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 1000)) {
      return res.status(400).json({ error: 'Invalid bio' });
    }

    if (avatar_url !== undefined && (typeof avatar_url !== 'string' || avatar_url.length > 500)) {
      return res.status(400).json({ error: 'Invalid avatar URL' });
    }

    // Only admins can change roles
    if (role !== undefined) {
      const { data: requestingUser } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can change roles' });
      }

      if (!['user', 'editor', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
    }

    // Update user
    const updateData: UserUpdateData = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (role !== undefined) updateData.role = role;

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in handlePut:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}
