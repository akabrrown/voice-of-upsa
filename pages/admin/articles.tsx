import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';
import Image from 'next/image';
import { FiEdit2, FiTrash2, FiEye, FiSearch, FiCalendar, FiUser, FiFileText, FiCheck, FiArchive } from 'react-icons/fi';
import toast from 'react-hot-toast';
// Type assertion for Next.js Link component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextLink = Link as any;
// Type assertion for Next.js Image component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextImage = Image as any;
// Type assertion for Framer Motion component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

interface Article {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  excerpt: string;
  featured_image: string | null;
  author_id: string;
  author_name: string;
  author_email: string;
  category_id: string | null;
  category_name: string | null;
  display_location: 'homepage' | 'category_page' | 'both' | 'none';
  views_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // Featured article fields
  is_featured: boolean;
  featured_order: number;
  featured_until: string | null;
  // Content allowance fields
  allow_comments: boolean;
  moderate_comments: boolean;
  notify_on_publish: boolean;
  content_warning: boolean;
  age_restriction: boolean;
  is_premium: boolean;
  reading_time: number;
}

const AdminArticlesPage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [displayLocationModal, setDisplayLocationModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [publicationModal, setPublicationModal] = useState(false);
  const [featuredModal, setFeaturedModal] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('=== FRONTEND ARTICLES DEBUG ===');
      
      // Get session from Supabase
      console.log('Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session result:', { session: !!session, userId: session?.user?.id });
      
      if (!session) {
        console.error('No active session found');
        throw new Error('No active session');
      }
      
      console.log('Making API request to /api/admin/articles...');
      console.log('Session access token:', session.access_token ? 'Present' : 'Missing');
      const response = await fetch('/api/admin/articles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      console.log('API response data:', data);
      console.log('Articles found:', data.data?.articles?.length || 0);
      
      setArticles(data.data?.articles || []);
      console.log('Articles set in state:', data.data?.articles?.length || 0);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchArticles();
      fetchCategories();
    }
  }, [user, filter, fetchArticles, fetchCategories]);

  // Real-time subscription for article changes
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('admin-articles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'articles',
        },
        (payload) => {
          console.log('Admin: Article change detected:', payload);
          
          // Refresh articles when any change occurs
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchArticles();
            
            // Show toast notification for better UX
            if (payload.eventType === 'UPDATE') {
              toast.success('Article updated in real-time');
            } else if (payload.eventType === 'INSERT') {
              toast.success('New article created');
            } else if (payload.eventType === 'DELETE') {
              toast.success('Article deleted');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, fetchArticles]);

  const handleStatusChange = async (articleId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      setIsUpdating(true);
      
      // Get token from session
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const token = session.access_token;
      
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update article status');
      }

      toast.success(`Article ${newStatus} successfully`);
      fetchArticles();
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error updating article status:', error);
      toast.error('Failed to update article status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisplayLocationChange = async (articleId: string, newDisplayLocation: 'homepage' | 'category_page' | 'both' | 'none') => {
    try {
      setIsUpdating(true);
      
      // Get token from session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const token = session.access_token;
      
      const response = await fetch(`/api/admin/articles/${articleId}/display-location`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display_location: newDisplayLocation }),
      });

      if (!response.ok) {
        throw new Error('Failed to update display location');
      }

      toast.success('Display location updated successfully');
      fetchArticles();
      setDisplayLocationModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error updating display location:', error);
      toast.error('Failed to update display location');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCategoryChange = async (articleId: string, categoryId: string | null) => {
    try {
      setIsUpdating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch(`/api/admin/articles/${articleId}/category`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category_id: categoryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update article category');
      }

      toast.success('Article category updated successfully');
      fetchArticles();
      setCategoryModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error updating article category:', error);
      toast.error('Failed to update article category');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFeaturedToggle = async (articleId: string, isFeatured: boolean) => {
    try {
      setIsUpdating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/articles/${articleId}/featured`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          is_featured: isFeatured,
          featured_order: isFeatured ? 1 : 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }

      toast.success(`Article ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
      fetchArticles();
      setFeaturedModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublicationSettings = async (articleId: string, settings: {
    allow_comments: boolean;
    moderate_comments: boolean;
    notify_on_publish: boolean;
    content_warning: boolean;
    age_restriction: boolean;
    is_premium: boolean;
  }) => {
    try {
      setIsUpdating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/admin/articles/${articleId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update publication settings');
      }

      toast.success('Publication settings updated successfully');
      fetchArticles();
      setPublicationModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error updating publication settings:', error);
      toast.error('Failed to update publication settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      // Get token from session
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const token = session.access_token;
      
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      toast.success('Article deleted successfully');
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.author_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log('Debug - Articles in state:', articles.length);
  console.log('Debug - Filtered articles:', filteredArticles.length);
  console.log('Debug - Search term:', searchTerm);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayLocationColor = (location: string) => {
    switch (location) {
      case 'homepage':
        return 'bg-purple-100 text-purple-800';
      case 'category_page':
        return 'bg-indigo-100 text-indigo-800';
      case 'both':
        return 'bg-pink-100 text-pink-800';
      case 'none':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getDisplayLocationLabel = (location: string) => {
    switch (location) {
      case 'homepage':
        return 'Homepage';
      case 'category_page':
        return 'Category';
      case 'both':
        return 'Both';
      case 'none':
        return 'Hidden';
      default:
        return 'Unknown';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-navy text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <FiFileText className="mr-3" />
                Article Moderation
              </h1>
              <p className="text-gray-300">Review and manage all articles on the platform</p>
            </MotionDiv>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search articles by title or author..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  {(['all', 'draft', 'published', 'archived'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        filter === status
                          ? 'bg-golden text-navy'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </MotionDiv>

            {/* Articles List */}
            <MotionDiv
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => {
                  console.log('Rendering article:', article.title);
                  return (
                  <MotionDiv
                    key={article.id}
                    variants={itemVariants}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Article Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-navy mb-2">{article.title}</h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ml-4 ${getStatusColor(article.status)}`}>
                            {article.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <FiUser className="mr-1" />
                            {article.author_name}
                          </div>
                          {article.category_name && (
                            <div className="flex items-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {article.category_name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <FiCalendar className="mr-1" />
                            Created: {new Date(article.created_at).toLocaleDateString()}
                          </div>
                          {article.published_at && (
                            <div className="flex items-center">
                              <FiCalendar className="mr-1" />
                              Published: {new Date(article.published_at).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center">
                            <FiEye className="mr-1" />
                            {article.views_count} views
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDisplayLocationColor(article.display_location)}`}>
                              Display: {getDisplayLocationLabel(article.display_location)}
                            </span>
                          </div>
                        </div>

                        {/* Featured NextImage */}
                        {article.featured_image && (
                          <div className="mb-4">
                            <NextImage
                              src={article.featured_image}
                              alt={article.title}
                              width={400}
                              height={192}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-2 lg:space-y-0 lg:space-x-2">
                        {article.status === 'published' && (
                          <NextLink href={article.slug ? `/articles/${article.slug}` : '#'}>
                            <button className="p-2 text-gray-600 hover:text-navy transition-colors">
                              <FiEye className="text-xl" />
                            </button>
                          </NextLink>
                        )}
                        <NextLink href={`/editor/${article.id}/edit`}>
                          <button className="p-2 text-gray-600 hover:text-navy transition-colors">
                            <FiEdit2 className="text-xl" />
                          </button>
                        </NextLink>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setCategoryModal(true);
                          }}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm"
                        >
                          Set Category
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setDisplayLocationModal(true);
                          }}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm"
                        >
                          Set Display
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setFeaturedModal(true);
                          }}
                          className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-sm"
                        >
                          Featured
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setPublicationModal(true);
                          }}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-sm"
                        >
                          Settings
                        </button>
                        <button
                          onClick={() => setSelectedArticle(article)}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
                        >
                          Change Status
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <FiTrash2 className="text-xl" />
                        </button>
                      </div>
                    </div>
                  </MotionDiv>
                  );
                })
              ) : (
                (() => {
                  console.log('Showing empty state - no articles found');
                  return (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-lg shadow-lg p-12 text-center"
                >
                  <div className="text-gray-400 mb-4">
                    <FiFileText className="text-5xl mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-2">No articles found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'No articles match the current filter'}
                  </p>
                </MotionDiv>
                  );
                })()
              )}
            </MotionDiv>
          </div>
        </section>

        {/* Status Change Modal */}
        {selectedArticle && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedArticle(null)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Change Article Status</h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Article: <span className="font-semibold">{selectedArticle.title}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Current status: <span className="font-semibold">{selectedArticle.status}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                {(['draft', 'published', 'archived'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedArticle.id, status)}
                    disabled={status === selectedArticle.status || isUpdating}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
                      status === selectedArticle.status
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : status === 'published'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'published' && <FiCheck className="mr-2" />}
                    {status === 'draft' && <FiEdit2 className="mr-2" />}
                    {status === 'archived' && <FiArchive className="mr-2" />}
                    {isUpdating && status !== selectedArticle.status ? 'Updating...' : `Set as ${status}`}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Category Assignment Modal */}
        {categoryModal && selectedArticle && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setCategoryModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Set Article Category</h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Article: <span className="font-semibold">{selectedArticle.title}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Current category: <span className="font-semibold">{selectedArticle.category_name || 'Uncategorized'}</span>
                </p>
              </div>
              
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                  defaultValue={selectedArticle.category_id || ''}
                  id="category-select"
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const select = document.getElementById('category-select') as HTMLSelectElement;
                    handleCategoryChange(selectedArticle.id, select.value || null);
                  }}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Category'}
                </button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setCategoryModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Display Location Modal */}
        {displayLocationModal && selectedArticle && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setDisplayLocationModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Set Display Location</h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Article: <span className="font-semibold">{selectedArticle.title}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Current display: <span className="font-semibold">{getDisplayLocationLabel(selectedArticle.display_location)}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                {(['homepage', 'category_page', 'both', 'none'] as const).map((location) => (
                  <button
                    key={location}
                    onClick={() => handleDisplayLocationChange(selectedArticle.id, location)}
                    disabled={location === selectedArticle.display_location || isUpdating}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
                      location === selectedArticle.display_location
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : location === 'homepage'
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : location === 'category_page'
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        : location === 'both'
                        ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isUpdating && location !== selectedArticle.display_location ? 'Updating...' : getDisplayLocationLabel(location)}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setDisplayLocationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Featured Article Modal */}
        {selectedArticle && featuredModal && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setFeaturedModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Featured Article Settings</h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Article: <span className="font-semibold">{selectedArticle.title}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Current status: <span className="font-semibold">{selectedArticle.is_featured ? 'Featured' : 'Not Featured'}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleFeaturedToggle(selectedArticle.id, !selectedArticle.is_featured)}
                  disabled={isUpdating}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    selectedArticle.is_featured
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  {isUpdating ? 'Updating...' : selectedArticle.is_featured ? 'Remove from Featured' : 'Make Featured'}
                </button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFeaturedModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Publication Settings Modal */}
        {selectedArticle && publicationModal && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setPublicationModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Publication Settings</h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Article: <span className="font-semibold">{selectedArticle.title}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Allow Comments</label>
                  <input
                    type="checkbox"
                    id="allow-comments"
                    defaultChecked={selectedArticle.allow_comments ?? true}
                    className="w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Moderate Comments</label>
                  <input
                    type="checkbox"
                    id="moderate-comments"
                    defaultChecked={selectedArticle.moderate_comments ?? false}
                    className="w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Notify on Publish</label>
                  <input
                    type="checkbox"
                    id="notify-publish"
                    defaultChecked={selectedArticle.notify_on_publish ?? true}
                    className="w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Content Warning</label>
                  <input
                    type="checkbox"
                    id="content-warning"
                    defaultChecked={selectedArticle.content_warning ?? false}
                    className="w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Age Restriction</label>
                  <input
                    type="checkbox"
                    id="age-restriction"
                    defaultChecked={selectedArticle.age_restriction ?? false}
                    className="w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Premium Content</label>
                  <input
                    type="checkbox"
                    id="premium-content"
                    defaultChecked={selectedArticle.is_premium ?? false}
                    className="w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden"
                  />
                </div>
                
                <button
                  onClick={() => {
                    const settings = {
                      allow_comments: (document.getElementById('allow-comments') as HTMLInputElement).checked,
                      moderate_comments: (document.getElementById('moderate-comments') as HTMLInputElement).checked,
                      notify_on_publish: (document.getElementById('notify-publish') as HTMLInputElement).checked,
                      content_warning: (document.getElementById('content-warning') as HTMLInputElement).checked,
                      age_restriction: (document.getElementById('age-restriction') as HTMLInputElement).checked,
                      is_premium: (document.getElementById('premium-content') as HTMLInputElement).checked,
                    };
                    handlePublicationSettings(selectedArticle.id, settings);
                  }}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Settings'}
                </button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setPublicationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </div>
    </Layout>
  );
};

export default AdminArticlesPage;
