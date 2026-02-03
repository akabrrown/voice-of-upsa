import React, { useState, useEffect, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import { Database } from '@/lib/database-types';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import ArticleView from '@/components/ArticleView';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import NextImage from 'next/image';
import toast from 'react-hot-toast';
import { FiMessageCircle, FiX, FiHeart, FiBookmark, FiShare2, FiUser } from 'react-icons/fi';
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

import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('An error occurred while fetching the data.');
  return res.json();
});

const ArticlePage: React.FC<{ initialArticle?: Article }> = ({ initialArticle }) => {
  const router = useRouter();
  const { slug } = router.query;
  const { user, supabase } = useSupabase();
  const [cachedSession, setCachedSession] = useState<{ access_token?: string } | null>(null);

  // SWR for Article Data
  const { data: fetchResult, isLoading: articleLoading, mutate: mutateArticle } = useSWR(
    slug ? `/api/articles/${slug}` : null,
    fetcher,
    {
      fallbackData: initialArticle ? { success: true, data: { article: initialArticle } } : undefined,
      revalidateOnFocus: false
    }
  );

  const article = React.useMemo(() => {
    if (!fetchResult) return null;
    return fetchResult.data?.article || fetchResult.data?.data?.article || fetchResult.article || fetchResult.data;
  }, [fetchResult]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [viewTrackingCooldown, setViewTrackingCooldown] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const loading = articleLoading && !article;

  // Redirect to home if slug is missing
  useEffect(() => {
    if (!slug && router.isReady) {
      router.push('/');
    }
  }, [slug, router.isReady, router]);

  // Auth processing
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCachedSession(session);
    };
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCachedSession(session);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Comments fetching (could also be SWR, but keeping as is for brevity unless needed)
  const fetchComments = useCallback(async () => {
    if (!slug) return;
    try {
      const response = await fetch(`/api/articles/${slug}/comments`, {
        headers: {
          ...(cachedSession && { 'Authorization': `Bearer ${cachedSession.access_token}` }),
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) setComments(data.data?.comments || []);
    } catch (e) { console.error('Comments fetch failed', e); }
  }, [slug, cachedSession]);

  const fetchReactions = useCallback(async () => {
    if (!slug) return;
    try {
      const response = await fetch(`/api/articles/${slug}/reactions`, {
        headers: {
          ...(cachedSession && { 'Authorization': `Bearer ${cachedSession.access_token}` }),
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        const fetchedReactions: Reaction[] = data.data?.reactions || [];
        setReactions(fetchedReactions);
        const userReact = fetchedReactions.find(r => r.userReacted);
        setUserReaction(userReact ? userReact.type : null);
      }
    } catch (e) { console.error('Reactions fetch failed', e); }
  }, [slug, cachedSession]);

  const trackView = useCallback(async () => {
    if (!article || viewTracked || viewTrackingCooldown) return;
    try {
      setViewTrackingCooldown(true);
      const response = await fetch(`/api/articles/${article.id}/view`, {
        method: 'POST',
        headers: {
          ...(cachedSession && { 'Authorization': `Bearer ${cachedSession.access_token}` }),
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setViewTracked(true);
        mutateArticle(); // Refresh via SWR
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    } finally {
      setTimeout(() => setViewTrackingCooldown(false), 5000);
    }
  }, [article, cachedSession, viewTracked, viewTrackingCooldown, mutateArticle]);

  const checkBookmarkStatus = useCallback(async () => {
    if (!article || !user) return;

    try {
      if (!cachedSession) return;

      const response = await fetch(`/api/user/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${cachedSession.access_token}`,
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
  }, [article, user, cachedSession]);

  useEffect(() => {
    if (slug) {
      fetchComments();
      fetchReactions();
    }
  }, [slug, fetchComments, fetchReactions]);

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
          mutateArticle(); // Simple re-fetch for real-time consistency
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [article, supabase, mutateArticle]);

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
      if (!cachedSession) {
        toast.error('Please sign in to bookmark articles');
        setIsBookmarked(previousState); // Revert on error
        return;
      }

      const response = await fetch(`/api/articles/${article.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cachedSession.access_token}`,
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
      
      if (!cachedSession) {
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
          'Authorization': `Bearer ${cachedSession.access_token}`
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
      setComments(prev => {
        const updatedComments = prev.map(c => 
          c.id === optimisticComment.id ? data.data.comment : c
        );
        // Remove any potential duplicates by filtering unique IDs
        const uniqueComments = updatedComments.filter((comment, index, array) => 
          array.findIndex(c => c.id === comment.id) === index
        );
        return uniqueComments;
      });
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
      
      if (!cachedSession) {
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
          'Authorization': `Bearer ${cachedSession.access_token}`
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
      const response = await fetch(`/api/articles/${article?.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Only include auth header if we have a session
          ...(cachedSession && { 'Authorization': `Bearer ${cachedSession.access_token}` })
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

  const siteUrl = 'https://voiceofupsa.com';
  // Use initialArticle for SSR metadata
  const metaArticle = article || initialArticle;
  const articleTitle = metaArticle ? `${metaArticle.title} | Voice of UPSA` : 'Voice of UPSA';
  const articleDesc = metaArticle?.excerpt || 'Read this article on Voice of UPSA';
  const articleUrl = metaArticle ? `${siteUrl}/articles/${metaArticle.slug}` : siteUrl;
  const articleImage = metaArticle?.featured_image?.startsWith('http') 
    ? metaArticle.featured_image 
    : metaArticle?.featured_image 
      ? `${siteUrl}${metaArticle.featured_image.startsWith('/') ? metaArticle.featured_image : '/' + metaArticle.featured_image}`
      : `${siteUrl}/images/og-default.jpg`;

  const headContent = (
    <Head>
      <title>{articleTitle}</title>
      <meta name="description" content={articleDesc} />
      
      {/* Open Graph / Facebook */}
      <meta key="og:type" property="og:type" content="article" />
      <meta key="og:url" property="og:url" content={articleUrl} />
      <meta key="og:title" property="og:title" content={articleTitle} />
      <meta key="og:description" property="og:description" content={articleDesc} />
      <meta key="og:image" property="og:image" content={articleImage} />
      <meta key="og:image:secure_url" property="og:image:secure_url" content={articleImage} />
      <meta key="og:image:width" property="og:image:width" content="1200" />
      <meta key="og:image:height" property="og:image:height" content="630" />
      <meta key="og:image:alt" property="og:image:alt" content={articleTitle} />
      <meta key="og:image:type" property="og:image:type" content="image/jpeg" />

      {/* Twitter */}
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:url" name="twitter:url" content={articleUrl} />
      <meta key="twitter:title" name="twitter:title" content={articleTitle} />
      <meta key="twitter:description" name="twitter:description" content={articleDesc} />
      <meta key="twitter:image" name="twitter:image" content={articleImage} />
    </Head>
  );

  // REMOVED conditional loading return that was breaking hydration

  if (!article) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
            <NextLink href="/articles" className="text-golden hover:text-yellow-600">
              Browse all articles
            </NextLink>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {headContent}
      <Layout
        title={articleTitle}
        description={articleDesc}
        ogImage={articleImage}
        ogUrl={articleUrl}
      >
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
              <ArticleView 
                article={article}
                isEditable={user?.role === 'admin' || user?.role === 'editor'}
                onEdit={() => router.push(`/editor/articles/${article.id}/edit`)}
              />

              {/* In-Article Ad */}
              <div className="my-12">
                <AdDisplay adType="in-article" location="article_in_article" className="w-full" />
              </div>

              <article>
                {/* Action Buttons */}
                <div className="flex items-center space-x-4 py-8 border-y border-gray-100 mb-8">
                  <button
                    onClick={() => handleReaction('heart')}
                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      userReaction === 'heart'
                        ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 ring-1 ring-gray-100'
                    }`}
                  >
                    <FiHeart className={`w-5 h-5 ${userReaction === 'heart' ? 'fill-current' : ''}`} />
                    <span>{getReactionCount('heart')}</span>
                  </button>

                  <button
                    onClick={toggleBookmark}
                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      isBookmarked
                        ? 'bg-golden/10 text-golden ring-1 ring-golden/20'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 ring-1 ring-gray-100'
                    }`}
                  >
                    <FiBookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                  </button>

                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold bg-navy text-white hover:bg-navy/90 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FiShare2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-12">
                    {article.tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-default"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comments Section */}
                <section className="mt-16 pt-16 border-t border-gray-100" id="comments">
                  <h2 className="text-3xl font-bold text-navy mb-10 flex items-center">
                    <FiMessageCircle className="mr-4 text-golden" />
                    Comments ({comments.length})
                  </h2>

                  {/* Comment Form */}
                  <form onSubmit={handleCommentSubmit} className="mb-16">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden focus-within:ring-2 focus-within:ring-golden/20 transition-all">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={user ? "Share your thoughts on this story..." : "Please sign in to join the conversation"}
                        disabled={!user || isSubmittingComment}
                        className="w-full p-6 min-h-[140px] focus-ring-0 border-none resize-none disabled:bg-gray-50 text-gray-800"
                      />
                      <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {user ? 'Commenting as ' + (user.user_metadata?.name || user.email) : 'Sign in to comment'}
                        </p>
                        <button
                          type="submit"
                          disabled={!user || !commentText.trim() || isSubmittingComment}
                          className="px-8 py-2.5 bg-golden text-navy rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md active:transform active:scale-95"
                        >
                          {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-10">
                    {comments.filter(c => !c.parent_id).map((comment: Comment) => {
                      const commentReplies = comments.filter(r => r.parent_id === comment.id);
                      return (
                        <div key={comment.id} className="group">
                          <div className="flex space-x-5">
                            <div className="flex-shrink-0">
                              {comment.author?.avatar_url ? (
                                <NextImage
                                  src={comment.author.avatar_url}
                                  alt={comment.author.name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-navy/5 rounded-2xl flex items-center justify-center ring-2 ring-white">
                                  <FiUser className="w-6 h-6 text-navy/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-bold text-navy text-lg">{comment.author?.name || 'Anonymous'}</h4>
                                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{formatDate(comment.created_at)}</span>
                                </div>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                              </div>
                              
                              <div className="mt-3 flex items-center space-x-4 px-2">
                                <button
                                  onClick={() => {
                                    if (!user) {
                                      toast.error('Sign in to reply');
                                      return;
                                    }
                                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                    setReplyText('');
                                  }}
                                  className="text-sm font-bold text-gray-400 hover:text-golden transition-colors"
                                >
                                  {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                                </button>
                              </div>
                              
                              {replyingTo === comment.id && (
                                <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-5 px-2">
                                  <div className="bg-white rounded-xl shadow-lg border border-golden/20 overflow-hidden">
                                    <textarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Write your reply..."
                                      className="w-full p-4 min-h-[100px] focus:ring-0 border-none resize-none text-gray-800"
                                      autoFocus
                                    />
                                    <div className="px-4 py-2 bg-gray-50 flex justify-end border-t border-gray-100">
                                      <button
                                        type="submit"
                                        disabled={!replyText.trim() || isSubmittingComment}
                                        className="px-5 py-1.5 bg-golden text-navy rounded-lg font-bold text-sm hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                                      >
                                        {isSubmittingComment ? 'Posting...' : 'Post Reply'}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              )}

                              {/* Nested Replies */}
                              {commentReplies.length > 0 && (
                                <div className="mt-6 space-y-6 pt-6 border-l-2 border-gray-50 pl-6">
                                  {commentReplies.map((reply) => (
                                    <div key={reply.id} className="flex space-x-4">
                                      <div className="flex-shrink-0">
                                        {reply.author?.avatar_url ? (
                                          <NextImage
                                            src={reply.author.avatar_url}
                                            alt={reply.author.name}
                                            width={36}
                                            height={36}
                                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-white"
                                          />
                                        ) : (
                                          <div className="w-9 h-9 bg-navy/5 rounded-xl flex items-center justify-center ring-2 ring-white">
                                            <FiUser className="w-4 h-4 text-navy/30" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-grow bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="font-bold text-navy text-sm">{reply.author?.name || 'Anonymous'}</h5>
                                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{formatDate(reply.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {comments.length === 0 && (
                      <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                        <FiMessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">No comments yet. Be the first to start the discussion!</p>
                      </div>
                    )}
                  </div>
                </section>
              </article>

              {/* Popup Ad */}
              <div className="mt-20">
                <AdDisplay adType="popup" location="article_popup" className="w-full" />
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Article Sidebar Ad */}
                <AdDisplay adType="sidebar" location="article_sidebar" className="w-full" />
                
                {/* About Author Mini Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-navy mb-4 border-b pb-2">About the Author</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-golden/20 flex items-center justify-center">
                      {article.author?.avatar_url ? (
                        <NextImage
                          src={article.author.avatar_url}
                          alt={article.contributor_name || article.author.name || 'Author'}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <FiUser className="text-golden w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {article.contributor_name && article.contributor_name.trim() 
                          ? article.contributor_name 
                          : article.author?.name || 'Anonymous Author'}
                      </h4>
                      <p className="text-xs text-gray-500">UPSA Contributor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-xl transition-all"
              >
                <FiX className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-black text-navy mb-2">Spread the Word</h3>
              <p className="text-gray-500 mb-8 text-sm">Share this interesting story from UPSA with your friends.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => shareOnSocial('whatsapp')}
                  className="flex items-center justify-center space-x-3 p-4 rounded-2xl bg-green-50 text-green-700 hover:bg-green-100 transition-all font-bold"
                >
                  <span className="text-xl">W</span>
                  <span>WhatsApp</span>
                </button>
                
                <button
                  onClick={() => shareOnSocial('facebook')}
                  className="flex items-center justify-center space-x-3 p-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all font-bold"
                >
                  <span className="text-xl">F</span>
                  <span>Facebook</span>
                </button>
                
                <button
                  onClick={() => shareOnSocial('twitter')}
                  className="flex items-center justify-center space-x-3 p-4 rounded-2xl bg-gray-900 text-white hover:bg-black transition-all font-bold"
                >
                  <span className="text-xl">X</span>
                  <span>Twitter</span>
                </button>
                
                <button
                  onClick={copyNextLink}
                  className="flex items-center justify-center space-x-3 p-4 rounded-2xl bg-golden text-navy hover:bg-yellow-400 transition-all font-bold"
                >
                  <span className="text-xl">🔗</span>
                  <span>Copy Link</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params || {};

  
  if (!slug || typeof slug !== 'string') {
    return { props: { initialArticle: null, ssrError: 'No slug provided' } };
  }
  
  try {
    const { getSupabaseAdmin } = await import('@/lib/database-server');
    const supabase = await getSupabaseAdmin();
    
    
    // Fetch article with author info using admin client to bypass RLS for public meta tags
    const { data: article, error } = await (supabase as SupabaseClient<Database>)
      .from('articles')
      .select('*, author:users(id, name, avatar_url)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
      
    
    
    if (error || !article) {
      console.error('Error fetching article for SSR:', error);
      return { 
        props: { 
          initialArticle: null,
          ssrError: error ? { message: error.message, code: error.code } : 'Article not found',
          
        } 
      };
    }
    
    return {
      props: {
        initialArticle: article || null, 
      }
    };
  } catch (err: unknown) {
    console.error('Exception in getServerSideProps:', err);
    return { 
      props: { 
        initialArticle: null, 
        ssrError: { 
          message: err instanceof Error ? err.message : String(err), 
          stack: (err instanceof Error && err.stack) ? 'present' : 'absent' 
        },
      } 
    };
  }
};

export default ArticlePage;
