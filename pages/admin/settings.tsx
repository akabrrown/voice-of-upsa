import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import toast from 'react-hot-toast';
import { FiSettings, FiGlobe, FiMail, FiBell, FiImage, FiSave, FiUpload } from 'react-icons/fi';

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_url: string;
  site_logo: string;
  contact_email: string;
  notification_email: string;
  social_links: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
  };
  maintenance_mode: boolean;
  allow_comments: boolean;
  moderate_comments: boolean;
  max_upload_size: number;
  allowed_image_types: string[];
}

const AdminSettingsPage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'Voice of UPSA',
    site_description: 'Empowering the University of Professional Studies community through quality journalism',
    site_url: 'https://voiceofupsa.com',
    site_logo: '/logo.jpg',
    contact_email: 'voice@upsa.edu.gh',
    notification_email: 'notifications@upsa.edu.gh',
    social_links: {
      facebook: 'https://facebook.com/voiceofupsa',
      twitter: 'https://twitter.com/voiceofupsa',
      instagram: 'https://instagram.com/voiceofupsa',
      youtube: 'https://youtube.com/@voiceofupsa',
      tiktok: 'https://tiktok.com/@voice_of_upsa',
      linkedin: 'https://linkedin.com/company/voiceofupsa',
    },
    maintenance_mode: false,
    allow_comments: true,
    moderate_comments: true,
    max_upload_size: 5242880, // 5MB
    allowed_image_types: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error details:', errorData);
        throw new Error(errorData.error || errorData.details?.message || 'Failed to fetch settings');
      }

      const data = await response.json();
      if (data.data?.settings) {
        setSettings(data.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  // Realtime subscription for settings changes
  useEffect(() => {
    if (!supabase || !user) return;

    console.log('Setting up realtime subscription for site_settings');

    const settingsChannel = supabase
      .channel('site-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          console.log('Settings updated in realtime:', payload);
          
          // Update local state with new settings
          if (payload.new) {
            const newSettings = payload.new as unknown as SiteSettings;
            setSettings(newSettings);
            
            // Show toast notification
            toast.success('Settings updated by another admin', {
              duration: 3000,
              icon: '🔄'
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Settings realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up settings realtime subscription');
      supabase.removeChannel(settingsChannel);
    };
  }, [supabase, user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error details:', errorData);
        throw new Error(errorData.error || errorData.details?.message || 'Failed to save settings');
      }

      toast.success('Settings saved successfully', {
        icon: '✅'
      });
      
      // Note: Realtime will update other admins' views automatically
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const data = await response.json();
      
      // Update the settings with the new logo URL
      setSettings(prev => ({ ...prev, site_logo: data.data.logo_url }));
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-navy text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <FiSettings className="mr-3" />
                Website Settings
              </h1>
              <p className="text-gray-300">Configure your website settings and preferences</p>
            </motion.div>
          </div>
        </section>

        {/* Settings Form */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* General Settings */}
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-navy mb-6 flex items-center">
                  <FiGlobe className="mr-2" />
                  General Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.site_name}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings.site_description}
                      onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site URL
                    </label>
                    <input
                      type="url"
                      value={settings.site_url}
                      onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Logo Settings */}
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-navy mb-6 flex items-center">
                  <FiImage className="mr-2" />
                  Logo Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <Image
                        src={settings.site_logo}
                        alt="Site Logo"
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-lg object-cover border border-gray-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/logo.jpg'; // Fallback to default logo
                        }}
                      />
                      <div>
                        <p className="text-sm text-gray-600">Current logo preview</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: Square image, at least 200x200px</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload New Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-golden hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                      >
                        {uploadingLogo ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FiUpload className="mr-2" />
                            Choose Logo
                          </>
                        )}
                      </label>
                      <span className="text-sm text-gray-600">
                        JPG, PNG, GIF, WebP (Max 2MB)
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Email Settings */}
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-navy mb-6 flex items-center">
                  <FiMail className="mr-2" />
                  Email Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      value={settings.notification_email}
                      onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Social Media Settings */}
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-navy mb-6 flex items-center">
                  <FiGlobe className="mr-2" />
                  Social Media Links
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={settings.social_links.facebook}
                      onChange={(e) => setSettings({
                        ...settings,
                        social_links: { ...settings.social_links, facebook: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={settings.social_links.twitter}
                      onChange={(e) => setSettings({
                        ...settings,
                        social_links: { ...settings.social_links, twitter: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={settings.social_links.instagram}
                      onChange={(e) => setSettings({
                        ...settings,
                        social_links: { ...settings.social_links, instagram: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube
                    </label>
                    <input
                      type="url"
                      value={settings.social_links.youtube}
                      onChange={(e) => setSettings({
                        ...settings,
                        social_links: { ...settings.social_links, youtube: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TikTok
                    </label>
                    <input
                      type="url"
                      value={settings.social_links.tiktok}
                      onChange={(e) => setSettings({
                        ...settings,
                        social_links: { ...settings.social_links, tiktok: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={settings.social_links.linkedin}
                      onChange={(e) => setSettings({
                        ...settings,
                        social_links: { ...settings.social_links, linkedin: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Feature Settings */}
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-navy mb-6 flex items-center">
                  <FiBell className="mr-2" />
                  Feature Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                      <p className="text-sm text-gray-600">Temporarily disable the website for maintenance</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.maintenance_mode ? 'bg-golden' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Allow Comments</h3>
                      <p className="text-sm text-gray-600">Enable or disable comments on articles</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, allow_comments: !settings.allow_comments })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.allow_comments ? 'bg-golden' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.allow_comments ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Moderate Comments</h3>
                      <p className="text-sm text-gray-600">Require approval for new comments</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, moderate_comments: !settings.moderate_comments })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.moderate_comments ? 'bg-golden' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.moderate_comments ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Upload Settings */}
              <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-navy mb-6 flex items-center">
                  <FiImage className="mr-2" />
                  Upload Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Upload Size (bytes)
                    </label>
                    <input
                      type="number"
                      value={settings.max_upload_size}
                      onChange={(e) => setSettings({ ...settings, max_upload_size: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Current: {(settings.max_upload_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Image Types
                    </label>
                    <div className="space-y-2">
                      {['jpg', 'jpeg', 'png', 'gif', 'webp'].map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.allowed_image_types.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettings({
                                  ...settings,
                                  allowed_image_types: [...settings.allowed_image_types, type]
                                });
                              } else {
                                setSettings({
                                  ...settings,
                                  allowed_image_types: settings.allowed_image_types.filter(t => t !== type)
                                });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-gray-700">.{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div variants={itemVariants} className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-golden text-navy font-semibold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <FiSave className="mr-2" />
                      Save Settings
                    </div>
                  )}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AdminSettingsPage;
