import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';

interface SiteSettings {
  site_name: string;
  site_logo: string;
}

export const useSiteSettings = () => {
  const { supabase } = useSupabase();
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'Voice of UPSA',
    site_logo: '/logo.jpg'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Use public API endpoint instead of direct database access
        const response = await fetch('/api/public/settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.settings) {
            setSettings({
              site_name: result.data.settings.site_name,
              site_logo: result.data.settings.site_logo || '/logo.jpg'
            });
          }
        } else {
          console.error('Error fetching site settings:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [supabase]);

  return { settings, loading };
};
