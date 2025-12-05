import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiBookmark, FiCalendar, FiUser, FiEye, FiMessageCircle, FiHeart, FiExternalLink, FiTrash2 } from 'react-icons/fi';
import styles from '../styles/Bookmarks.module.css';
import { BookmarkedArticle } from '../types/bookmarks';

const BookmarksPage: React.FC = () => {
  const { user, supabase, session } = useSupabase();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingBookmark, setRemovingBookmark] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Represents admin OR editor access

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

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/user/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch bookmarks');
      }

      console.log('Bookmarks API response:', data);
      
      // Handle the main API response structure
      if (data.data?.bookmarks && Array.isArray(data.data.bookmarks)) {
        setBookmarks(data.data.bookmarks);
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const removeBookmark = async (articleId: string) => {
    if (!user) return;

    try {
      setRemovingBookmark(articleId);
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/articles/${articleId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove bookmark');
      }

      const result = await response.json();
      
      // Check if bookmark was actually removed (bookmarked: false)
      if (result.data && result.data.bookmarked === false) {
        // Update local state
        setBookmarks(prev => prev.filter(article => article.id !== articleId));
        toast.success('Bookmark removed');
      } else {
        throw new Error('Bookmark was not removed');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    } finally {
      setRemovingBookmark(null);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    fetchBookmarks();
  }, [user, router, fetchBookmarks]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <Layout title="My Bookmarks">
        <div className={styles.loadingState}>
          <div className="text-center">
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading your bookmarks...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Bookmarks">
      <div className={styles.bookmarksContainer}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.bookmarksHeader}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className={styles.bookmarksTitle}>My Bookmarks</h1>
                <p className={styles.bookmarksSubtitle}>
                  {bookmarks.length} {bookmarks.length === 1 ? 'article' : 'articles'} saved
                </p>
              </div>
              <Link 
                href="/articles" 
                className={styles.browseButton}
              >
                Browse Articles
              </Link>
            </div>
          </motion.div>

          {/* Bookmarks List */}
          {bookmarks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIcon}>
                <FiBookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className={styles.emptyTitle}>No bookmarks yet</h2>
              <p className={styles.emptyDescription}>
                Start saving articles you want to read later by clicking the bookmark icon on any article.
              </p>
              <Link 
                href="/articles" 
                className={styles.browseButton}
              >
                Browse Articles
              </Link>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6"
            >
              {bookmarks.map((article) => (
                <motion.div
                  key={article.id}
                  variants={itemVariants}
                  className={styles.bookmarkCard}
                >
                  <div className="md:flex">
                    {/* Featured Image */}
                    {article.featured_image ? (
                      <div className="md:w-1/3">
                        <Link href={`/articles/${article.slug}`}>
                          <div className={styles.bookmarkImage}>
                            <Image
                              src={article.featured_image}
                              alt={article.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                      </div>
                    ) : (
                      <div className="md:w-1/3 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className={styles.bookmarkContent}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Link href={`/articles/${article.slug}`}>
                            <h3 className={styles.bookmarkTitle}>
                              {article.title}
                            </h3>
                          </Link>
                          <p className={styles.bookmarkExcerpt}>
                            {article.excerpt}
                          </p>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className={styles.bookmarkMeta}>
                        <div className={styles.bookmarkMetaLeft}>
                          <div className="flex items-center">
                            <FiCalendar className="mr-1" />
                            <span>{formatDate(article.published_at)}</span>
                          </div>
                          <div className="flex items-center">
                            <FiUser className="mr-1" />
                            <span>{article.author_name}</span>
                          </div>
                        </div>
                        <div className={styles.bookmarkMetaRight}>
                          {/* Only show view count to admins and editors */}
                          {isAdmin && (
                            <div className="flex items-center">
                              <FiEye className="mr-1" />
                              <span>{article.views_count}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <FiHeart className="mr-1" />
                            <span>{article.likes_count}</span>
                          </div>
                          <div className="flex items-center">
                            <FiMessageCircle className="mr-1" />
                            <span>{article.comments_count}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={styles.bookmarkActions}>
                        <div className={styles.bookmarkDate}>
                          Bookmarked on {formatDate(article.bookmarked_at)}
                        </div>
                        <div className={styles.bookmarkButtons}>
                          <Link 
                            href={`/articles/${article.slug}`}
                            className={styles.readButton}
                          >
                            <FiExternalLink className="mr-1" />
                            Read
                          </Link>
                          <button
                            onClick={() => removeBookmark(article.id)}
                            disabled={removingBookmark === article.id}
                            className={styles.removeButton}
                          >
                            {removingBookmark === article.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            ) : (
                              <FiTrash2 className="mr-1" />
                            )}
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksPage;
