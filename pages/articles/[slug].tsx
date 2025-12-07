import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import Layout from '@/components/Layout';
import ArticleView from '@/components/ArticleView';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiMessageCircle, FiX, FiHeart, FiBookmark, FiShare2 } from 'react-icons/fi';
import { RealtimeChannel } from '@supabase/supabase-js';
import AdDisplay from '@/components/AdDisplay';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  status: string;
  created_at: string;
  published_at: string;
  updated_at: string;
  contributor_name?: string;
  tags?: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  views_count: number;
  likes_count: number;
  comments_count: number;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
  parent_id?: string | null;
  replies?: Comment[];
}

interface Reaction {
  type: string;
  count: number;
  userReacted: boolean;
}

interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

const ArticlePage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { user, supabase } = useSupabase();
  
  // Redirect to home if slug is missing
  useEffect(() => {
    if (!slug && router.isReady) {
      router.push('/');
    }
  }, [slug, router.isReady, router]);
  
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchArticle = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${slug}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || 'Failed to fetch article';
        throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
      }

      // API returns { success: true, data: { article } }
      setArticle(data.data?.article || data.article);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  const fetchComments = useCallback(async () => {
    if (!slug) return;
    
    try {
      const response = await fetch(`/api/articles/${slug}/comments`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      setComments(data.data?.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    }
  }, [slug]);

  const fetchReactions = useCallback(async () => {
    if (!slug) return;
    
    try {
      const response = await fetch(`/api/articles/${slug}/reactions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reactions');
      }

      const fetchedReactions: Reaction[] = data.data?.reactions || [];
      setReactions(fetchedReactions);
      
      // Check if current user has reacted
      const userReact = fetchedReactions.find(r => r.userReacted);
      setUserReaction(userReact ? userReact.type : null);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [slug]);

  const trackView = useCallback(async () => {
    if (!article) return;

    try {
      console.log('🔍 Tracking view for article:', article.id);
      
      // Try to get session for authenticated users
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Session available:', !!session);
      
      const response = await fetch(`/api/articles/${article.id}/view`, {
        method: 'POST',
        headers: {
          // Only include auth header if we have a session
          ...(session && { 'Authorization': `Bearer ${session.access_token}` }),
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 View tracking response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 View tracking response data:', data);
        setViewTracked(true);
        // Update the article's view count with the server response
        setArticle(prev => prev ? { ...prev, views_count: data.data.views_count } : null);
        console.log('🔍 View count updated to:', data.data.views_count);
      } else {
        console.error('🔍 View tracking failed:', response.status);
      }
    } catch (error) {
      console.error('🔍 Error tracking view:', error);
      // Don't show error to user, just fail silently
    }
  }, [article, supabase]);

  const checkBookmarkStatus = useCallback(async () => {
    if (!article || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/user/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const isBookmarked = data.bookmarks?.some((bookmark: Bookmark) => bookmark.article_id === article.id);
        setIsBookmarked(isBookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  }, [article, user, supabase]);

  useEffect(() => {
    if (slug) {
      fetchArticle();
      fetchComments();
      fetchReactions();
    }
  }, [slug, fetchArticle, fetchComments, fetchReactions]);

  // Cleanup real-time subscriptions on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel, supabase]);

  useEffect(() => {
    // Track view when article is loaded (for all users)
    if (article && !viewTracked) {
      trackView();
    }
  }, [article, viewTracked, trackView]);

  useEffect(() => {
    // Check bookmark status when article is loaded and user is authenticated
    if (article && user) {
      checkBookmarkStatus();
    }
  }, [article, user, checkBookmarkStatus]);

  // Real-time subscription for article updates
  useEffect(() => {
    if (!article || !supabase) return;

    const channel = supabase
      .channel(`article-${article.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'articles',
          filter: `id=eq.${article.id}`
        },
        (payload) => {
          console.log('Article updated:', payload);
          // Update view count if it changed
          if (payload.new.views_count !== article.views_count) {
            setArticle(prev => prev ? { ...prev, views_count: payload.new.views_count } : null);
          }
          // Update likes count if it changed and exists
          if (payload.new.likes_count !== undefined && payload.new.likes_count !== article.likes_count) {
            setArticle(prev => prev ? { ...prev, likes_count: payload.new.likes_count } : null);
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [article, supabase]);

  // Real-time subscription for reactions
  useEffect(() => {
    if (!article || !supabase) return;

    const reactionChannel = supabase
      .channel(`reactions-${article.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `article_id=eq.${article.id}`
        },
        async (payload) => {
          console.log('Reaction change detected:', payload);
          // Refresh reactions when they change
          await fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reactionChannel);
    };
  }, [article, supabase, fetchReactions]);

  // Real-time subscription for bookmarks
  useEffect(() => {
    if (!article || !supabase || !user) return;

    const bookmarkChannel = supabase
      .channel(`bookmarks-${article.id}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `article_id=eq.${article.id}`
        },
        async (payload) => {
          console.log('Bookmark change detected:', payload);
          // Check if this bookmark change affects the current user
          if (payload.new && 'user_id' in payload.new && payload.new.user_id === user.id) {
            setIsBookmarked(payload.eventType === 'INSERT');
          } else if (payload.old && 'user_id' in payload.old && payload.old.user_id === user.id) {
            setIsBookmarked(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookmarkChannel);
    };
  }, [article, supabase, user]);

  // Real-time subscription for comments
  useEffect(() => {
    if (!article || !supabase) return;

    const commentChannel = supabase
      .channel(`comments-${article.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${article.id}`
        },
        async (payload) => {
          console.log('New comment detected:', payload);
          // Only add comment if it's not from the current user (avoid duplicates from optimistic update)
          if (payload.new && user && 'user_id' in payload.new && payload.new.user_id !== user.id) {
            // Fetch the complete comment with author info
            await fetchComments();
            toast.success('New comment added');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${article.id}`
        },
        async (payload) => {
          console.log('Comment updated:', payload);
          await fetchComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${article.id}`
        },
        async (payload) => {
          console.log('Comment deleted:', payload);
          if (payload.old && 'id' in payload.old) {
            setComments(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentChannel);
    };
  }, [article, supabase, user, fetchComments]);

  const toggleBookmark = async () => {
    if (!article || !user) {
      toast.error('Please sign in to bookmark articles');
      return;
    }

    // Optimistic UI update
    const previousState = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to bookmark articles');
        setIsBookmarked(previousState); // Revert on error
        return;
      }

      const response = await fetch(`/api/articles/${article.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      const data = await response.json();
      setIsBookmarked(data.data.bookmarked);
      
      toast.success(data.data.bookmarked ? 'Article bookmarked' : 'Bookmark removed');
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to toggle bookmark');
      setIsBookmarked(previousState); // Revert on error
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!slug) {
      toast.error('Article not found');
      return;
    }

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: commentText.trim(),
      author: {
        id: user.id,
        name: user.user_metadata?.name || user.email || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add optimistic comment to UI immediately
    setComments(prev => [optimisticComment, ...prev]);
    const previousCommentText = commentText;
    setCommentText('');

    try {
      setIsSubmittingComment(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        // Revert optimistic update
        setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
        setCommentText(previousCommentText);
        return;
      }
      
      const response = await fetch(`/api/articles/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: optimisticComment.content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || 'Failed to post comment';
        console.error('Server error response:', data);
        throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
      }

      // Replace optimistic comment with real comment from server
      setComments(prev => prev.map(c => 
        c.id === optimisticComment.id ? data.data.comment : c
      ));
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
      // Revert optimistic update on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setCommentText(previousCommentText);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }

    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    if (!slug) {
      toast.error('Article not found');
      return;
    }

    // Create optimistic reply
    const optimisticReply: Comment = {
      id: `temp-${Date.now()}`,
      content: replyText.trim(),
      author: {
        id: user.id,
        name: user.user_metadata?.name || user.email || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: parentCommentId
    };

    // Add optimistic reply to comments array
    setComments(prev => [optimisticReply, ...prev]);
    const previousReplyText = replyText;
    setReplyText('');
    setReplyingTo(null);

    try {
      setIsSubmittingComment(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        setComments(prev => prev.filter(c => c.id !== optimisticReply.id));
        setReplyText(previousReplyText);
        setReplyingTo(parentCommentId);
        return;
      }
      
      const response = await fetch(`/api/articles/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: optimisticReply.content,
          parent_id: parentCommentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || 'Failed to post reply';
        console.error('Server error response:', data);
        throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
      }

      // Replace optimistic reply with real reply from server
      setComments(prev => prev.map(c => 
        c.id === optimisticReply.id ? data.data.comment : c
      ));
      toast.success('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
      setComments(prev => prev.filter(c => c.id !== optimisticReply.id));
      setReplyText(previousReplyText);
      setReplyingTo(parentCommentId);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReaction = async (type: string) => {
    // Optimistic UI update
    const previousReactions = [...reactions];
    const previousUserReaction = userReaction;
    
    // Update UI immediately
    const updatedReactionsOptimistic = reactions.map(r => {
      if (r.type === type) {
        // If clicking the same reaction, remove it
        if (userReaction === type) {
          return { ...r, count: Math.max(0, r.count - 1), userReacted: false };
        }
        // If clicking a new reaction, add it
        return { ...r, count: r.count + 1, userReacted: true };
      }
      // If user had a different reaction, remove it from that type
      if (r.type === userReaction) {
        return { ...r, count: Math.max(0, r.count - 1), userReacted: false };
      }
      return r;
    });
    
    setReactions(updatedReactionsOptimistic);
    setUserReaction(userReaction === type ? null : type);

    try {
      // Try to get session for authenticated users, but allow anonymous reactions
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/articles/${article?.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Only include auth header if we have a session
          ...(session && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({ reaction_type: type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to react');
      }

      // Update with server response to ensure consistency
      const updatedReactions: Reaction[] = data.data?.reactions || [];
      setReactions(updatedReactions);
      
      // Update user reaction state
      const userReact = updatedReactions.find(r => r.userReacted);
      setUserReaction(userReact ? userReact.type : null);
      
      toast.success('Reaction updated');
    } catch (error) {
      console.error('Error reacting:', error);
      toast.error('Failed to react');
      // Revert optimistic update on error
      setReactions(previousReactions);
      setUserReaction(previousUserReaction);
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!article) return;
    
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${article.slug}`;
    const title = article.title;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we copy the URL
        navigator.clipboard.writeText(url);
        toast.success('NextLink copied to clipboard! Share it on Instagram');
        setShowShareModal(false);
        return;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareModal(false);
    }
  };

  const copyNextLink = () => {
    if (!article) return;
    
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${article.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('NextLink copied to clipboard!');
    setShowShareModal(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReactionCount = (type: string) => {
    const reaction = reactions.find(r => r.type === type);
    return reaction ? reaction.count : 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
            <Link href="/articles" className="text-golden hover:text-yellow-600">
              Browse all articles
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={article.title}
      description={article.excerpt}
      ogImage={article.featured_image}
      ogDescription={article.excerpt}
    >
      <ArticleView 
        article={article}
        isEditable={user?.role === 'admin' || user?.role === 'editor'}
        onEdit={() => router.push(`/editor/articles/${article.id}/edit`)}
      />

      {/* In-Article Ad */}
      <div className="my-8">
        <AdDisplay adType="in-article" className="w-full" />
      </div>

      {/* Popup Ad */}
      <div className="my-8">
        <AdDisplay adType="popup" className="w-full" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <article>
          {/* Comments Section - Keep existing comments functionality */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <FiMessageCircle className="w-6 h-6" />
          <span>Comments ({comments.length})</span>
        </h2>

        {/* Comment Form */}
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-golden rounded-full flex items-center justify-center text-navy font-semibold flex-shrink-0">
                  {(user.user_metadata?.name || user.email || 'Anonymous').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {commentText.length}/1000 characters
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="px-6 py-2 bg-golden text-navy font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 py-6 border-y border-gray-200">
            <button
              onClick={() => handleReaction('heart')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                userReaction === 'heart'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiHeart className="w-5 h-5" />
              <span>{getReactionCount('heart')}</span>
            </button>

            <button
              onClick={toggleBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiBookmark className="w-5 h-5" />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <FiShare2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <FiMessageCircle className="w-6 h-6" />
              <span>Comments ({comments.length})</span>
            </h2>

            {/* Comment Form */}
            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-golden rounded-full flex items-center justify-center text-navy font-semibold flex-shrink-0 relative">
                      {user.user_metadata?.avatar_url?.trim() ? (
                        <Image 
                          src={user.user_metadata.avatar_url} 
                          alt={user.user_metadata?.name || user.email}
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />
                      ) : (
                        (user.user_metadata?.name || user.email || 'Anonymous').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none"
                        rows={3}
                        maxLength={1000}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {commentText.length}/1000 characters
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingComment || !commentText.trim()}
                          className="px-6 py-2 bg-golden text-navy font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Sign in prompt for non-users */}
            {!user && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <FiMessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Join the conversation</h3>
                <p className="text-blue-700 mb-4">Sign in to share your thoughts and engage with the community.</p>
                <Link href="/auth/sign-in" className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Sign In to Comment
                </Link>
              </div>
            )}


            {/* Comments List */}
            <div className="space-y-6">
              {comments.filter(c => !!c && !c.parent_id).map((comment) => {
                // Get replies for this comment
                const replies = comments.filter(r => r.parent_id === comment.id);
                
                return (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-golden rounded-full flex items-center justify-center text-navy font-semibold flex-shrink-0 relative">
                      {comment.author?.avatar_url?.trim() ? (
                        <Image 
                          src={comment.author.avatar_url} 
                          alt={comment.author?.name || 'User'}
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />
                      ) : (
                        (comment.author?.name || 'Anonymous').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{comment.author?.name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(comment.created_at)}
                            {comment.updated_at !== comment.created_at && (
                              <span className="ml-2 text-blue-600">(edited)</span>
                            )}
                          </p>
                        </div>
                        {user && comment.author?.id && user.id === comment.author.id && (
                          <div className="flex space-x-2">
                            <button
                              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                              onClick={() => {
                                // Add edit functionality here
                                toast('Edit feature coming soon!');
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                              onClick={() => {
                                // Add delete functionality here
                                toast('Delete feature coming soon!');
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      
                      {/* Reply Button */}
                      <div className="mt-3">
                        <button
                          className="text-sm text-golden hover:text-yellow-600 font-medium transition-colors"
                          onClick={() => {
                            if (!user) {
                              toast.error('Please sign in to reply');
                              return;
                            }
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                            setReplyText('');
                          }}
                        >
                          {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                        </button>
                      </div>

                      {/* Reply Form */}
                      {user && replyingTo === comment.id && (
                        <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-golden rounded-full flex items-center justify-center text-navy font-semibold flex-shrink-0 relative">
                                {user.user_metadata?.avatar_url?.trim() ? (
                                  <Image 
                                    src={user.user_metadata.avatar_url} 
                                    alt={user.user_metadata?.name || user.email}
                                    fill
                                    className="rounded-full object-cover"
                                    sizes="32px"
                                  />
                                ) : (
                                  (user.user_metadata?.name || user.email || 'Anonymous').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none text-sm"
                                  rows={2}
                                  maxLength={1000}
                                  autoFocus
                                />
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {replyText.length}/1000 characters
                                  </span>
                                  <button
                                    type="submit"
                                    disabled={isSubmittingComment || !replyText.trim()}
                                    className="px-4 py-1.5 bg-golden text-navy font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                  >
                                    {isSubmittingComment ? 'Posting...' : 'Post Reply'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Display Replies */}
                      {replies.length > 0 && (
                        <div className="mt-4 space-y-4 pl-8 border-l-2 border-gray-200">
                          {replies.map((reply) => (
                            <div key={reply.id} className="bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-golden rounded-full flex items-center justify-center text-navy font-semibold flex-shrink-0 relative">
                                  {reply.author?.avatar_url?.trim() ? (
                                    <Image 
                                      src={reply.author.avatar_url} 
                                      alt={reply.author?.name || 'User'}
                                      fill
                                      className="rounded-full object-cover"
                                      sizes="32px"
                                    />
                                  ) : (
                                    (reply.author?.name || 'Anonymous').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">{reply.author?.name || 'Anonymous'}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(reply.created_at)}
                                      </p>
                                    </div>
                                    {user && reply.author?.id && user.id === reply.author.id && (
                                      <div className="flex space-x-2">
                                        <button
                                          className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                          onClick={() => toast('Edit feature coming soon!')}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                                          onClick={() => toast('Delete feature coming soon!')}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )})}


              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </div>
        </article>
      </motion.div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share Article</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => shareOnSocial('whatsapp')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">W</span>
                </div>
                <span className="text-gray-700">WhatsApp</span>
              </button>
              
              <button
                onClick={() => shareOnSocial('facebook')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">f</span>
                </div>
                <span className="text-gray-700">Facebook</span>
              </button>
              
              <button
                onClick={() => shareOnSocial('twitter')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <span className="text-gray-700">Twitter/X</span>
              </button>
              
              <button
                onClick={() => shareOnSocial('instagram')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">IG</span>
                </div>
                <span className="text-gray-700">Instagram</span>
              </button>
              
              <button
                onClick={copyNextLink}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🔗</span>
                </div>
                <span className="text-gray-700">Copy NextLink</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ArticlePage;
