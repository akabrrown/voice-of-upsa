import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LayoutSupabase from '@/components/LayoutSupabase';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiCalendar, FiUser, FiEye } from 'react-icons/fi';
import { useApi } from '@/lib/api-client';
import { ArticlesApi, Article } from '@/lib/api/articles-api';
import { useSupabase } from '@/components/SupabaseProvider';
import AdDisplay from '@/components/AdDisplay';

// Type that matches the data payload structure from the API
type ArticlesListData = {
  articles: Article[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalArticles: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const HomePage: React.FC = () => {
  const { session, supabase } = useSupabase();
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [latestNews, setLatestNews] = useState<Article[]>([]);
  const [isAdmin, setIsAdmin] = useState(false); // Represents admin OR editor access
  
  // Use the modern API client
  const { loading, execute } = useApi<ArticlesListData>();

  // Check if user is admin or editor
  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const userRole = data.data?.profile?.role || data.role;
            setIsAdmin(userRole === 'admin' || userRole === 'editor');
          } else {
            // If any error occurs, just set isAdmin to false and don't retry
            console.log('Profile check failed, user is not admin/editor');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkUserRole();
  }, [session]);

  // Real-time subscription for article updates
  useEffect(() => {
    // Subscribe to real-time changes on articles table
    const subscription = supabase
      .channel('articles_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'articles',
          filter: 'status=eq.published' // Only listen to published articles
        },
        (payload) => {
          console.log('Real-time article change:', payload);
          
          // Refresh articles when there's a change
          execute(
            () => ArticlesApi.getArticles({ limit: 20, status: 'published' }),
            (data: ArticlesListData) => {
              if (data && data.articles && data.articles.length > 0) {
                const featured = data.articles.filter(article => article.is_featured);
                const regular = data.articles.filter(article => !article.is_featured);
                
                setFeaturedArticles(featured);
                setLatestNews(regular);
                
                // Show a subtle notification for new articles
                if (payload.eventType === 'INSERT') {
                  toast.success('New article published!');
                }
              }
            },
            () => {
              console.error('Failed to refresh articles after real-time update');
            }
          );
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [execute, supabase]);

  // Initial data fetch
  useEffect(() => {
    execute(
      () => ArticlesApi.getArticles({ limit: 20, status: 'published' }),
      (data: ArticlesListData) => {
        console.log('Homepage: Received articles data:', data);
        if (data && data.articles && data.articles.length > 0) {
          // Separate featured articles from regular articles
          const featured = data.articles.filter(article => article.is_featured);
          const regular = data.articles.filter(article => !article.is_featured);
          
          console.log('Homepage: Featured articles:', featured.length, featured);
          console.log('Homepage: Regular articles:', regular.length);
          
          setFeaturedArticles(featured);
          setLatestNews(regular);
        }
      },
      () => {
        toast.error('Failed to load articles');
        console.error('Articles fetch error occurred');
      }
    );
  }, [execute]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      execute(
        () => ArticlesApi.getArticles({ limit: 20, status: 'published' }),
        (data: ArticlesListData) => {
          if (data && data.articles && data.articles.length > 0) {
            // Separate featured articles from regular articles
            const featured = data.articles.filter(article => article.is_featured);
            const regular = data.articles.filter(article => !article.is_featured);
            
            setFeaturedArticles(featured);
            setLatestNews(regular);
          }
        },
        () => {
          toast.error('Failed to refresh articles');
        }
      );
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [execute]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  return (
    <LayoutSupabase>
      <div className="min-h-screen bg-gray-50">
        {/* Featured Articles */}
        {loading && featuredArticles.length === 0 ? (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-64 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </section>
        ) : featuredArticles.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-2xl lg:text-3xl font-bold text-navy mb-6 sm:mb-8">Featured Articles</h2>
                <div className={featuredArticles.length === 1 ? "w-full" : "grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"}>
                  {featuredArticles.map((article) => (
                    <Link key={article.id} href={article.slug && article.slug.trim() ? `/articles/${article.slug}` : '#'} className="block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                      <div className="md:flex">
                        <div className="md:w-1/2">
                          {article.featured_image ? (
                            <Image
                              src={article.featured_image}
                              alt={article.title}
                              width={400}
                              height={256}
                              className="w-full h-64 md:h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">No image available</span>
                            </div>
                          )}
                        </div>
                        <div className="md:w-1/2 p-6 sm:p-8">
                          <div className="flex items-center space-x-4 mb-4">
                            <span className="bg-golden text-navy px-3 py-1 rounded-full text-sm font-semibold">
                              Featured
                            </span>
                            <div className="flex items-center text-gray-500 text-sm">
                              <FiCalendar className="mr-1" />
                              {formatDate(article.published_at)}
                            </div>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-navy mb-4 hover:text-golden transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 mb-6 line-clamp-3">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {article.author?.avatar_url ? (
                                <Image
                                  src={article.author?.avatar_url}
                                  alt={article.contributor_name && article.contributor_name.trim() ? article.contributor_name : article.author?.name || 'Author'}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <FiUser className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              <span className="text-sm text-gray-600">
                                {article.contributor_name && article.contributor_name.trim() 
                                  ? article.contributor_name 
                                  : article.author?.name || 'Unknown Author'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-gray-500 text-sm">
                              {/* Only show view count to admins and editors */}
                              {isAdmin && (
                                <div className="flex items-center">
                                  <FiEye className="mr-1" />
                                  {article.views_count || 0}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Banner Ad */}
        <section className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AdDisplay adType="banner" className="w-full" />
          </div>
        </section>

        {/* Sponsored Content Section */}
        <section className="py-8 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-navy mb-2">Sponsored Content</h2>
              <p className="text-gray-600">Support our partners who make this platform possible</p>
            </div>
            <AdDisplay adType="sponsored-content" className="w-full" />
          </div>
        </section>

        {/* Latest News */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-between items-center mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-navy">Latest News</h2>
              <Link 
                href="/articles"
                className="bg-golden text-navy px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-yellow-400 transition-colors duration-200 whitespace-nowrap"
              >
                View All
              </Link>
            </motion.div>

            {loading && latestNews.length === 0 ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="h-48 bg-gray-300"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : latestNews.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {latestNews.map((article: Article, index: number) => (
                  <motion.div
                    key={article.id}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={article.slug && article.slug.trim() ? `/articles/${article.slug}` : '#'} className="block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                      {article.featured_image ? (
                        <Image
                          src={article.featured_image}
                          alt={article.title}
                          width={400}
                          height={192}
                          className="w-full h-48 object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image available</span>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center text-gray-500 text-sm mb-3">
                          <FiCalendar className="mr-1" />
                          {formatDate(article.published_at)}
                        </div>
                        <h3 className="text-xl font-bold text-navy mb-3 hover:text-golden transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {article.author?.avatar_url ? (
                              <Image
                                src={article.author?.avatar_url}
                                alt={article.contributor_name && article.contributor_name.trim() ? article.contributor_name : article.author?.name || 'Author'}
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
                                : article.author?.name || 'Unknown Author'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-500 text-sm">
                            {/* Only show view count to admins and editors */}
                            {isAdmin && (
                              <div className="flex items-center">
                                <FiEye className="mr-1" />
                                {article.views_count}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : loading ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="h-48 bg-gray-300"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No articles available yet.</p>
                <p className="text-gray-400">Check back soon for the latest UPSA news!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </LayoutSupabase>
  );
};

export default HomePage;
