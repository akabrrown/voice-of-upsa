import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const supabase = await getSupabaseAdmin()
    
    // Check if user exists in public.users table
    const { data: publicUser, error: publicError } = await (supabase as any)
      .from('users')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle();
    
    if (publicError) {
      console.error('Error checking user existence in public.users:', publicError)
      return res.status(500).json({ error: 'Failed to check user in public.users' })
    }

    // Check if user exists in auth.users
    let authUser = null;
    let isOrphaned = false;

    if (publicUser) {
      try {
        const { data: { users }, error: authError } = await (supabase as any).auth.admin.listUsers();
        
        if (!authError && users) {
          authUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          
          // User exists in public but not in auth = orphaned
          if (!authUser) {
            isOrphaned = true;
            console.log(`Orphaned user detected: ${email} (exists in public.users but not auth.users)`);
          }
        }
      } catch (authCheckError) {
        console.error('Error checking auth.users:', authCheckError);
        // Continue anyway - we'll assume not orphaned if we can't check
      }
    }

    return res.status(200).json({ 
      exists: !!publicUser,
      isOrphaned,
      email: email
    })
  } catch (error) {
    console.error('Unexpected error in check-user API:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
