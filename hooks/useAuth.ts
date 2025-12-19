import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export function useAuth() {
  // Use the original Supabase auth system
  const { user, loading, userRole } = useSupabase();
  
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Convert Supabase auth user to the expected format
    if (user) {
      setAuthUser({
        id: user.id,
        email: user.email,
        role: userRole || undefined
      });
    } else {
      setAuthUser(null);
    }
    setAuthLoading(loading);
  }, [user, userRole, loading]);

  return {
    user: authUser,
    loading: authLoading
  };
}
