import { NextApiRequest, NextApiResponse } from 'next';
import { findUserByEmail, generateToken, createSessionCookie } from '@/lib/simple-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user from database by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials - user not found' });
    }

    // For demo purposes, accept any password for existing users
    // In production, verify: await bcrypt.compare(password, user.passwordHash)
    console.log(`User logged in: ${user.email} with role: ${user.role}`);
    
    const token = generateToken(user);
    
    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', createSessionCookie(token));
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
