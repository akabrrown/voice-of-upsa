import React, { useState, useEffect, useCallback } from 'react';
import LayoutSupabase from '@/components/LayoutSupabase';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiBookOpen, FiEye, FiClock, FiStar } from 'react-icons/fi';

interface PendingStory {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'pending';
  author_type: 'anonymous' | 'user' | 'non_user';
  created_at: string;
}

const AdminAnonymousStories: React.FC = () => {
  const { session } = useSupabase();
  const [pendingStories, setPendingStories] = useState<PendingStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  const [featuredStory, setFeaturedStory] = useState<string | null>(null);

  const fetchPendingStories = useCallback(async () => {
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
        setPendingStories(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch pending stories');
      }
    } catch (error) {
      console.error('Error fetching pending stories:', error);
      toast.error('Failed to load pending stories');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPendingStories();
    }
  }, [session, fetchPendingStories]);

  const handleModerate = async (storyId: string, action: 'approved' | 'declined') => {
    setModerating(storyId);
    try {
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/anonymous-stories/admin/moderate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          status: action,
          featured: featuredStory === storyId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Story ${action} successfully`);
        setPendingStories(prev => prev.filter(story => story.id !== storyId));
        if (featuredStory === storyId) {
          setFeaturedStory(null);
        }
      } else {
        throw new Error(data.error || 'Failed to moderate story');
      }
    } catch (error) {
      console.error('Error moderating story:', error);
      toast.error('Failed to moderate story');
    } finally {
      setModerating(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'general': 'bg-gray-100 text-gray-700',
      'campus-life': 'bg-blue-100 text-blue-700',
      'academics': 'bg-green-100 text-green-700',
      'relationships': 'bg-pink-100 text-pink-700',
      'personal-growth': 'bg-purple-100 text-purple-700',
      'struggles': 'bg-red-100 text-red-700',
      'achievements': 'bg-yellow-100 text-yellow-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <LayoutSupabase title="Anonymous Stories - Admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </LayoutSupabase>
    );
  }

  return (
    <LayoutSupabase title="Anonymous Stories - Admin">
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Anonymous Stories</h1>
                <p className="text-gray-600 mt-1">Review and moderate anonymous story submissions</p>
              </div>
              <div className="flex items-center space-x-2">
                <FiBookOpen className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-500">
                  {pendingStories.length} pending review
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingStories.length}</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {pendingStories.filter(s => s.category === 'campus-life').length}
                </div>
                <div className="text-sm text-gray-600">Campus Life</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {pendingStories.filter(s => s.category === 'academics').length}
                </div>
                <div className="text-sm text-gray-600">Academics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {pendingStories.filter(s => s.category === 'personal-growth').length}
                </div>
                <div className="text-sm text-gray-600">Personal Growth</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Pending Stories</h2>
              <button
                onClick={fetchPendingStories}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh
              </button>
            </div>

            {pendingStories.length === 0 ? (
              <div className="text-center py-12">
                <FiEye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Stories</h3>
                <p className="text-gray-500">All stories have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getCategoryColor(story.category)}`}>
                            {story.category}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <FiClock className="w-3 h-3 mr-1" />
                            {formatDate(story.created_at)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {story.author_type}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{story.title}</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {story.content}
                        </p>
                        
                        <div className="text-sm text-gray-500">
                          {story.content.length} characters
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        id={`featured-${story.id}`}
                        checked={featuredStory === story.id}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFeaturedStory(story.id);
                          } else {
                            setFeaturedStory(null);
                          }
                        }}
                        className="rounded border-gray-300 text-golden focus:ring-golden"
                      />
                      <label htmlFor={`featured-${story.id}`} className="text-sm text-gray-700 flex items-center cursor-pointer">
                        <FiStar className="w-4 h-4 mr-1" />
                        Feature this story
                      </label>
                    </div>

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
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </LayoutSupabase>
  );
};

export default AdminAnonymousStories;
