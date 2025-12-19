import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import MarkdownContent from '@/components/MarkdownContent';
import WatermarkCanvas from '@/components/WatermarkCanvas';
import Image from 'next/image';
import Link from 'next/link';
import { FiUser, FiCalendar, FiEye, FiEdit, FiFolder } from 'react-icons/fi';
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
  const [isAdmin, setIsAdmin] = useState(false); // Renamed but represents admin OR editor access
  const [imageError, setImageError] = useState(false);

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
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              {article.author && article.author.avatar_url ? (
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
                  : article.author?.name}
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
        {article.featured_image && !imageError && (
          <div className="relative w-full h-56 sm:h-64 lg:h-96">
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 100vw, 1200px"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        {/* Fallback for image errors */}
        {article.featured_image && imageError && (
          <div className="relative w-full h-64 lg:h-96 bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Image temporarily unavailable</p>
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="p-5 sm:p-6 lg:p-8">
          <WatermarkCanvas
            watermarkText="VOU - Voice of UPSA"
            opacity={0.08}
            fontSize={24}
            color="#1e3a8a"
          >
            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
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
