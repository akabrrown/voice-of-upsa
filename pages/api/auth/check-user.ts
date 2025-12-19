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
    
    // Check if user exists in auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error checking user existence:', error)
      return res.status(500).json({ error: 'Failed to check user' })
    }

    const userExists = users.users.some((user: { email?: string }) => user.email === email)
    
    return res.status(200).json({ 
      exists: userExists,
      email: email
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
