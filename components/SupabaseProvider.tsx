import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';

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
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('=== SupabaseProvider fetchUserRole DEBUG ===');
          console.log('Full API Response:', JSON.stringify(data, null, 2));
          console.log('data.data:', data.data);
          console.log('data.data?.profile:', data.data?.profile);
          console.log('data.data?.profile?.role:', data.data?.profile?.role);
          // API returns { success: true, data: { profile: { role: '...' } } }
          const extractedRole = data.data?.profile?.role || 'user';
          console.log('Extracted role:', extractedRole);
          setUserRole(extractedRole);
        } else {
          console.log('=== SupabaseProvider fetchUserRole FAILED ===');
          console.log('Response status:', response.status);
          const errorText = await response.text();
          console.log('Error response:', errorText);
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
        // Only redirect if we're on auth pages to avoid redirect loops
        if (router.pathname.startsWith('/auth/')) {
          const redirectUrl = router.query.redirect_url as string || '/';
          router.replace(redirectUrl);
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
