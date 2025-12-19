import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import { useCMSAuth } from '@/hooks/useCMSAuth';
import { useRealtimeArticles } from '@/hooks/useRealtimeArticles';
import { CMSButton } from '@/components/ui/CMSGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiSearch, FiCalendar, FiEye, FiEdit2, FiTrash2, FiUser, FiCheck, FiArchive } from 'react-icons/fi';


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
  contributor_name: string | null;
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

const EditorArticlesPage: React.FC = () => {
  const { user, loading: authLoading, supabase } = useSupabase();
  const { user: cmsUser, loading: cmsLoading, isEditor } = useCMSAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [publicationModal, setPublicationModal] = useState(false);
  const [displayLocationModal, setDisplayLocationModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [featuredModal, setFeaturedModal] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Check if user has required permissions based on role
  // Editors and admins can manage articles
  const canManageArticles = isEditor() || cmsUser?.role === 'admin';
  const canDeleteArticles = isEditor() || cmsUser?.role === 'admin'; // Both editors and admins can delete their own content
  
  // Combined loading state
  const isLoading = authLoading || loading;
  
  // Debouncing refs
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Set up real-time sync for article changes
  useRealtimeArticles({
    enabled: !!user && !isLoading && !!cmsUser,
    onArticleChange: () => {
      console.log('Article change detected, refreshing editor articles...');
      debouncedFetchArticles();
    }
  });

  const fetchArticles = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping');
      return;
    }

    // Check if user has permission to manage articles
    // Wait for auth to complete before checking permissions
    if (cmsLoading || authLoading) {
      return;
    }
    
    if (!canManageArticles) {
      console.error('User does not have permission to manage articles');
      toast.error('You do not have permission to manage articles');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      console.log('=== EDITOR ARTICLES FETCH ===');
      
      // Get session from Supabase
      console.log('Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session result:', { session: !!session, userId: session?.user?.id });
      
      if (!session) {
        console.error('No active session found');
        throw new Error('No active session');
      }

      if (!cmsUser) {
        console.error('No CMS user found');
        throw new Error('CMS authentication required');
      }
      
      console.log('Making API request to /api/editor/articles...');
      console.log('Session access token:', session.access_token ? 'Present' : 'Missing');
      console.log('CMS User role:', cmsUser.role);
      
      let url = '/api/editor/articles';
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      console.log('Making request to:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        console.error('Articles API error:', response.status, responseText);
        throw new Error(`Failed to fetch articles: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed data:', data);
      setArticles(data.data?.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [filter, searchTerm, supabase.auth, canManageArticles, cmsUser, authLoading, cmsLoading]);

  const debouncedFetchArticles = useCallback(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Set new timeout for 500ms
    fetchTimeoutRef.current = setTimeout(() => {
      fetchArticles();
    }, 500);
  }, [fetchArticles]);

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
    if (user && !authLoading) {
      debouncedFetchArticles();
      fetchCategories();
    }
    
    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      isFetchingRef.current = false;
    };
  }, [user, authLoading, filter, searchTerm, debouncedFetchArticles, fetchCategories]);

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
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
      
      console.log('DELETE request to:', `/api/editor/articles/${articleId}`);
      const response = await fetch(`/api/editor/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Article deleted successfully');
        fetchArticles();
      } else {
        const errorData = await response.json();
        toast.error(errorData?.error?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      setIsUpdating(true);
      
      // Get token from session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const token = session.access_token;
      
      // Use Admin API for consistent behavior
      const response = await fetch(`/api/editor/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Article status changed to ${newStatus}`);
        fetchArticles();
        setPublicationModal(false);
        setSelectedArticle(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData?.error?.message || 'Failed to update article status');
      }
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch(`/api/admin/articles/${articleId}/display-location`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!cmsUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You must be authenticated to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/auth/sign-in'}
              className="bg-golden text-navy font-semibold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isEditor()) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You must be an editor or admin to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/admin'}
              className="bg-golden text-navy font-semibold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Create Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-navy mb-2">My Articles</h1>
                <p className="text-gray-600">Manage and edit your articles</p>
              </div>
              <Link
                href="/editor/create"
                className="bg-golden text-navy font-semibold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors duration-200 inline-flex items-center"
              >
                <FiEdit2 className="mr-2" />
                Create New Article
              </Link>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
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
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter */}
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
          </motion.div>

          {/* Articles List */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <motion.div
                  key={article.id}
                  variants={itemVariants}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-navy">{article.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(article.status)}`}>
                          {article.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FiUser className="mr-1" />
                          {article.contributor_name && article.contributor_name.trim() 
                            ? article.contributor_name 
                            : article.author_name || 'Unknown'}
                        </div>
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
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                      <div className="flex items-center space-x-2 mr-2">
                        {article.status === 'published' && article.slug && article.slug.trim() ? (
                          <Link 
                            href={`/articles/${article.slug}`}
                            className="p-2 text-gray-600 hover:text-navy transition-colors bg-gray-50 rounded-lg"
                          >
                            <FiEye className="text-xl" />
                          </Link>
                        ) : article.status === 'published' ? (
                          <button className="p-2 text-gray-400 cursor-not-allowed bg-gray-50 rounded-lg" disabled>
                            <FiEye className="text-xl" />
                          </button>
                        ) : null}
                        <Link 
                          href={`/editor/${article.id}/edit`}
                          className="p-2 text-gray-600 hover:text-navy transition-colors bg-gray-50 rounded-lg"
                        >
                          <FiEdit2 className="text-xl" />
                        </Link>
                        {canDeleteArticles && (
                          <CMSButton
                            onClick={() => handleDelete(article.id)}
                            permission="delete:own_content"
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors bg-gray-50 rounded-lg"
                            fallback={
                              <div className="p-2 text-gray-400 cursor-not-allowed bg-gray-50 rounded-lg">
                                <FiTrash2 className="text-xl" />
                              </div>
                            }
                          >
                            <FiTrash2 className="text-xl" />
                          </CMSButton>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setCategoryModal(true);
                          }}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium"
                        >
                          Category
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setDisplayLocationModal(true);
                          }}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-xs font-medium"
                        >
                          Display
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setFeaturedModal(true);
                          }}
                          className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors duration-200 text-xs font-medium"
                        >
                          Featured
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setPublicationModal(true);
                          }}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium"
                        >
                          Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg shadow-lg p-12 text-center"
              >
                <div className="text-gray-400 mb-4">
                  <FiEdit2 className="text-5xl mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-navy mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first article'}
                </p>
                {!searchTerm && (
                  <Link 
                    href="/editor/create"
                    className="bg-golden text-navy font-semibold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors duration-200 inline-block"
                  >
                    Create Your First Article
                  </Link>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Publication Settings Modal (Combined Status + Settings) */}
        {publicationModal && selectedArticle && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setPublicationModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Publication Settings</h3>
              
              <div className="space-y-6">
                {/* Status Section */}
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <div className="flex gap-2">
                    {(['draft', 'published', 'archived'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedArticle.id, status)}
                        disabled={status === selectedArticle.status || isUpdating}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center ${
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
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings Toggles */}
                <div>
                  <h4 className="font-semibold mb-2">Options</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'allow_comments', label: 'Allow Comments' },
                      { key: 'moderate_comments', label: 'Moderate Comments' },
                      { key: 'notify_on_publish', label: 'Notify Subscribers' },
                      { key: 'content_warning', label: 'Content Warning' },
                      { key: 'age_restriction', label: 'Age Restricted (18+)' },
                      { key: 'is_premium', label: 'Premium Content' }
                    ].map((setting) => (
                      <label key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <span className="text-gray-700">{setting.label}</span>
                        <input
                          type="checkbox"
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          checked={(selectedArticle as any)[setting.key]}
                          onChange={(e) => handlePublicationSettings(selectedArticle.id, {
                            ...selectedArticle,
                            [setting.key]: e.target.checked
                          })}
                          disabled={isUpdating}
                          className="w-5 h-5 text-golden rounded border-gray-300 focus:ring-golden"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setPublicationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Close
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
              <h3 className="text-xl font-bold text-navy mb-4">Display Location</h3>
              <p className="text-gray-600 mb-6">Choose where this article should appear on the site.</p>
              
              <div className="space-y-2">
                {[
                   { id: 'homepage', label: 'Homepage Only', desc: 'Featured on the main landing page' },
                   { id: 'category_page', label: 'Category Page Only', desc: 'Visible in its specific category section' },
                   { id: 'both', label: 'Both Locations', desc: 'Visible everywhere (Recommended)' },
                   { id: 'none', label: 'Hidden', desc: 'Accessible via direct link only' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDisplayLocationChange(selectedArticle.id, option.id as Article['display_location'])}
                    disabled={isUpdating}
                    className={`w-full text-left p-4 rounded-lg transition-colors duration-200 border ${
                       selectedArticle.display_location === option.id
                        ? 'border-golden bg-yellow-50'
                        : 'border-gray-200 hover:border-golden hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${selectedArticle.display_location === option.id ? 'text-navy' : 'text-gray-900'}`}>{option.label}</span>
                      {selectedArticle.display_location === option.id && <FiCheck className="text-golden" />}
                    </div>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDisplayLocationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Category Modal */}
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
              <h3 className="text-xl font-bold text-navy mb-4">Set Category</h3>
              
              <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                <button
                  onClick={() => handleCategoryChange(selectedArticle.id, null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                    !selectedArticle.category_id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span>Uncategorized</span>
                  {!selectedArticle.category_id && <FiCheck />}
                </button>
                
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(selectedArticle.id, category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                      selectedArticle.category_id === category.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>{category.name}</span>
                    {selectedArticle.category_id === category.id && <FiCheck />}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setCategoryModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Featured Modal */}
        {featuredModal && selectedArticle && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setFeaturedModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="mb-4 text-yellow-500 flex justify-center">
                 <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">
                {selectedArticle.is_featured ? 'Remove from Featured?' : 'Make Featured Article?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedArticle.is_featured 
                  ? 'This article will no longer appear in the featured section.' 
                  : 'This article will be pinned to the featured section on the homepage and category pages.'}
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setFeaturedModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFeaturedToggle(selectedArticle.id, !selectedArticle.is_featured)}
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
                    selectedArticle.is_featured
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {isUpdating ? 'Updating...' : selectedArticle.is_featured ? 'Remove Featured' : 'Make Featured'}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </div>
    </Layout>
  );
};

export default EditorArticlesPage;
