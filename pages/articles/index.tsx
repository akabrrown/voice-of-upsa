import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiCalendar, FiUser, FiEye, FiMessageCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useSupabase } from '@/components/SupabaseProvider';


// Type assertions for Next.js components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextLink = Link as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextImage = Image as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  contributor_name?: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  views_count: number;
  likes_count: number;
  comments_count: number;
  published_at: string;
  updated_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalArticles: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const ArticlesPage: React.FC = () => {
  const { supabase, session } = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (response.ok) {
        const fetchedCategories = data.categories || data.data?.categories || [];
        setCategories([{ id: 'all', name: 'All Articles', slug: 'all' }, ...fetchedCategories]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to hardcoded categories if API fails
      setCategories([
        { id: 'all', name: 'All Articles', slug: 'all' },
        { id: 'news', name: 'News', slug: 'news' },
        { id: 'announcements', name: 'Announcements', slug: 'announcements' },
        { id: 'events', name: 'Events', slug: 'events' },
        { id: 'opinions', name: 'Opinions', slug: 'opinions' },
        { id: 'features', name: 'Features', slug: 'features' },
        { id: 'sports', name: 'Sports', slug: 'sports' },
      ]);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        status: 'published',
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      if (selectedCategory !== 'all') {
        // Find the category slug and use it for filtering
        const category = categories.find(c => c.id === selectedCategory);
        if (category && category.slug !== 'all') {
          params.append('category', category.slug);
        }
      }

      const response = await fetch(`/api/articles?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch articles');
      }

      setArticles(data.data?.articles || data.articles || []);
      setPagination(data.data?.pagination || data.pagination);
      
      // Debug: Log the first article to check featured_image
      if (data.data?.articles?.[0] || data.articles?.[0]) {
        const firstArticle = data.data?.articles?.[0] || data.articles?.[0];
        console.log('First article data:', firstArticle);
        console.log('Featured image:', firstArticle.featured_image);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, categories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Real-time subscription for article updates
  useEffect(() => {
    // Subscribe to real-time changes on articles table
    const subscription = supabase
      .channel('articles_changes_list')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'articles',
          filter: 'status=eq.published' // Only listen to published articles
        },
        (payload) => {
          console.log('Real-time article change in list:', payload);
          
          // Refresh articles when there's a change
          fetchArticles();
          
          // Show a subtle notification for new articles
          if (payload.eventType === 'INSERT') {
            toast.success('New article published!');
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchArticles, supabase]);

  // Real-time subscription for article changes
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('articles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'articles',
        },
        (payload) => {
          console.log('Article change detected:', payload);
          
          // Refresh articles when any change occurs
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            // Simply refresh the articles list to get the latest data
            fetchArticles();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  if (loading && articles.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="h-12 bg-gray-300 rounded w-full mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="h-80 bg-gray-300 rounded-xl"></div>
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
        {/* Search and Filters */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Search and Filter Row */}
            <div className="flex items-center justify-between mb-4">
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                  />
                </div>
              </form>
              
              <button
                onClick={() => {
                  // Toggle filter visibility or reset filters
                  setSelectedCategory('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="ml-4 p-2 text-gray-500 hover:text-golden hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Clear all filters"
              >
                <FiFilter className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Row */}
            <div className="flex items-start space-x-2">
              <div className="flex flex-wrap gap-2 flex-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${selectedCategory === category.id
                        ? 'bg-golden text-navy'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {articles.length > 0 ? (
            <>
              <MotionDiv
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {articles.map((article, index) => (
                  <MotionDiv
                    key={article.id}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    {article.slug && article.slug.trim() ? (
                      <NextLink href={`/articles/${article.slug}`} className="block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
                        {/* Featured Image */}
                        {(() => {
                          console.log('Rendering article:', article.title, 'featured_image:', article.featured_image);
                          return article.featured_image ? (
                            <div className="relative h-48 overflow-hidden">
                              <NextImage
                                src={article.featured_image}
                                alt={article.title}
                                width={400}
                                height={192}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => console.error('Image load error:', e)}
                                onLoad={() => console.log('Image loaded successfully:', article.featured_image)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">No image available</span>
                            </div>
                          );
                        })()}

                        {/* Content */}
                        <div className="p-6">
                          <div className="flex items-center text-gray-500 text-sm mb-3">
                            <FiCalendar className="mr-1" />
                            <span>{formatDate(article.published_at)}</span>
                          </div>

                          <h3 className="text-xl font-bold text-navy mb-3 hover:text-golden transition-colors duration-200 line-clamp-2 group-hover:text-golden">
                            {article.title}
                          </h3>

                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {article.excerpt}
                          </p>

                          {/* Author and Stats */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {article.author.avatar_url ? (
                                <NextImage
                                  src={article.author.avatar_url}
                                  alt={article.contributor_name && article.contributor_name.trim() ? article.contributor_name : article.author.name}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 rounded-full"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                  <FiUser className="w-3 h-3 text-gray-600" />
                                </div>
                              )}
                              <span className="text-sm text-gray-600">
                                {article.contributor_name && article.contributor_name.trim() 
                                  ? article.contributor_name 
                                  : article.author.name}
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 text-gray-500 text-sm">
                              {/* Only show view count to admins and editors */}
                              {isAdmin && (
                                <div className="flex items-center">
                                  <FiEye className="mr-1" />
                                  <span>{article.views_count}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <FiMessageCircle className="mr-1" />
                                <span>{article.comments_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </NextLink>
                    ) : (
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer group opacity-75">
                        <div className="p-6">
                          <div className="text-center">
                            <h3 className="text-xl font-bold text-navy mb-2">{article.title}</h3>
                            <p className="text-gray-500 text-sm">Article not available</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </MotionDiv>
                ))}
              </MotionDiv>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-12 flex justify-center"
                >
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${page === currentPage
                              ? 'bg-golden text-navy'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </MotionDiv>
              )}

              {/* Results Info */}
              {pagination && (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-8 text-center text-gray-600"
                >
                  <p>
                    Showing {articles.length} of {pagination.totalArticles} articles
                    {searchTerm && ` for "${searchTerm}"`}
                    {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                  </p>
                </MotionDiv>
              )}
            </>
          ) : (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Check back soon for the latest UPSA news!'}
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className="bg-golden text-navy px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </MotionDiv>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ArticlesPage;
