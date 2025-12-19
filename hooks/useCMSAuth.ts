import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface CMSUser {
  id: string;
  email?: string;
  role?: string;
  permissions?: string[];
}

interface CMSAuthState {
  user: CMSUser | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  isEditor: () => boolean;
  isAdmin: () => boolean;
}

export function useCMSAuth(): CMSAuthState {
  const [user, setUser] = useState<CMSUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'editor') {
      // Editors have most permissions except admin-specific ones
      const editorPermissions = [
        'write:content',
        'edit:own_content',
        'delete:own_content',
        'manage:articles',
        'upload:media'
      ];
      return editorPermissions.includes(permission) || permission.startsWith('write:') || permission.startsWith('edit:') || permission.startsWith('delete:');
    }
    return user.permissions?.includes(permission) || false;
  };

  const isEditor = (): boolean => {
    return user?.role === 'editor' || user?.role === 'admin';
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get CMS user role and permissions via API
          try {
            const response = await fetch('/api/cms/user', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              const cmsUser = data.data?.user;
              
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: cmsUser?.role || 'user',
                permissions: cmsUser?.permissions || []
              });
            } else {
              // Fallback to regular user role if CMS endpoint fails
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'user',
                permissions: []
              });
            }
          } catch (error) {
            console.warn('Failed to fetch CMS user data:', error);
            // Fallback to regular user role
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'user',
              permissions: []
            });
          }
        }
      } catch (error) {
        console.error('Error getting initial CMS session:', error);
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
          // Get CMS user role and permissions via API
          try {
            const response = await fetch('/api/cms/user', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              const cmsUser = data.data?.user;
              
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: cmsUser?.role || 'user',
                permissions: cmsUser?.permissions || []
              });
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'user',
                permissions: []
              });
            }
          } catch (error) {
            console.warn('Failed to fetch CMS user data:', error);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'user',
              permissions: []
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { 
    user, 
    loading, 
    hasPermission, 
    isEditor, 
    isAdmin 
  };
}