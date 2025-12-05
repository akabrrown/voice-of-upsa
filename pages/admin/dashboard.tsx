import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiHome, FiFileText, FiUsers, FiEye, FiMessageCircle, FiPlus, FiSearch, FiFilter, FiHeart, FiEdit, FiTrash2, FiRefreshCw, FiCheck, FiX, FiExternalLink, FiMail } from 'react-icons/fi';
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

// Type assertion for Next.js Link component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextLink = Link as any;
// Type assertion for Framer Motion component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

interface DashboardStats {
  totalArticles: number;
  totalUsers: number;
  totalViews: number;
  totalComments: number;
  recentArticles: number;
  publishedArticles: number;
  draftArticles: number;
  monthlyStats: Array<{
    month: string;
    users: number;
    articles: number;
    views: number;
  }>;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'pending_review' | 'published';
  views_count: number;
  likes_count: number;
  comments_count: number;
  published_at?: string;
  created_at: string;
  author: {
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'editor';
  created_at: string;
  last_sign_in?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'users'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending_review' | 'published'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Helper function to check if current path matches
  const isPathActive = (path: string) => {
    return router.pathname === path;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      if (activeTab === 'overview') {
        // Fetch dashboard stats - using reliable endpoint
        console.log('Fetching dashboard stats from /api/admin/dashboard-stats-reliable');
        const response = await fetch(`/api/admin/dashboard-stats-reliable?t=${new Date().getTime()}`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });

        console.log('Dashboard stats response status:', response.status);

        if (response.ok) {
          const statsData = await response.json();
          console.log('Dashboard reliable response:', statsData);

          if (statsData.success) {
            console.log('Setting stats:', statsData.stats);
            setStats(statsData.stats);
          } else {
            console.error('Stats data success=false:', statsData);
            toast.error(statsData.error || 'Failed to load dashboard stats');
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Dashboard reliable error response:', errorData);
          toast.error(errorData.error || `Failed to load dashboard stats (${response.status})`);
        }
      } else if (activeTab === 'articles') {
        // Fetch articles
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter !== 'all') params.append('status', statusFilter);

        const articlesResponse = await fetch(`/api/admin/articles?${params.toString()}&t=${new Date().getTime()}`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });

        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          // Handle nested response format: { success: true, data: { articles: [...] } }
          setArticles(articlesData.data?.articles || articlesData.articles || []);
        }
      } else if (activeTab === 'users') {
        // Fetch users
        const usersResponse = await fetch(`/api/admin/users?t=${new Date().getTime()}`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Handle nested response format: { success: true, data: { users: [...] } }
          setUsers(usersData.data?.users || usersData.users || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [supabase, activeTab, searchTerm, statusFilter]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Auto-refresh dashboard stats every 30 seconds
  useEffect(() => {
    if (!user || activeTab !== 'overview') return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing dashboard stats...');
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, activeTab, fetchDashboardData]);

  const refreshDashboard = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh when tab changes
  const handleTabChange = (tab: 'overview' | 'articles' | 'users') => {
    setActiveTab(tab);
    // Small delay to ensure tab state is updated before fetching
    setTimeout(() => {
      fetchDashboardData();
    }, 100);
  };

  const handleApproveArticle = async (articleId: string) => {
    setIsUpdating(articleId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve article');
      }

      toast.success('Article approved and published!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving article:', error);
      toast.error('Failed to approve article');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRejectArticle = async (articleId: string) => {
    setIsUpdating(articleId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'draft' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject article');
      }

      toast.success('Article rejected and returned to draft');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting article:', error);
      toast.error('Failed to reject article');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setArticles(articles.filter(article => article.id !== articleId));
        toast.success('Article deleted successfully');
        // Refresh dashboard stats if on overview tab
        if (activeTab === 'overview') {
          refreshDashboard();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'editor') => {
    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ));
        toast.success('User role updated successfully');
        // Refresh dashboard stats if on overview tab
        if (activeTab === 'overview') {
          refreshDashboard();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-navy mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">Please sign in to access the admin dashboard.</p>
            <NextLink href="/sign-in">
              <button className="bg-golden text-navy px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200">
                Sign In
              </button>
            </NextLink>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-navy text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
                  <p className="text-gray-300">Manage your Voice of UPSA website</p>
                </div>
                <div className="flex items-center space-x-3">
                  {activeTab === 'overview' && lastRefresh && (
                    <div className="text-white text-sm opacity-75">
                      <span className="hidden sm:inline">Auto-refresh: </span>
                      <span>{lastRefresh.toLocaleTimeString()}</span>
                    </div>
                  )}
                  <button
                    onClick={refreshDashboard}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    disabled={loading}
                  >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </MotionDiv>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => handleTabChange('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'overview'
                    ? 'border-golden text-golden'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FiHome className="inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => handleTabChange('articles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'articles'
                    ? 'border-golden text-golden'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FiFileText className="inline mr-2" />
                Articles
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'users'
                    ? 'border-golden text-golden'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FiUsers className="inline mr-2" />
                Users
              </button>
              <NextLink href="/admin/comments" legacyBehavior>
              <a className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center ${
                isPathActive('/admin/comments')
                  ? 'border-golden text-golden'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
                <FiMessageCircle className="inline mr-2" />
                Comments
              </a>
            </NextLink>
            <NextLink href="/admin/messages" legacyBehavior>
              <a className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center ${
                isPathActive('/admin/messages')
                  ? 'border-golden text-golden'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
                <FiMail className="inline mr-2" />
                Messages
              </a>
            </NextLink>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {loading ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              ) : stats ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Total Articles</p>
                          <p className="text-3xl font-bold text-navy mt-2">{stats.totalArticles}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                          <FiFileText className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </MotionDiv>

                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Total Users</p>
                          <p className="text-3xl font-bold text-navy mt-2">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                          <FiUsers className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </MotionDiv>

                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Total Views</p>
                          <p className="text-3xl font-bold text-navy mt-2">{stats.totalViews.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                          <FiEye className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </MotionDiv>

                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-sm font-medium">Total Comments</p>
                          <p className="text-3xl font-bold text-navy mt-2">{stats.totalComments}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                          <FiMessageCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <NextLink href="/admin/comments" className="inline-flex items-center text-sm text-golden hover:text-yellow-600 transition-colors">
                          <span>Manage Comments</span>
                          <FiExternalLink className="ml-1" />
                        </NextLink>
                      </div>
                    </MotionDiv>
                  </div>

                  {/* Additional Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <h3 className="text-lg font-semibold text-navy mb-4">Article Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Published</span>
                          <span className="font-semibold text-green-600">{stats.publishedArticles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Drafts</span>
                          <span className="font-semibold text-yellow-600">{stats.draftArticles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Recent (7 days)</span>
                          <span className="font-semibold text-blue-600">{stats.recentArticles}</span>
                        </div>
                      </div>
                    </MotionDiv>

                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <h3 className="text-lg font-semibold text-navy mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <NextLink href="/admin/articles/new">
                          <button className="w-full bg-golden text-navy px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200">
                            <FiPlus className="inline mr-2" />
                            New Article
                          </button>
                        </NextLink>
                        <NextLink href="/admin/users">
                          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200">
                            <FiUsers className="inline mr-2" />
                            Manage Users
                          </button>
                        </NextLink>
                        <NextLink href="/admin/messages">
                          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200">
                            <FiMail className="inline mr-2" />
                            Contact Messages
                          </button>
                        </NextLink>
                      </div>
                    </MotionDiv>

                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <h3 className="text-lg font-semibold text-navy mb-4">Engagement</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg. Views/Article</span>
                          <span className="font-semibold">
                            {stats.totalArticles > 0 ? Math.round(stats.totalViews / stats.totalArticles) : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg. Comments/Article</span>
                          <span className="font-semibold">
                            {stats.totalArticles > 0 ? (stats.totalComments / stats.totalArticles).toFixed(1) : 0}
                          </span>
                        </div>
                      </div>
                    </MotionDiv>

                    {/* Monthly Stats Chart */}
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2"
                    >
                      <h3 className="text-lg font-semibold text-navy mb-4">Monthly Statistics (Last 6 Months) - CHART UPDATED</h3>
                      {stats.monthlyStats && stats.monthlyStats.length > 0 ? (
                        <div className="space-y-6">
                          {/* NEW Combined Monthly Statistics Chart */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Overview (Articles, Views, Users)</h4>
                            <div className="bg-gray-50 rounded-lg p-4" style={{ height: '400px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={stats.monthlyStats}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="month" />
                                  <YAxis yAxisId="left" />
                                  <YAxis yAxisId="right" orientation="right" />
                                  <Tooltip />
                                  <Legend />
                                  <Bar yAxisId="left" dataKey="articles" fill="#3b82f6" name="Articles" />
                                  <Bar yAxisId="left" dataKey="users" fill="#10b981" name="New Users" />
                                  <Line yAxisId="right" type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} name="Views" />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Summary Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {stats.monthlyStats.reduce((sum, m) => sum + m.articles, 0)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Total Articles</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {stats.monthlyStats.reduce((sum, m) => sum + m.views, 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Total Views</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {stats.monthlyStats.reduce((sum, m) => sum + m.users, 0)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">New Users</div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {stats.monthlyStats.length > 0
                                  ? Math.round(stats.monthlyStats.reduce((sum, m) => sum + m.views, 0) / stats.monthlyStats.length).toLocaleString()
                                  : 0}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">Avg Monthly Views</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No monthly data available</p>
                        </div>
                      )}
                    </MotionDiv>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading dashboard stats...</p>
                </div>
              )}
            </MotionDiv>
          )}

          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-navy">Articles</h2>
                <NextLink href="/admin/articles/new">
                  <button className="bg-golden text-navy px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200">
                    <FiPlus className="inline mr-2" />
                    New Article
                  </button>
                </NextLink>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search articles..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiFilter className="text-gray-500 w-5 h-5" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'pending_review' | 'published')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Articles Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Article
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stats
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Published
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i}>
                            <td colSpan={6} className="px-6 py-4">
                              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : articles.length > 0 ? (
                        articles.map((article) => (
                          <tr key={article.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{article.title}</div>
                                <div className="text-sm text-gray-500">/{article.slug}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{article.author.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${article.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : article.status === 'pending_review'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {article.status === 'pending_review' ? 'Pending Review' : article.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <FiEye className="w-4 h-4 mr-1" />
                                  {article.views_count}
                                </div>
                                <div className="flex items-center">
                                  <FiHeart className="w-4 h-4 mr-1" />
                                  {article.likes_count}
                                </div>
                                <div className="flex items-center">
                                  <FiMessageCircle className="w-4 h-4 mr-1" />
                                  {article.comments_count}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {article.published_at ? formatDate(article.published_at) : 'Not published'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {article.status === 'pending_review' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveArticle(article.id)}
                                      disabled={isUpdating === article.id}
                                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                      title="Approve and publish"
                                    >
                                      <FiCheck className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectArticle(article.id)}
                                      disabled={isUpdating === article.id}
                                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                      title="Reject and return to draft"
                                    >
                                      <FiX className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <NextLink href={`/admin/articles/${article.id}/edit`}>
                                  <button className="text-blue-600 hover:text-blue-900">
                                    <FiEdit className="w-4 h-4" />
                                  </button>
                                </NextLink>
                                <button
                                  onClick={() => handleDeleteArticle(article.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No articles found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </MotionDiv>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-navy mb-6">Users</h2>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Sign In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i}>
                            <td colSpan={5} className="px-6 py-4">
                              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'user' | 'admin' | 'editor')}
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-golden focus:border-transparent"
                              >
                                <option value="user">User</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.last_sign_in ? formatDate(user.last_sign_in) : 'Never'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-900 text-sm">
                                  View Profile
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </MotionDiv>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
