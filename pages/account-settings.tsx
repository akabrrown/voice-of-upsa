import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSupabase } from '@/components/SupabaseProvider';
import LayoutSupabase from '@/components/LayoutSupabase';
import ImageUpload from '@/components/ImageUpload';
import toast from 'react-hot-toast';
import { 
  FiUser, 
  FiSave, 
  FiEdit2,
  FiLock,
  FiGlobe,
  FiMapPin,
  FiTwitter,
  FiLinkedin,
  FiGithub,
  FiInstagram,
  FiFacebook,
    FiBell,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiDownload,
  FiSmartphone
} from 'react-icons/fi';

interface AccountSettings {
  id: string;
  email: string | null;
  name: string;
  role: 'user' | 'admin' | 'editor';
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  social_links: Record<string, string>;
  preferences: Record<string, unknown>;
  is_active: boolean;
  last_login_at: string | null;
  email_verified: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
  article_count: number;
  comment_count: number;
  total_views: number;
  total_likes: number;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  article_comments: boolean;
  new_followers: boolean;
  weekly_digest: boolean;
  security_alerts: boolean;
}


const AccountSettings: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'security' | 'notifications' | 'data'>('overview');
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    avatar_url: null as string | null,
    website: '',
    location: '',
    social_links: {
      twitter: '',
      linkedin: '',
      github: '',
      instagram: '',
      facebook: ''
    } as Record<string, string>
  });

  const [notificationForm, setNotificationForm] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    article_comments: true,
    new_followers: true,
    weekly_digest: false,
    security_alerts: true
  });

  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  });

  // Delete account modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      let session;
      try {
        const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.log('Session error:', sessionError);
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!sessionData) {
          console.log('No session found');
          throw new Error('No valid session found');
        }
        
        session = sessionData;
      } catch (sessionErr) {
        console.log('Failed to get session, using fallback:', sessionErr);
        throw new Error('Authentication failed - please check your connection');
      }
      
      let response;
      try {
        response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token || ''}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (fetchErr) {
        console.log('Network fetch failed, using fallback:', fetchErr);
        throw new Error('Network connection failed');
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.log('Failed to parse response:', jsonErr);
        throw new Error('Invalid server response');
      }
      
      console.log('Account settings API response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired - please sign in again');
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again later');
        } else {
          const errorMessage = typeof data.error === 'string' 
            ? data.error 
            : data.error?.message || 'Failed to fetch settings';
          throw new Error(errorMessage);
        }
      }

      // Validate response structure
      if (!data.success || !data.data || !data.data.profile) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from API');
      }

      console.log('Setting profile data:', data.data.profile);
      
      setSettings({
        ...data.data.profile,
        article_count: data.data.profile.article_count || 0,
        comment_count: data.data.profile.comment_count || 0,
        total_views: data.data.profile.total_views || 0,
        total_likes: data.data.profile.total_likes || 0,
      });
      
      setProfileForm({
        name: data.data.profile.name || '',
        bio: data.data.profile.bio || '',
        avatar_url: data.data.profile.avatar_url,
        website: data.data.profile.website || '',
        location: data.data.profile.location || '',
        social_links: {
          twitter: (data.data.profile.social_links?.twitter as string) || '',
          linkedin: (data.data.profile.social_links?.linkedin as string) || '',
          github: (data.data.profile.social_links?.github as string) || '',
          instagram: (data.data.profile.social_links?.instagram as string) || '',
          facebook: (data.data.profile.social_links?.facebook as string) || '',
        },
      });

      // Load notification preferences from dedicated API
      try {
        const prefsResponse = await fetch('/api/user/notification-preferences-simple', {
          headers: {
            'Authorization': `Bearer ${session.access_token || ''}`,
            'Content-Type': 'application/json',
          },
        });

        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();
          if (prefsData.success && prefsData.data?.preferences) {
            setNotificationForm({
              email_notifications: prefsData.data.preferences.email_notifications ?? true,
              push_notifications: prefsData.data.preferences.push_notifications ?? true,
              article_comments: prefsData.data.preferences.article_comments ?? true,
              new_followers: prefsData.data.preferences.new_followers ?? true,
              weekly_digest: prefsData.data.preferences.weekly_digest ?? false,
              security_alerts: prefsData.data.preferences.security_alerts ?? true
            });
          }
        }
      } catch (prefsError) {
        console.log('Could not load notification preferences:', prefsError);
        // Use defaults if preferences can't be loaded
      }

          } catch (error) {
      console.error('Error fetching settings:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Create fallback settings from user metadata
      if (user) {
        console.log('Creating fallback settings from user metadata');
        const fallbackSettings = {
          id: user.id,
          email: user.email || null,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'user' as const,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          website: null,
          location: null,
          social_links: {},
          preferences: {},
          is_active: true,
          last_login_at: user.last_sign_in_at || new Date().toISOString(),
          email_verified: user.email_confirmed_at ? true : false,
          last_sign_in_at: user.last_sign_in_at || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          article_count: 0,
          comment_count: 0,
          total_views: 0,
          total_likes: 0,
        };
        
        setSettings(fallbackSettings);
        setProfileForm({
          name: fallbackSettings.name,
          bio: '',
          avatar_url: fallbackSettings.avatar_url,
          website: '',
          location: '',
          social_links: { twitter: '', linkedin: '', github: '', instagram: '', facebook: '' }
        });
        
        // Show appropriate message based on error type
        if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('connection')) {
            toast.error('Network issues detected - working in offline mode');
          } else if (error.message.includes('Authentication')) {
            toast.error('Authentication issues - please sign in again');
          } else {
            toast.error('Using limited mode due to connection issues');
          }
        } else {
          toast.success('Loaded basic profile information (limited mode)');
        }
      } else {
        toast.error('Please sign in to access account settings');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  const handleProfileUpdate = async () => {
    try {
      console.log('=== ACCOUNT SETTINGS UPDATE DEBUG ===');
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session found:', !!session);
      
      const updateData = {
        name: profileForm.name.trim(),
        bio: profileForm.bio.trim() || null,
        avatar_url: profileForm.avatar_url,
        website: profileForm.website.trim() || null,
        location: profileForm.location.trim() || null,
        social_links: profileForm.social_links,
        updated_at: new Date().toISOString()
      };

      console.log('Update data being sent:', updateData);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Update response status:', response.status);
      const data = await response.json();
      console.log('Update response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      console.log('Setting updated profile data:', data.profile);
      setSettings(data.profile);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update notification preferences');
      }

      toast.success('Notification preferences updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });

      if (error) {
        throw error;
      }

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false
      });

      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmation || deleteConfirmation.toLowerCase() !== 'delete my account') {
      toast.error('Please type "delete my account" to confirm');
      return;
    }

    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }

    try {
      console.log('=== ACCOUNT DELETION DEBUG ===');
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session found:', !!session);
      
      if (!session) {
        throw new Error('No active session found');
      }

      console.log('Making delete request...');
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: deletePassword
        })
      });

      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setDeletePassword('');
      
      // Sign out and redirect to home
      console.log('Signing out...');
      await supabase.auth.signOut();
      console.log('Redirecting to home...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/user/export-data', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      setIsSendingVerification(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.code === 'ALREADY_VERIFIED') {
          toast.success('Your email is already verified!');
          // Refresh settings to update the UI
          await fetchSettings();
        } else {
          throw new Error(result.error?.message || 'Failed to send verification email');
        }
        return;
      }

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send verification email');
    } finally {
      setIsSendingVerification(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <LayoutSupabase>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-navy mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">Please sign in to access account settings.</p>
            <Link href="/auth/sign-in" className="bg-golden text-navy px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200">
              Sign In
            </Link>
          </div>
        </div>
      </LayoutSupabase>
    );
  }

  if (loading) {
    return (
      <LayoutSupabase>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </LayoutSupabase>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'profile', label: 'Edit Profile', icon: FiEdit2 },
    { id: 'security', label: 'Security', icon: FiLock },
    // Only show notifications tab for editors and admins
    ...(settings?.role === 'admin' || settings?.role === 'editor' 
      ? [{ id: 'notifications', label: 'Notifications', icon: FiBell }] 
      : []
    ),
    { id: 'data', label: 'Data Management', icon: FiDownload }
  ];

  return (
    <LayoutSupabase>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Header */}
        <div className="bg-navy text-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Account Settings</h1>
              <p className="text-gray-300">Manage your account preferences and security</p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                <div className="text-center mb-6">
                  {settings?.avatar_url ? (
                    <Image
                      src={settings.avatar_url}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full mx-auto mb-4"
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <FiUser className="w-10 h-10 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-navy dark:text-white">{settings?.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{settings?.email}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'overview' | 'profile' | 'security' | 'notifications' | 'data')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-golden text-navy font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/"
                    className="text-golden hover:text-yellow-400 transition-colors duration-200"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold text-navy dark:text-white mb-6">Profile Overview</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Profile Card */}
                      <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                          {/* Avatar */}
                          <div className="text-center mb-6">
                            {settings?.avatar_url ? (
                              <Image
                                src={settings.avatar_url || ''}
                                alt="Profile"
                                width={128}
                                height={128}
                                className="w-32 h-32 rounded-full mx-auto mb-4"
                                unoptimized
                              />
                            ) : (
                              <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <FiUser className="w-16 h-16 text-gray-600 dark:text-gray-400" />
                              </div>
                            )}
                            
                            <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">{settings?.name}</h2>
                            
                            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-4">
                              <span className="text-sm">{settings?.email}</span>
                            </div>
                            
                            <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                settings?.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                settings?.role === 'editor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {settings?.role}
                              </span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            {(settings?.role === 'admin' || settings?.role === 'editor') ? (
                              <>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-navy dark:text-white">{settings?.article_count || 0}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Articles</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-navy dark:text-white">{settings?.comment_count || 0}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-navy dark:text-white">{settings?.total_views || 0}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-navy dark:text-white">{settings?.total_likes || 0}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-navy dark:text-white">{settings?.comment_count || 0}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="text-2xl font-bold text-navy dark:text-white">{settings?.total_likes || 0}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex justify-center">
                            <button
                              onClick={() => setActiveTab('profile')}
                              className="px-4 py-2 bg-golden text-navy rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200"
                            >
                              <FiEdit2 className="inline mr-2" />
                              Edit Profile
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Details Card */}
                      <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                          <h3 className="text-xl font-bold text-navy dark:text-white mb-6">Profile Details</h3>
                          
                          {/* Bio */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                              {settings?.bio || 'No bio added yet. Click Edit Profile to add one.'}
                            </p>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Information</h4>
                              <div className="space-y-3">
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <FiUser className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                                  <span className="font-medium">Name:</span>
                                  <span className="ml-2">{settings?.name}</span>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <span className="w-4 h-4 mr-3 inline-block"></span>
                                  <span className="font-medium">Email:</span>
                                  <span className="ml-2">{settings?.email}</span>
                                </div>
                                {settings?.website && (
                                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <FiGlobe className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                                    <span className="font-medium">Website:</span>
                                    <a href={settings.website || ''} target="_blank" rel="noopener noreferrer" className="ml-2 text-golden hover:text-yellow-400">
                                      {settings.website}
                                    </a>
                                  </div>
                                )}
                                {settings?.location && (
                                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <FiMapPin className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" />
                                    <span className="font-medium">Location:</span>
                                    <span className="ml-2">{settings?.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Social Links */}
                            {settings?.social_links && Object.keys(settings.social_links || {}).length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Social Links</h4>
                                <div className="flex flex-wrap gap-3">
                                  {Object.entries(settings.social_links || {}).map(([platform, url]) => {
                                    if (!url) return null;
                                    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
                                      twitter: FiTwitter,
                                      linkedin: FiLinkedin,
                                      github: FiGithub,
                                      instagram: FiInstagram,
                                      facebook: FiFacebook
                                    };
                                    const Icon = icons[platform];
                                    if (!Icon) return null;
                                    
                                    return (
                                      <a
                                        key={platform}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                                      >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {platform}
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Account Info */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Information</h4>
                              <div className="space-y-3">
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <span className="w-4 h-4 mr-3 inline-block"></span>
                                  <span className="font-medium">Member Since:</span>
                                  <span className="ml-2">{settings?.created_at ? formatDate(settings.created_at) : 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <span className="w-4 h-4 mr-3 inline-block"></span>
                                  <span className="font-medium">Account Status:</span>
                                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                    settings?.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {settings?.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center">
                                    <span className="w-4 h-4 mr-3 inline-block"></span>
                                    <span className="font-medium">Email Verified:</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                      settings?.email_verified ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                      {settings?.email_verified ? 'Verified' : 'Not Verified'}
                                    </span>
                                  </div>
                                  {!settings?.email_verified && (
                                    <button
                                      onClick={handleSendVerificationEmail}
                                      disabled={isSendingVerification}
                                      className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {isSendingVerification ? 'Sending...' : 'Verify Email'}
                                    </button>
                                  )}
                                </div>
                                {settings?.last_login_at && (
                                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <span className="w-4 h-4 mr-3 inline-block"></span>
                                    <span className="font-medium">Last Login:</span>
                                    <span className="ml-2">{formatDate(settings.last_login_at || '')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-navy dark:text-white mb-6">Profile Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Avatar */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
                        <ImageUpload
                          value={profileForm.avatar_url || undefined}
                          onChange={(url) => setProfileForm(prev => ({ ...prev, avatar_url: url }))}
                          onRemove={() => setProfileForm(prev => ({ ...prev, avatar_url: null }))}
                        />
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                          <input
                            type="email"
                            value={settings?.email || ''}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            placeholder="Email (read-only)"
                          />
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      {/* Location & Website */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                          <input
                            type="text"
                            value={profileForm.location}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="City, Country"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                          <input
                            type="url"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>

                      {/* Social Links */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <FiTwitter className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              value={profileForm.social_links.twitter}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                social_links: { ...prev.social_links, twitter: e.target.value }
                              }))}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                              placeholder="@username"
                            />
                          </div>
                          <div className="relative">
                            <FiLinkedin className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              value={profileForm.social_links.linkedin}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                social_links: { ...prev.social_links, linkedin: e.target.value }
                              }))}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                              placeholder="LinkedIn URL"
                            />
                          </div>
                          <div className="relative">
                            <FiGithub className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              value={profileForm.social_links.github}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                social_links: { ...prev.social_links, github: e.target.value }
                              }))}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                              placeholder="GitHub username"
                            />
                          </div>
                          <div className="relative">
                            <FiInstagram className="absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              value={profileForm.social_links.instagram}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                social_links: { ...prev.social_links, instagram: e.target.value }
                              }))}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                              placeholder="@username"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={saving}
                          className="px-6 py-3 bg-golden text-navy rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {saving ? 'Saving...' : <><FiSave className="inline mr-2" />Save Profile</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-2xl font-bold text-navy mb-6">Security Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Password Change */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Change Password</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <div className="relative">
                              <input
                                type={passwordForm.showCurrent ? 'text' : 'password'}
                                value={passwordForm.current_password}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                              >
                                {passwordForm.showCurrent ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <div className="relative">
                              <input
                                type={passwordForm.showNew ? 'text' : 'password'}
                                value={passwordForm.new_password}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                              >
                                {passwordForm.showNew ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <div className="relative">
                              <input
                                type={passwordForm.showConfirm ? 'text' : 'password'}
                                value={passwordForm.confirm_password}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                onClick={() => setPasswordForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                              >
                                {passwordForm.showConfirm ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handlePasswordChange}
                            disabled={saving}
                            className="px-6 py-3 bg-golden text-navy rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {saving ? 'Updating...' : <><FiLock className="inline mr-2" />Update Password</>}
                          </button>
                        </div>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Two-Factor Authentication</h3>
                        <p className="text-gray-600 mb-4">Add an extra layer of security to your account with 2FA.</p>
                        <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200">
                          <FiSmartphone className="inline mr-2" />
                          Enable 2FA
                        </button>
                      </div>

                      {/* Account Info */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Account Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              settings?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {settings?.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Member Since</span>
                            <span className="text-gray-900">{settings?.created_at ? formatDate(settings.created_at) : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Login</span>
                            <span className="text-gray-900">{settings?.last_login_at ? formatDate(settings.last_login_at) : 'Never'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Type</span>
                            <span className="capitalize text-gray-900">{settings?.role}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-2xl font-bold text-navy mb-6">Notification Settings</h2>
                    
                    {/* Role check - only editors and admins */}
                    {settings?.role !== 'admin' && settings?.role !== 'editor' ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <p className="text-yellow-800 font-medium">
                          Notification settings are only available for editors and administrators.
                        </p>
                      </div>
                    ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">Email Notifications</h3>
                            <p className="text-sm text-gray-600">Receive email updates about your account activity</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationForm.email_notifications}
                              onChange={(e) => setNotificationForm(prev => ({ ...prev, email_notifications: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">Push Notifications</h3>
                            <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationForm.push_notifications}
                              onChange={(e) => setNotificationForm(prev => ({ ...prev, push_notifications: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">Article Comments</h3>
                            <p className="text-sm text-gray-600">Get notified when someone comments on your articles</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationForm.article_comments}
                              onChange={(e) => setNotificationForm(prev => ({ ...prev, article_comments: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">New Followers</h3>
                            <p className="text-sm text-gray-600">Get notified when someone follows you</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationForm.new_followers}
                              onChange={(e) => setNotificationForm(prev => ({ ...prev, new_followers: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">Weekly Digest</h3>
                            <p className="text-sm text-gray-600">Receive a weekly summary of your activity</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationForm.weekly_digest}
                              onChange={(e) => setNotificationForm(prev => ({ ...prev, weekly_digest: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">Security Alerts</h3>
                            <p className="text-sm text-gray-600">Get notified about security-related events</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationForm.security_alerts}
                              onChange={(e) => setNotificationForm(prev => ({ ...prev, security_alerts: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleNotificationUpdate}
                          disabled={saving}
                          className="px-6 py-3 bg-golden text-navy rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {saving ? 'Saving...' : <><FiSave className="inline mr-2" />Save Notifications</>}
                        </button>
                      </div>
                    </div>
                    )}
                  </div>
                )}

                
                {/* Data Management Tab */}
                {activeTab === 'data' && (
                  <div>
                    <h2 className="text-2xl font-bold text-navy mb-6">Data Management</h2>
                    
                    <div className="space-y-6">
                      {/* Export Data */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-navy mb-4">Export Your Data</h3>
                        <p className="text-gray-600 mb-4">Download a copy of all your data including articles, comments, and profile information.</p>
                        <button
                          onClick={handleExportData}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                        >
                          <FiDownload className="inline mr-2" />
                          Export Data
                        </button>
                      </div>

                      {/* Delete Account */}
                      <div className="border border-red-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
                        <p className="text-gray-600 mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-red-800 mb-2">Warning:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            <li>• All your articles will be deleted</li>
                            <li>• All your comments will be removed</li>
                            <li>• Your profile information will be permanently deleted</li>
                            <li>• This action cannot be undone</li>
                          </ul>
                        </div>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          disabled={saving}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <FiTrash2 className="inline mr-2" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type &quot;delete my account&quot; to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="delete my account"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving || !deleteConfirmation || !deletePassword}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutSupabase>
  );
};

export default AccountSettings;
