import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/router';
import LayoutSupabase from '@/components/LayoutSupabase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUsers, FiFileText, FiMessageSquare, FiMessageCircle, FiEye, FiSettings, FiActivity, FiMail } from 'react-icons/fi';
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

// Type assertion for Next.js Link component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextLink = Link as any;
// Type assertion for Framer Motion component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  draftArticles: number;
  publishedArticles: number;
  totalComments: number;
  totalViews: number;
  recentActivity: Array<{
    type: 'user' | 'article' | 'comment';
    title: string;
    timestamp: string;
  }>;
  monthlyStats: Array<{
    month: string;
    users: number;
    articles: number;
    views: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchAdminStats = useCallback(async () => {
    try {
      console.log('Fetching admin stats...');
      setStatsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      console.log('Admin stats response:', result);

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch admin stats');
      }

      // The API returns { success: true, data: {...} }
      console.log('Setting stats:', result.data);
      setStats(result.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      toast.error('Failed to load admin statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [supabase, setStats]);

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to check admin access');
      }

      if (result.data?.profile?.role !== 'admin') {
        toast.error('Access denied: Admin role required');
        router.push('/');
      }

      // User is admin, fetch stats
      await fetchAdminStats();
    } catch (error) {
      console.error('Admin access check failed:', error);
      toast.error('Failed to verify admin access');
      router.push('/');
    }
  }, [router, supabase, fetchAdminStats]);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user, checkAdminAccess]);

  if (!user) {
    return (
      <LayoutSupabase>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </LayoutSupabase>
    );
  }

  return (
    <LayoutSupabase>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-navy mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your Voice of UPSA platform</p>
          </MotionDiv>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Users</p>
                      <p className="text-2xl font-bold text-navy">{stats?.totalUsers || 0}</p>
                    </div>
                    <FiUsers className="w-8 h-8 text-golden" />
                  </div>
                </MotionDiv>

                <MotionDiv
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Articles</p>
                      <p className="text-2xl font-bold text-navy">{stats?.totalArticles || 0}</p>
                      <p className="text-xs text-gray-500">
                        {stats?.publishedArticles || 0} published, {stats?.draftArticles || 0} drafts
                      </p>
                    </div>
                    <FiFileText className="w-8 h-8 text-golden" />
                  </div>
                </MotionDiv>

                <MotionDiv
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Comments</p>
                      <p className="text-2xl font-bold text-navy">{stats?.totalComments || 0}</p>
                    </div>
                    <FiMessageSquare className="w-8 h-8 text-golden" />
                  </div>
                </MotionDiv>

                <MotionDiv
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Views</p>
                      <p className="text-2xl font-bold text-navy">{stats?.totalViews || 0}</p>
                    </div>
                    <FiEye className="w-8 h-8 text-golden" />
                  </div>
                </MotionDiv>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-navy mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <NextLink href="/admin/users">
                  <div className="bg-navy text-white p-4 rounded-lg hover:bg-navy-dark transition-colors duration-200 cursor-pointer">
                    <FiUsers className="w-6 h-6 mb-2" />
                    <p className="font-semibold">Manage Users</p>
                  </div>
                </NextLink>
                <NextLink href="/admin/articles">
                  <div className="bg-navy text-white p-4 rounded-lg hover:bg-navy-dark transition-colors duration-200 cursor-pointer">
                    <FiFileText className="w-6 h-6 mb-2" />
                    <p className="font-semibold">Manage Articles</p>
                  </div>
                </NextLink>
                <NextLink href="/admin/comments">
                  <div className="bg-navy text-white p-4 rounded-lg hover:bg-navy-dark transition-colors duration-200 cursor-pointer">
                    <FiMessageSquare className="w-6 h-6 mb-2" />
                    <p className="font-semibold">Manage Comments</p>
                  </div>
                </NextLink>
                <NextLink href="/admin/messages">
                  <div className="bg-navy text-white p-4 rounded-lg hover:bg-navy-dark transition-colors duration-200 cursor-pointer">
                    <FiMail className="w-6 h-6 mb-2" />
                    <p className="font-semibold">User Messages</p>
                  </div>
                </NextLink>
                <NextLink href="/admin/anonymous-messages">
                  <div className="bg-navy text-white p-4 rounded-lg hover:bg-navy-dark transition-colors duration-200 cursor-pointer">
                    <FiMessageCircle className="w-6 h-6 mb-2" />
                    <p className="font-semibold">Anonymous Messages</p>
                  </div>
                </NextLink>
                <NextLink href="/admin/settings">
                  <div className="bg-navy text-white p-4 rounded-lg hover:bg-navy-dark transition-colors duration-200 cursor-pointer col-span-2">
                    <FiSettings className="w-6 h-6 mb-2" />
                    <p className="font-semibold">Settings</p>
                  </div>
                </NextLink>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-navy mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FiActivity className="w-5 h-5 text-golden" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-navy">{activity.title}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </MotionDiv>

          {/* Monthly Stats Chart */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-md p-4 md:p-6"
          >
            <h2 className="text-lg md:text-xl font-semibold text-navy mb-3 md:mb-4">Monthly Statistics</h2>
            {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
              <div className="space-y-4 md:space-y-6">
                {/* Combined Chart */}
                <div>
                  <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">Overview (Articles, Views, Users)</h4>
                  <div className="bg-gray-50 rounded-lg p-2 md:p-4 h-[250px] md:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats.monthlyStats} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={30} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={35} />
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar yAxisId="left" dataKey="articles" fill="#3b82f6" name="Articles" />
                        <Bar yAxisId="left" dataKey="users" fill="#10b981" name="New Users" />
                        <Line yAxisId="right" type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} name="Views" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 rounded-lg p-2 md:p-4 text-center">
                    <div className="text-lg md:text-2xl font-bold text-blue-600">
                      {stats.monthlyStats.reduce((sum, m) => sum + m.articles, 0)}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1">Total Articles</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 md:p-4 text-center">
                    <div className="text-lg md:text-2xl font-bold text-purple-600">
                      {stats.monthlyStats.reduce((sum, m) => sum + m.views, 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1">Total Views</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 md:p-4 text-center">
                    <div className="text-lg md:text-2xl font-bold text-green-600">
                      {stats.monthlyStats.reduce((sum, m) => sum + m.users, 0)}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1">New Users</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 md:p-4 text-center">
                    <div className="text-lg md:text-2xl font-bold text-orange-600">
                      {stats.monthlyStats.length > 0
                        ? Math.round(stats.monthlyStats.reduce((sum, m) => sum + m.views, 0) / stats.monthlyStats.length).toLocaleString()
                        : 0}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 md:mt-1">Avg Monthly Views</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm md:text-base">No monthly statistics available</p>
            )}
          </MotionDiv>
        </div>
      </div>
    </LayoutSupabase>
  );
};

export default AdminDashboard;
