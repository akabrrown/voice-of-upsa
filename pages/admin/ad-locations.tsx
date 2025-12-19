import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import toast from 'react-hot-toast';

interface AdLocation {
  id: string;
  display_name: string;
  description: string;
  base_price?: number | null;
  is_active: boolean;
  sort_order: number;
}

const AdLocationsManager: React.FC = () => {
  console.log('Ad-locations: Component rendering started');
  
  const router = useRouter();
  const [locations, setLocations] = useState<AdLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);

  console.log('Ad-locations: Component state initialized', { loading, locationsCount: locations.length });

  useEffect(() => {
    console.log('Ad-locations: useEffect triggered - fetching data');
    
    // Direct API call with simplified error handling
    fetch('/api/admin/ad-locations')
      .then(response => {
        console.log('Ad-locations: API Response received', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch locations: ${response.status} - ${response.statusText}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log('Ad-locations: Fetched data:', data);
        console.log('Ad-locations: Locations array:', data.data?.locations);
        setLocations(data.data?.locations || []);
        console.log('Ad-locations: Locations state set, count:', data.data?.locations?.length || 0);
        setLoading(false);
        console.log('Ad-locations: Loading set to false');
      })
      .catch(error => {
        console.error('Ad-locations: Error in fetchLocations:', error);
        toast.error('Failed to load ad locations');
        setLoading(false);
        console.log('Ad-locations: Loading set to false due to error');
      });
  }, []);

  const updateLocationPrice = async (locationId: string, price: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ad-locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          base_price: parseFloat(price),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update location: ${response.status} - ${response.statusText}`);
      }
      
      setEditingLocation(null);
      // Refetch data
      fetch('/api/admin/ad-locations')
        .then(response => response.json())
        .then(data => {
          setLocations(data.data?.locations || []);
          setLoading(false);
        });
      toast.success('Price updated successfully');
    } catch (error) {
      console.error('Ad-locations: Error updating price:', error);
      toast.error('Error updating price');
    } finally {
      setSaving(false);
    }
  };

  const toggleLocationStatus = async (locationId: string, isActive: boolean) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ad-locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          is_active: isActive,
        }),
      });

      if (response.ok) {
        toast.success(`Location ${isActive ? 'activated' : 'deactivated'} successfully`);
        // Refetch data
        fetch('/api/admin/ad-locations')
          .then(response => response.json())
          .then(data => {
            setLocations(data.data?.locations || []);
            setLoading(false);
          });
      } else {
        toast.error('Failed to update location status');
      }
    } catch (error) {
      console.error('Ad-locations: Error updating location status:', error);
      toast.error('Error updating location status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <p className="text-gray-600 mb-8">Manage advertising locations and pricing</p>

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
      </div>
    </Layout>
  );
};

export default AdLocationsManager;
