import { useEffect, useState } from 'react';
import { SimpleUser, verifyToken } from '@/lib/simple-auth';

export function useSimpleAuth() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage or cookie
    const checkAuth = () => {
      try {
        // Try localStorage first
        let token = localStorage.getItem('auth-token');
        
        // Fallback to document cookie
        if (!token) {
          const cookies = document.cookie.split(';');
          const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
          if (authCookie) {
            const cookieValue = authCookie.split('=')[1];
            token = cookieValue || null;
          }
        }

        if (token) {
          const decodedUser = verifyToken(token);
          if (decodedUser) {
            setUser(decodedUser);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('auth-token');
            document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string) => {
    const decodedUser = verifyToken(token);
    if (decodedUser) {
      setUser(decodedUser);
      localStorage.setItem('auth-token', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-token');
    document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  return { user, loading, login, logout };
}
