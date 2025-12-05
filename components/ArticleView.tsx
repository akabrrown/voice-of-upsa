import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import MarkdownContent from '@/components/MarkdownContent';
import WatermarkCanvas from '@/components/WatermarkCanvas';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiHeart, FiBookmark, FiShare2, FiUser, FiCalendar, FiEye, FiEdit, FiFolder } from 'react-icons/fi';
import styles from '../styles/ArticleView.module.css';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  contributor_name?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
    avatar_url?: string;
    bio?: string;
  };
  views_count: number;
  likes_count: number;
  comments_count: number;
  is_featured?: boolean;
  tags?: string[];
}

interface ArticleViewProps {
  article: Article;
  isEditable?: boolean;
  onEdit?: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ 
  article, 
  isEditable = false, 
  onEdit 
}) => {
  const { session } = useSupabase();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes_count || 0);
  const [isAdmin, setIsAdmin] = useState(false); // Renamed but represents admin OR editor access

  // Check if user is admin or editor
  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const userRole = data.data?.role || data.role;
            setIsAdmin(userRole === 'admin' || userRole === 'editor');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };
    
    checkUserRole();
  }, [session]);

  // Track article view
  useEffect(() => {
    if (article.id) {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      fetch(`/api/articles/${article.slug}/view`, {
        method: 'POST',
        headers,
      }).catch(console.error);
    }
  }, [article.id, article.slug, session]);

  // Check initial bookmark status
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!session?.access_token || !article.id) return;

      try {
        const response = await fetch(`/api/articles/${article.slug}/bookmark`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsBookmarked(data.data.bookmarked);
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    checkBookmarkStatus();
  }, [article.id, article.slug, session]);

  const handleLike = async () => {
    if (!session) {
      toast.error('Please sign in to like articles');
      return;
    }

    try {
      const response = await fetch(`/api/articles/${article.slug}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error liking article:', error);
      toast.error('Failed to like article');
    }
  };

  const handleBookmark = async () => {
    if (!session) {
      toast.error('Please sign in to bookmark articles');
      return;
    }

    try {
      const response = await fetch(`/api/articles/${article.slug}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.data.bookmarked);
        toast.success(data.data.bookmarked ? 'Article saved' : 'Article removed from bookmarks');
      } else {
        toast.error('Failed to update bookmark');
      }
    } catch (error) {
      console.error('Error bookmarking article:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={styles.articleContainer}
    >
      {/* Unified Article Container - Title, Featured Image, and Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        {/* Article Header with Title */}
        <div className="p-6 lg:p-8">
          {article.is_featured && (
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Featured Article
            </div>
          )}
          
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              {article.author.avatar_url ? (
                <Image
                  src={article.author.avatar_url}
                  alt={article.contributor_name && article.contributor_name.trim() ? article.contributor_name : article.author.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <span>
                {article.contributor_name && article.contributor_name.trim() 
                  ? article.contributor_name 
                  : article.author.name}
              </span>
            </div>
            
            {/* Show category if available */}
            {article.category && (
              <div className="flex items-center gap-1">
                <FiFolder />
                <Link href={`/category/${article.category.slug}`} className="text-golden hover:text-golden-dark font-medium">
                  {article.category.name}
                </Link>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <FiCalendar />
              <span>{formatDate(article.published_at)}</span>
            </div>
            
            {/* Only show view count to admins and editors */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <FiEye />
                <span>{article.views_count || 0} views</span>
              </div>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="relative w-full h-64 lg:h-96">
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="p-6 lg:p-8">
          <WatermarkCanvas
            watermarkText="VOU - Voice of UPSA"
            opacity={0.08}
            fontSize={28}
            color="#1e3a8a"
          >
            <div className="prose prose-lg max-w-none">
              <MarkdownContent content={article.content} />
            </div>
          </WatermarkCanvas>
        </div>
      </motion.div>

      {/* Article Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className={styles.articleActions}
      >
        <div className={styles.actionButtons}>
          <button
            onClick={handleLike}
            className={`${styles.actionButton} ${isLiked ? styles.primaryButton : styles.secondaryButton}`}
          >
            <FiHeart />
            <span>{likeCount}</span>
          </button>
          
          <button
            onClick={handleBookmark}
            className={`${styles.actionButton} ${isBookmarked ? styles.primaryButton : styles.secondaryButton}`}
          >
            <FiBookmark />
            <span>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
          
          <button
            onClick={handleShare}
            className={`${styles.actionButton} ${styles.secondaryButton}`}
          >
            <FiShare2 />
            <span>Share</span>
          </button>
          
          {isEditable && onEdit && (
            <button
              onClick={onEdit}
              className={`${styles.actionButton} ${styles.primaryButton}`}
            >
              <FiEdit />
              <span>Edit</span>
            </button>
          )}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className={styles.articleTags}>
            {article.tags.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ArticleView;
