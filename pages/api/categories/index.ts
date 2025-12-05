import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET - List categories
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

      return res.status(200).json({ categories: data || [] });
    }

    // POST - Create category (admin only)
    if (req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
      }

      // Verify the token and get user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user }, error: authError } = await (supabaseAdmin as any).auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      // Check if user is admin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userData, error: userError } = await (supabaseAdmin as any)
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData || userData.role !== 'admin') {
        return res.status(403).json({ error: 'Insufficient permissions - Admin access required' });
      }

      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'Category name is required'
        });
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: category, error } = await (supabaseAdmin as any)
        .from('categories')
        .insert({
          name,
          slug,
          description: description || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ error: 'Failed to create category' });
      }

      return res.status(201).json({ category });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

