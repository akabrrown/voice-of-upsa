import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/components/SupabaseProvider';

interface AdLocation {
  id: string;
  name: string;
  display_name: string;
  description: string;
  page_location: string;
  position_type: string;
  is_premium: boolean;
  base_price?: number;
  dimensions: string;
  is_active: boolean;
  sort_order: number;
}

const AdLocationsManager: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { session, refreshUserRole, supabase } = useSupabase();
  const [locations, setLocations] = useState<AdLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        toast.error('No active session');
        return;
      }
      
      // Get fresh session directly from Supabase
      console.log('Ad-locations: Calling supabase.auth.getSession()...');
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Ad-locations: getSession result:', {
        sessionError: !!sessionError,
        sessionErrorMessage: sessionError?.message,
        freshSession: !!freshSession,
        sessionKeys: freshSession ? Object.keys(freshSession) : 'none',
        hasAccessToken: !!freshSession?.access_token,
        tokenLength: freshSession?.access_token?.length || 0
      });
      
      if (sessionError) {
        console.error('Ad-locations: Session error:', sessionError);
        toast.error('Failed to get authentication session');
        return;
      }
      
      if (!freshSession || !freshSession.access_token) {
        toast.error('No valid authentication token');
        console.error('Ad-locations: Missing session or token', {
          hasSession: !!freshSession,
          hasAccessToken: !!freshSession?.access_token
        });
        return;
      }
      
      console.log('Ad-locations: User:', user);
      console.log('Ad-locations: Fresh session exists:', !!freshSession);
      console.log('Ad-locations: Fresh session object:', freshSession);
      console.log('Ad-locations: Fresh session keys:', freshSession ? Object.keys(freshSession) : 'none');
      console.log('Ad-locations: Token length:', freshSession?.access_token?.length || 0);
      console.log('Ad-locations: Token preview:', freshSession?.access_token?.substring(0, 20) + '...' || 'none');
      console.log('Ad-locations: Authorization header will be:', `Bearer ${freshSession?.access_token}`);
      
      // Debug token validation first
      try {
        console.log('Ad-locations: Testing token with debug endpoint...');
        const debugResponse = await fetch('/api/admin/debug-token', {
          headers: {
            'Authorization': `Bearer ${freshSession?.access_token}`,
          },
        });
        const debugResult = await debugResponse.json();
        console.log('Ad-locations: Debug token result:', debugResult);
      } catch (debugError) {
        console.error('Ad-locations: Debug token error:', debugError);
      }
      
      const response = await fetch('/api/admin/ad-locations', {
        headers: {
          'Authorization': `Bearer ${freshSession?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ad-locations: API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch locations: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      setLocations(data.data?.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load ad locations');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    console.log('Ad-locations: useEffect triggered', { authLoading, user: !!user, session: !!session });
    
    if (authLoading) return;
    
    if (!user) {
      console.log('Ad-locations: No user, redirecting to login');
      router.push('/admin/login');
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('Ad-locations: User not admin, refreshing role');
      refreshUserRole().then(() => {
        setTimeout(() => {
          if (user.role !== 'admin') {
            router.push('/admin/login');
          }
        }, 1000);
      });
      return;
    }

    // Add a small delay to ensure session is loaded
    setTimeout(() => {
      console.log('Ad-locations: About to fetch locations');
      fetchLocations();
    }, 500);
  }, [user, authLoading, refreshUserRole, fetchLocations, router, session]);

  
  const updateLocationPrice = async (locationId: string, price: string) => {
    setSaving(true);
    try {
      // Get fresh session directly from Supabase
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !freshSession || !freshSession.access_token) {
        toast.error('No valid authentication token');
        return;
      }

      const response = await fetch('/api/admin/ad-locations', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${freshSession?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          base_price: parseFloat(price),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ad-locations: Update API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to update location: ${response.status} - ${response.statusText}`);
      }
      setEditingLocation(null);
      fetchLocations();
    } catch {
      toast.error('Error updating price');
    } finally {
      setSaving(false);
    }
  };

  const toggleLocationStatus = async (locationId: string, isActive: boolean) => {
    setSaving(true);
    try {
      // Get fresh session directly from Supabase
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !freshSession || !freshSession.access_token) {
        toast.error('No valid authentication token');
        return;
      }

      const response = await fetch('/api/admin/ad-locations', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${freshSession?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          is_active: isActive,
        }),
      });

      if (response.ok) {
        toast.success(`Location ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchLocations();
      } else {
        toast.error('Failed to update location status');
      }
    } catch {
      toast.error('Error updating location status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Ad Locations Manager - Admin">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Ad Locations Manager - Admin">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-navy dark:text-white">
            Ad Locations Manager
          </h1>
          <Button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Back to Admin
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-navy dark:text-white mb-6">
              Manage Ad Location Prices
            </h2>

            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-navy dark:text-white">
                          {location.display_name}
                        </h3>
                        {location.is_premium && (
                          <span className="px-2 py-1 bg-golden/20 text-golden text-xs rounded-full">
                            Premium
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {location.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{location.page_location}</span>
                        <span>•</span>
                        <span>{location.position_type}</span>
                        <span>•</span>
                        <span>{location.dimensions}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {editingLocation === location.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price"
                            defaultValue={location.base_price || ''}
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden dark:bg-gray-700 dark:text-white"
                            id={`price-${location.id}`}
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById(`price-${location.id}`) as HTMLInputElement;
                              updateLocationPrice(location.id, input.value);
                            }}
                            disabled={saving}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={() => setEditingLocation(null)}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-sm font-medium text-navy dark:text-white">
                              {location.base_price ? `GHS ${location.base_price}` : 'No price set'}
                            </div>
                            <div className="text-xs text-gray-500">Per period</div>
                          </div>
                          <Button
                            onClick={() => setEditingLocation(location.id)}
                            className="px-3 py-2 bg-golden text-white rounded-lg hover:bg-golden-dark"
                          >
                            Edit Price
                          </Button>
                          <Button
                            onClick={() => toggleLocationStatus(location.id, !location.is_active)}
                            className={`px-3 py-2 rounded-lg ${
                              location.is_active
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {location.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {locations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No ad locations found. Please set up the database first.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdLocationsManager;
