import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { method } = req;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }

  switch (method) {
    case 'PUT':
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates = req.body;
        
        const { data, error } = await supabase
          .from('team_members')
          // @ts-expect-error - forcing update for now
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({
          success: true,
          message: 'Team member updated successfully',
          data: data
        });
      } catch (error: unknown) {
        console.error('Error updating team member:', error);
        return res.status(500).json({ success: false, error: 'Failed to update team member' });
      }

    case 'DELETE':
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return res.status(200).json({
          success: true,
          message: 'Team member deleted successfully'
        });
      } catch (error: unknown) {
        console.error('Error deleting team member:', error);
        return res.status(500).json({ success: false, error: 'Failed to delete team member' });
      }

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:team',
  auditAction: 'team_member_modified'
}));
