import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user role via API to avoid RLS issues
          let userRole = 'user';
          try {
            const response = await fetch('/api/auth/user', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              userRole = data.data?.user?.role || 'user';
            }
          } catch (error) {
            console.warn('Failed to fetch user role:', error);
          }

          setUser({
            id: session.user.id,
            email: session.user.email,
            role: userRole
          });
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Get user role via API to avoid RLS issues
          let userRole = 'user';
          try {
            const response = await fetch('/api/auth/user', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              userRole = data.data?.user?.role || 'user';
            }
          } catch (error) {
            console.warn('Failed to fetch user role:', error);
          }

          setUser({
            id: session.user.id,
            email: session.user.email,
            role: userRole
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
