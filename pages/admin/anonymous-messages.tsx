import React, { useState, useEffect, useCallback } from 'react';
import LayoutSupabase from '@/components/LayoutSupabase';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiMessageCircle, FiEye, FiClock, FiFlag } from 'react-icons/fi';

interface PendingMessage {
  id: string;
  content: string;
  type: 'question' | 'response';
  status: 'pending';
  question_id?: string;
  admin_question: boolean;
  created_at: string;
}

interface ReportedStory {
  id: string;
  title: string;
  content: string;
  category: string;
  author_type: string;
  status: string;
  reports_count: number;
  likes_count: number;
  created_at: string;
  story_reports: Array<{
    reason: string;
    created_at: string;
  }>;
}

const AdminAnonymousMessages: React.FC = () => {
  const { session } = useSupabase();
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [reportedStories, setReportedStories] = useState<ReportedStory[]>([]);
  const [allStories, setAllStories] = useState<ReportedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'pending' | 'reported' | 'all'>('pending');
  const [stats, setStats] = useState({
    totalStories: 0,
    approvedStories: 0,
    pendingStories: 0,
    reportedStories: 0,
    totalLikes: 0,
    totalReports: 0
  });

  // Update current time every minute to refresh timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const fetchPendingMessages = useCallback(async () => {
    try {
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/anonymous-stories/admin/moderate', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPendingMessages(data.data || []);
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to fetch pending messages');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching pending messages:', error);
      toast.error('Failed to load pending messages');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPendingMessages();
    }
  }, [session, fetchPendingMessages]);

  const fetchReportedStories = useCallback(async () => {
    try {
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/anonymous-stories/admin/get-reported', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setReportedStories(data.data || []);
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to fetch reported stories');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching reported stories:', error);
      toast.error('Failed to fetch reported stories');
    }
  }, [session]);

  const fetchAllStories = useCallback(async () => {
    try {
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/anonymous-stories/admin/get-all', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAllStories(data.data || []);
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to fetch all stories');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching all stories:', error);
      toast.error('Failed to fetch all stories');
    }
  }, [session]);

  const fetchStats = useCallback(async () => {
    try {
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/anonymous-stories/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.data || {
          totalStories: 0,
          approvedStories: 0,
          pendingStories: 0,
          reportedStories: 0,
          totalLikes: 0,
          totalReports: 0
        });
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to fetch stats');
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show toast for stats errors to avoid spam
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPendingMessages();
      fetchReportedStories();
      fetchAllStories();
      fetchStats();
    }
  }, [session, fetchPendingMessages, fetchReportedStories, fetchAllStories, fetchStats]);

  const handleSelectStory = (storyId: string) => {
    setSelectedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentStories = activeTab === 'pending' ? pendingMessages : 
                          activeTab === 'reported' ? reportedStories : 
                          allStories;
    
    if (selectedStories.size === currentStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(currentStories.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStories.size === 0) {
      toast.error('No stories selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStories.size} story/stories?`)) {
      return;
    }

    try {
      for (const storyId of selectedStories) {
        const response = await fetch('/api/anonymous-stories/admin/moderate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storyId,
            status: 'declined',
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to delete story ${storyId}`);
        }
      }

      toast.success(`Successfully deleted ${selectedStories.size} stories`);
      setSelectedStories(new Set());
      
      // Refresh all data
      fetchPendingMessages();
      fetchReportedStories();
      fetchAllStories();
      fetchStats();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete some stories');
    }
  };

  const handleModerate = async (messageId: string, action: 'approved' | 'declined') => {
    setModerating(messageId);
    try {
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/anonymous-stories/admin/moderate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: messageId,
          status: action,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Story ${action} successfully`);
        // Remove from both pending messages and reported stories
        setPendingMessages(prev => prev.filter(msg => msg.id !== messageId));
        setReportedStories(prev => prev.filter(story => story.id !== messageId));
        // Refresh stats after moderation
        fetchStats();
      } else {
        throw new Error(data.error || 'Failed to moderate message');
      }
    } catch (error) {
      console.error('Error moderating message:', error);
      toast.error('Failed to moderate message');
    } finally {
      setModerating(null);
    }
  };

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date(currentTime);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      // For older posts, show the actual date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }, [currentTime]);

  if (loading) {
    return (
      <LayoutSupabase title="Anonymous Messages - Admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </LayoutSupabase>
    );
  }

  return (
    <LayoutSupabase title="Anonymous Messages - Admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Anonymous Messages</h1>
                <p className="text-gray-600 mt-1">Manage anonymous questions and responses</p>
              </div>
              <div className="flex items-center space-x-2">
                <FiMessageCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-500">
                  {pendingMessages.length} pending review
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Post New Question */}
            <div className="lg:col-span-1">
              
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 mt-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Stories</span>
                    <span className="font-semibold text-blue-600">{stats.totalStories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Published</span>
                    <span className="font-semibold text-green-600">{stats.approvedStories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Review</span>
                    <span className="font-semibold text-orange-600">{stats.pendingStories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reported</span>
                    <span className="font-semibold text-red-600">{stats.reportedStories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Likes</span>
                    <span className="font-semibold text-purple-600">{stats.totalLikes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Reports</span>
                    <span className="font-semibold text-red-600">{stats.totalReports}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stories Management */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                {/* Tabs */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Pending ({pendingMessages.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('reported')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'reported'
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Reported ({reportedStories.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'all'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      All Stories ({allStories.length})
                    </button>
                  </div>
                  
                  {/* Bulk Actions */}
                  {selectedStories.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedStories.size} selected
                      </span>
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>

                {/* Content based on active tab */}
                {activeTab === 'pending' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Pending Stories</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSelectAll}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {selectedStories.size === pendingMessages.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                          onClick={fetchPendingMessages}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {pendingMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <FiEye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No pending stories at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingMessages.map((story) => (
                          <motion.div
                            key={story.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedStories.has(story.id)}
                                onChange={() => handleSelectStory(story.id)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2">{story.content}</h4>
                                <div className="flex items-center space-x-2 mb-3">
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <FiClock className="w-3 h-3 mr-1" />
                                    {formatDate(story.created_at)}
                                  </span>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handleModerate(story.id, 'approved')}
                                    disabled={moderating === story.id}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                    <span>{moderating === story.id ? 'Approving...' : 'Approve'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleModerate(story.id, 'declined')}
                                    disabled={moderating === story.id}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FiX className="w-4 h-4" />
                                    <span>{moderating === story.id ? 'Declining...' : 'Decline'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'reported' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Reported Stories</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSelectAll}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {selectedStories.size === reportedStories.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                          onClick={fetchReportedStories}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {reportedStories.length === 0 ? (
                      <div className="text-center py-12">
                        <FiFlag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No reported stories at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reportedStories.map((story) => (
                          <motion.div
                            key={story.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-red-200 rounded-lg p-4 bg-red-50"
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedStories.has(story.id)}
                                onChange={() => handleSelectStory(story.id)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2">{story.title}</h4>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                    {story.reports_count} Report{story.reports_count > 1 ? 's' : ''}
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <FiClock className="w-3 h-3 mr-1" />
                                    {formatDate(story.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-800 mb-3">{story.content}</p>
                                
                                {/* Report Reasons */}
                                {story.story_reports && story.story_reports.length > 0 && (
                                  <div className="mb-3 p-3 bg-white rounded border border-red-200">
                                    <h5 className="text-sm font-medium text-red-800 mb-2">Report Reasons:</h5>
                                    <div className="space-y-1">
                                      {story.story_reports.map((report, index) => (
                                        <div key={index} className="text-sm text-gray-700">
                                          <span className="text-red-600">•</span> {report.reason}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handleModerate(story.id, 'approved')}
                                    disabled={moderating === story.id}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                    <span>{moderating === story.id ? 'Keeping...' : 'Keep Story'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleModerate(story.id, 'declined')}
                                    disabled={moderating === story.id}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <FiX className="w-4 h-4" />
                                    <span>{moderating === story.id ? 'Removing...' : 'Remove Story'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'all' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">All Stories</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSelectAll}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {selectedStories.size === allStories.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                          onClick={fetchAllStories}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {allStories.length === 0 ? (
                      <div className="text-center py-12">
                        <FiMessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No stories found.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allStories.map((story) => (
                          <motion.div
                            key={story.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-lg p-4 ${
                              story.status === 'approved' 
                                ? 'border-green-200 bg-green-50' 
                                : story.status === 'declined'
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-orange-200 bg-orange-50'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedStories.has(story.id)}
                                onChange={() => handleSelectStory(story.id)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900">{story.title}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    story.status === 'approved' 
                                      ? 'bg-green-100 text-green-700' 
                                      : story.status === 'declined'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {story.status === 'approved' ? 'Published' : 
                                     story.status === 'declined' ? 'Deleted' : 'Pending'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <FiClock className="w-3 h-3 mr-1" />
                                    {formatDate(story.created_at)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {story.likes_count || 0} likes
                                  </span>
                                  {(story.reports_count || 0) > 0 && (
                                    <span className="text-sm text-red-600">
                                      {story.reports_count} reports
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-800 mb-3">{story.content}</p>
                                
                                {/* Action Buttons for pending stories */}
                                {story.status === 'pending' && (
                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={() => handleModerate(story.id, 'approved')}
                                      disabled={moderating === story.id}
                                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <FiCheck className="w-4 h-4" />
                                      <span>{moderating === story.id ? 'Approving...' : 'Approve'}</span>
                                    </button>
                                    <button
                                      onClick={() => handleModerate(story.id, 'declined')}
                                      disabled={moderating === story.id}
                                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <FiX className="w-4 h-4" />
                                      <span>{moderating === story.id ? 'Declining...' : 'Decline'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </LayoutSupabase>
  );
};

export default AdminAnonymousMessages;
