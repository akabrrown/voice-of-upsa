import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSend, FiBookOpen, FiThumbsUp, FiFlag } from 'react-icons/fi';

interface AnonymousStory {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'approved';
  author_type: 'anonymous' | 'user' | 'non_user';
  created_at: string;
  likes_count?: number;
  featured?: boolean;
}

const AnonymousPage: React.FC = () => {
  const [stories, setStories] = useState<AnonymousStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const fetchUserLikes = useCallback(async () => {
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      
      const response = await fetch('/api/anonymous-stories/get-user-likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, sessionId }),
      });

      const data = await response.json();
      
      if (response.ok && data.likedStories) {
        setLikedStories(new Set(data.likedStories));
      }
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  }, [sessionId]);

  const fetchStories = useCallback(async () => {
    try {
      const response = await fetch('/api/anonymous-stories/get-approved');
      const data = await response.json();
      
      console.log('Stories API response (updated):', data);
      
      if (response.ok) {
        setStories(data.data || []);
        // Fetch user likes after stories are loaded
        fetchUserLikes();
      } else {
        throw new Error(data.error || 'Failed to fetch stories');
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [fetchUserLikes]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!newContent.trim()) {
      toast.error('Please enter your story');
      return;
    }

    if (newTitle.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }

    if (newContent.trim().length < 50) {
      toast.error('Story must be at least 50 characters');
      return;
    }

    if (newContent.trim().length > 2000) {
      toast.error('Story must be less than 2000 characters');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/anonymous-stories/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: selectedCategory,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Story submitted successfully! It will be reviewed by our team.');
        setNewTitle('');
        setNewContent('');
        setSelectedCategory('general');
      } else {
        throw new Error(data.error || 'Failed to submit story');
      }
    } catch (error) {
      console.error('Error submitting story:', error);
      toast.error('Failed to submit story');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (storyId: string) => {
    try {
      // Try to get user ID from localStorage or auth context
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      
      const response = await fetch('/api/anonymous-stories/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storyId, 
          userId,
          sessionId // Always include session ID for anonymous users
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the local stories state to reflect the new like count
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes_count: data.likes_count }
            : story
        ));
        
        // Toggle the story in liked stories set
        if (data.liked) {
          setLikedStories(prev => new Set([...prev, storyId]));
          toast.success('Story liked!');
        } else {
          setLikedStories(prev => {
            const newSet = new Set(prev);
            newSet.delete(storyId);
            return newSet;
          });
          toast.success('Story unliked!');
        }
      } else {
        throw new Error(data.error || 'Failed to toggle like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to toggle like');
    }
  };

  const handleReport = async (storyId: string) => {
    // Open report dialog instead of immediately reporting
    setShowReportDialog(storyId);
    setReportReason('');
  };

  const submitReport = async (storyId: string) => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for the report');
      return;
    }

    try {
      const response = await fetch('/api/anonymous-stories/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storyId, 
          reason: reportReason.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the local stories state to reflect the new report count
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, reports_count: data.reports_count }
            : story
        ));
        toast.success('Story reported for review');
        setShowReportDialog(null);
        setReportReason('');
      } else {
        throw new Error(data.error || 'Failed to report story');
      }
    } catch (error) {
      console.error('Error reporting story:', error);
      toast.error('Failed to report story');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout title="Anonymous Stories - Voice of UPSA">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Anonymous Stories - Voice of UPSA">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-navy text-white">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-golden rounded-full flex items-center justify-center">
                <FiBookOpen className="w-8 h-8 text-navy" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Anonymous Stories</h1>
            <p className="text-xl text-gray-300">
              Share your stories anonymously. Your experiences matter and deserve to be heard.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Story Submission Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8 border-t-4 border-golden"
          >
            <h2 className="text-2xl font-bold text-navy mb-4">Share Your Story</h2>
            
            <p className="text-gray-600 mb-4">
              Share your experiences, thoughts, or stories completely anonymously. All stories are reviewed before being published.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Story Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Give your story a compelling title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                  maxLength={200}
                />
                <div className="mt-2 text-sm text-gray-500">
                  {newTitle.length}/200 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="campus-life">Campus Life</option>
                  <option value="academics">Academics</option>
                  <option value="relationships">Relationships</option>
                  <option value="personal-growth">Personal Growth</option>
                  <option value="struggles">Struggles & Challenges</option>
                  <option value="achievements">Achievements</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Story
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your story here. Be honest, be authentic, be you..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none"
                  rows={6}
                  maxLength={2000}
                />
                <div className="mt-2 text-sm text-gray-500">
                  {newContent.length}/2000 characters
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Minimum 50 characters required
                </span>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newContent.trim() || newContent.length < 50}
                  className="px-6 py-2 bg-golden text-navy font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <FiSend className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Share Story'}</span>
                </button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-navy/5 rounded-lg border border-navy/10">
              <p className="text-sm text-navy">
                <strong>Privacy Notice:</strong> All stories are anonymous and will be reviewed by our team before being published. 
                No personal information is collected or displayed. Stories that violate community guidelines will not be approved.
              </p>
            </div>
          </motion.div>

          {/* Stories Feed */}
          <div className="space-y-6">
            {stories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-lg p-8 text-center"
              >
                <FiBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Stories Yet</h3>
                <p className="text-gray-500">Be the first to share your anonymous story!</p>
              </motion.div>
            ) : (
              stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  {/* Story Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-golden/20 text-navy text-xs rounded-full font-medium capitalize">
                          {story.category}
                        </span>
                        {story.featured && (
                          <span className="px-2 py-1 bg-golden text-navy text-xs rounded-full font-medium">
                            Featured
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDate(story.created_at)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-navy mb-3">{story.title}</h3>
                      <p className="text-gray-800 leading-relaxed">{story.content}</p>
                    </div>
                  </div>

                  {/* Story Actions */}
                  <div className="flex items-center space-x-4 text-sm pt-4 border-t">
                    <button
                      onClick={() => handleLike(story.id)}
                      className={`flex items-center space-x-1 transition-colors ${
                        likedStories.has(story.id) 
                          ? 'text-golden' 
                          : 'text-gray-500 hover:text-golden'
                      }`}
                    >
                      <FiThumbsUp className="w-4 h-4" />
                      <span>{story.likes_count || 0}</span>
                    </button>
                    <button
                      onClick={() => handleReport(story.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <FiFlag className="w-4 h-4" />
                      <span>Report</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Report Dialog */}
        {showReportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-navy mb-4">Report Story</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for reporting this story. This helps our moderators review the content.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Report
                </label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Please explain why you're reporting this story..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReportDialog(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitReport(showReportDialog)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AnonymousPage;
