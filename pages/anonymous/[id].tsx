import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiClock, FiShield, FiArrowLeft, FiHeart, FiFlag, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface AnonymousStory {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count?: number;
  views_count?: number;
  status?: string;
  featured?: boolean;
}

const AnonymousStoryPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [story, setStory] = useState<AnonymousStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isReporting, setIsReporting] = useState(false);

  const trackView = useCallback(async (storyId: string) => {
    // Generate or get session ID for view tracking
    let sessionId = sessionStorage.getItem('anonymousSessionId');
    if (!sessionId) {
      sessionId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem('anonymousSessionId', sessionId);
    }

    try {
      const response = await fetch('/api/anonymous-stories/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: storyId,
          sessionId: sessionId
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('View tracking successful, refreshing story data...');
        // Refresh story data to get updated view count
        setTimeout(() => {
          // Direct API call to get updated story data
          fetch(`/api/anonymous-stories/${storyId}`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data) {
                const updatedStory = data.data;
                console.log('Updated story data:', { views_count: updatedStory.views_count });
                setStory(updatedStory);
                setLikeCount(updatedStory.likes_count || 0);
                setViewCount(updatedStory.views_count || 0);
              }
            })
            .catch(console.error);
        }, 1000);
      }
    } catch (error) {
      // Silently fail view tracking - don't show error to user
      console.error('View tracking error:', error);
    }
  }, []);

  const fetchStory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/anonymous-stories/get-approved');
      const data = await response.json();

      if (response.ok) {
        const stories = data.data || [];
        const foundStory = stories.find((s: AnonymousStory) => s.id === id);
        
        if (foundStory) {
          setStory(foundStory);
          setLikeCount(foundStory.likes_count || 0);
          setViewCount(foundStory.views_count || 0);
          
          // Track view for this story (non-blocking)
          trackView(id as string).catch(console.error);
        } else {
          setError('Story not found');
        }
      } else {
        setError('Failed to fetch story');
      }
    } catch {
      setError('Error loading story');
      console.error('Error fetching story');
    } finally {
      setLoading(false);
    }
  }, [id, trackView]);

  const handleLike = async () => {
    if (!id || !story) return;
    
    // Generate or get session ID for anonymous users
    let sessionId = sessionStorage.getItem('anonymousSessionId');
    if (!sessionId) {
      sessionId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem('anonymousSessionId', sessionId);
    }
    
    try {
      const response = await fetch('/api/anonymous-stories/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storyId: id,
          sessionId: sessionId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        toast.success(data.message || (isLiked ? 'Like removed' : 'Story liked'));
      } else {
        toast.error(data.error || 'Failed to like story');
      }
    } catch (error) {
      toast.error('Error liking story');
      console.error('Like error:', error);
    }
  };

  const handleReport = async () => {
    if (!id || !story) return;
    
    const reason = prompt('Please provide a reason for reporting this story:');
    if (!reason || !reason.trim()) {
      return;
    }

    // Generate or get session ID for anonymous users
    let sessionId = sessionStorage.getItem('anonymousSessionId');
    if (!sessionId) {
      sessionId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem('anonymousSessionId', sessionId);
    }

    try {
      setIsReporting(true);
      const response = await fetch('/api/anonymous-stories/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storyId: id,
          reason: reason.trim(),
          sessionId: sessionId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Story reported successfully');
      } else {
        toast.error(data.error || 'Failed to report story');
      }
    } catch (error) {
      toast.error('Error reporting story');
      console.error('Report error:', error);
    } finally {
      setIsReporting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStory();
    }
  }, [id, fetchStory]);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Layout title="Loading..." description="Loading anonymous message">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto mb-4"></div>
            <p className="text-gray-600">Loading message...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !story) {
    return (
      <Layout title="Story Not Found" description="Anonymous story not found">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Story Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'This anonymous story could not be found.'}</p>
            <Link 
              href="/articles?category=anonymous"
              className="inline-flex items-center bg-golden text-navy px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Anonymous Stories
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Anonymous Story - Voice of UPSA" 
      description="Read anonymous stories from the UPSA community"
    >
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link 
              href="/articles?category=anonymous"
              className="inline-flex items-center text-gray-600 hover:text-golden transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Anonymous Stories
            </Link>
          </motion.div>

          {/* Story Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-navy-light p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-golden rounded-full flex items-center justify-center">
                    <FiMessageCircle className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Anonymous Story</h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <FiClock className="w-4 h-4" />
                      <span>{formatDate(story.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-golden/10 px-3 py-1 rounded-full">
                  <FiShield className="w-4 h-4 text-golden" />
                  <span className="text-golden text-sm font-medium">Anonymous</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Story Title */}
              {story.title && (
                <h2 className="text-2xl font-bold text-navy mb-6">{story.title}</h2>
              )}
              
              {/* Story Content */}
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {story.content}
                </p>
              </div>

              {/* Story Stats */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-gray-500">
                    <div className="flex items-center space-x-2">
                      <FiMessageCircle className="w-4 h-4" />
                      <span>Anonymous Story</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiEye className="w-4 h-4" />
                      <span>{viewCount} views</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-golden">♥</span>
                      <span>{likeCount} likes</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(story.created_at)}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isLiked
                        ? 'bg-golden text-navy'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                  </button>
                  
                  <button
                    onClick={handleReport}
                    disabled={isReporting}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <FiFlag className="w-4 h-4" />
                    <span>{isReporting ? 'Reporting...' : 'Report'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AnonymousStoryPage;
