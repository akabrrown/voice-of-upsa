import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for admin operations

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;

        return res.status(200).json({
          success: true,
          data: data
        });
      } catch (error: unknown) {
        console.error('Error fetching team members:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch team members', 
          details: error instanceof Error ? error.message : String(error) 
        });
      }

    case 'POST':
      try {
        const { name, role, bio, image_url, order_index, is_active } = req.body;

        if (!name || !role) {
          return res.status(400).json({ success: false, error: 'Name and role are required' });
        }

        const { data, error } = await supabase
          .from('team_members')
            // @ts-expect-error - forcing insert for now
            .insert({
            name,
            role,
            bio,
            image_url,
            order_index: order_index || 0,
            is_active: is_active !== undefined ? is_active : true
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          success: true,
          message: 'Team member created successfully',
          data: data
        });
      } catch (error: unknown) {
        console.error('Error creating team member:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create team member', 
          details: error instanceof Error ? error.message : String(error)
        });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:team',
  auditAction: 'team_member_managed'
}));
