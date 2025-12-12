import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabaseClient';

type SupabaseContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  userRole: string | null;
  loading: boolean;
  refreshUserRole: () => Promise<void>;
};

const Context = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseClient();

  // Fetch user role via API to avoid RLS issues
  const fetchUserRole = useCallback(async () => {
    try {
      // Get current session to get access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.data?.user?.role || 'user');
        } else {
          setUserRole('user');
        }
      } else {
        setUserRole('user');
      }
    } catch (error: unknown) {
      console.error('Error fetching user role:', error);
      // If we get a 401/403 (likely due to invalid RLS or token), we should probably not default to 'user' quietly.
      // But for now, just fallback.
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        const err = error as { code?: string; message?: string };
        if (err.code === 'PGRST301' || err.message?.includes('JWT')) {
           // JWT expired or invalid
           supabase.auth.signOut();
        }
      }
      setUserRole('user');
    }
  }, [supabase.auth]);

  // Function to force refresh user role
  const refreshUserRole = useCallback(async () => {
    if (user) {
      await fetchUserRole();
    }
  }, [user, fetchUserRole]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole();
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
      
      if (event === 'SIGNED_IN') {
        // Only replace if the current path is valid (has all required parameters)
        if (router.asPath && !router.asPath.includes('[slug]') && !router.asPath.includes('[id]')) {
          router.replace(router.asPath);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, fetchUserRole, supabase.auth]);

  return (
    <Context.Provider value={{ supabase, session, user, userRole, loading, refreshUserRole }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
