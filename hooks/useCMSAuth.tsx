import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '../lib/supabase/client';
import toast from 'react-hot-toast';

export interface CMSUser {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  permissions: string[];
  lastActivity: Date;
  securityLevel: 'low' | 'medium' | 'high';
}

export interface CMSAuthOptions {
  requireRole?: string;
  requirePermission?: string;
  redirectTo?: string;
}

export interface CMSAuthState {
  user: CMSUser | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isEditor: () => boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Hook for CMS authentication and authorization
 * Provides role-based access control for frontend components
 */
export function useCMSAuth(): CMSAuthState {
  const [cmsUser, setCmsUser] = useState<CMSUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use singleton Supabase client
  const supabase = getSupabaseClient();

  const fetchCMSUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('CMS Auth: No session found');
        setCmsUser(null);
        return;
      }

      console.log('CMS Auth: Fetching user data for session:', session.user.email);

      // Call CMS auth endpoint to verify and get user details
      const response = await fetch('/api/cms/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Unauthorized - redirect to login only if not already on auth pages
          console.log('CMS Auth: Unauthorized, redirecting to login');
          if (!router.pathname.startsWith('/auth/')) {
            router.push('/auth/sign-in');
          }
          return;
        }
        throw new Error('Failed to verify CMS access');
      }

      const data = await response.json();
      console.log('CMS Auth: Received user data:', data);
      
      if (data.success && data.user) {
        console.log('CMS Auth: Setting user with role:', data.user.role);
        setCmsUser(data.user);
      } else {
        throw new Error(data.error?.message || 'Invalid CMS user data');
      }

    } catch (err) {
      console.error('CMS Auth Error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setCmsUser(null);
      
      // Redirect to login on auth error only if not already on auth pages
      if (err instanceof Error && 
          (err.message.includes('session') || 
           err.message.includes('unauthorized') ||
           err.message.includes('401') ||
           err.message.includes('403'))) {
        if (!router.pathname.startsWith('/auth/')) {
          router.push('/auth/sign-in');
        }
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent infinite loops - intentionally omitting router and supabase.auth

  const refreshUser = useCallback(async () => {
    console.log('CMS Auth: Manual refresh triggered');
    await fetchCMSUser();
  }, [fetchCMSUser]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!cmsUser) return false;
    // Admin users have all permissions
    if (cmsUser.role === 'admin') return true;
    return cmsUser.permissions.includes(permission);
  }, [cmsUser]);

  const hasRole = useCallback((role: string): boolean => {
    if (!cmsUser) return false;
    return cmsUser.role === role;
  }, [cmsUser]);

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isEditor = useCallback((): boolean => {
    return hasRole('editor') || hasRole('admin');
  }, [hasRole]);

  useEffect(() => {
    fetchCMSUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - intentionally omitting fetchCMSUser to prevent infinite loops

  return {
    user: cmsUser,
    loading,
    error,
    hasPermission,
    hasRole,
    isAdmin,
    isEditor,
    refreshUser,
  };
}

/**
 * Higher-order component for protecting routes with CMS authorization
 */
export function withCMSAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { 
    requireRole?: string; 
    requirePermission?: string;
    redirectTo?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, error, hasRole, hasPermission } = useCMSAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return; // Still loading

      if (error || !user) {
        // Not authenticated - redirect to login
        const redirectTo = options.redirectTo || '/auth/login';
        router.push(redirectTo);
        return;
      }

      // Check role requirement
      if (options.requireRole && !hasRole(options.requireRole)) {
        toast.error('Insufficient permissions to access this page');
        router.push('/admin');
        return;
      }

      // Check permission requirement
      if (options.requirePermission && !hasPermission(options.requirePermission)) {
        toast.error('Insufficient permissions to access this page');
        router.push('/admin');
        return;
      }

    }, [loading, error, user, hasRole, hasPermission, router]);

    // If still loading, show loading state
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      );
    }

    // If error or no user, show access denied
    if (error || !user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              {error || 'You must be logged in to access this page.'}
            </p>
            <button
              onClick={() => router.push('/auth/sign-in')}
              className="bg-golden text-navy font-semibold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      );
    }

    // User is authenticated and authorized, render the component
    return <Component {...props} />;
  };
}

/**
 * Hook for CMS-specific API calls with automatic authorization
 */
export function useCMSAPI() {
  const { user, loading } = useCMSAuth();
  
  // Use singleton Supabase client
  const supabase = getSupabaseClient();

  const apiCall = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (loading || !user) {
      throw new Error('Not authenticated');
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      // Session expired or insufficient permissions
      throw new Error('Session expired or insufficient permissions');
    }

    return response;
  }, [user, loading, supabase]);

  return { apiCall };
}
