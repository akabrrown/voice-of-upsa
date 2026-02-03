import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiCalendar, FiEye, FiMessageCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useSupabase } from '@/components/SupabaseProvider';
import AdDisplay from '@/components/AdDisplay';
import useSWR, { preload } from 'swr';

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('An error occurred while fetching the data.');
  return res.json();
});

// Type assertions for Next.js components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextLink = Link as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextImage = Image as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  contributor_name?: string;
  author: Author | null | string; // Can be Author object or 'Anonymous' string
  categories?: Category | null;
  published_at: string;
  created_at: string;
  reading_time?: number;
  likes_count?: number;
  views_count?: number;
  comments_count?: number;
  status?: string;
  is_featured?: boolean;
  featured_order?: number;
  featured_until?: string | null;
  isAnonymous?: boolean;
}

// Constants moved outside the component for stable references
const EMPTY_CATEGORIES: Category[] = [];

const ArticlesPage: React.FC = () => {
  const router = useRouter();
  const { supabase, session } = useSupabase();

  const prefetchArticle = useCallback((slug: string) => {
    preload(`/api/articles/${slug}`, fetcher);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  // Categories Fetching with SWR
  const { data: categoriesData } = useSWR('/api/categories', fetcher);
  const fetchedCategories = useMemo(() => categoriesData?.data?.categories || EMPTY_CATEGORIES, [categoriesData]);

  const categories = useMemo(() => {
    return [
      { id: 'all', name: 'All Articles', slug: 'all' },
      { id: 'anonymous', name: 'Anonymous', slug: 'anonymous' },
      ...fetchedCategories
    ];
  }, [fetchedCategories]);

  // Article Fetching with SWR
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: '1000',
    status: 'published',
  });

  if (searchTerm.trim()) {
    queryParams.append('search', searchTerm.trim());
  }

  // Handle category filtering
  const activeCategory = categories.find(c => c.id === selectedCategory);
  if (selectedCategory !== 'all' && selectedCategory !== 'anonymous' && activeCategory && activeCategory.slug !== 'all') {
    queryParams.append('category', activeCategory.slug);
  }

  // SWR Key - Changes when filters/page change
  const swrKey = selectedCategory === 'anonymous' 
    ? '/api/anonymous-stories/get-approved' 
    : `/api/articles?${queryParams.toString()}`;

  const { data: fetchResult, error: fetchError, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });

  // Transform Data Logic
  const { articles, pagination } = React.useMemo(() => {
    if (!fetchResult) return { articles: [], pagination: null };

    if (selectedCategory === 'anonymous') {
      // Handle different response formats from the anonymous stories API
      // API can return: { success: true, data: [...] } or just the data array
      let anonData = [];
      if (Array.isArray(fetchResult.data)) {
        anonData = fetchResult.data;
      } else if (Array.isArray(fetchResult)) {
        anonData = fetchResult;
      }
      
      const transformed = anonData.map((story: AnonymousStory) => ({
        ...story,
        isAnonymous: true,
        slug: story.id,
        excerpt: story.content.substring(0, 200) + '...',
        featured_image: null,
        author: 'Anonymous',
        published_at: story.created_at,
        reading_time: Math.ceil(story.content.length / 1000)
      }));
      return {
        articles: transformed,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalArticles: transformed.length,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }

    const resData = fetchResult.data || fetchResult;
    const articlesData = resData.articles || [];
    const pag = resData.pagination;

    return {
      articles: articlesData,
      pagination: pag ? {
        currentPage: pag.page || currentPage,
        totalPages: pag.totalPages || 0,
        totalArticles: pag.total || 0,
        hasNextPage: (pag.page || currentPage) < (pag.totalPages || 0),
        hasPreviousPage: (pag.page || currentPage) > 1
      } : null
    };
  }, [fetchResult, selectedCategory, currentPage]);

  // Loading state mapping
  const loading = isLoading;


  // Sync URL params with state
  useEffect(() => {
    if (!router.isReady || categories.length === 0) return;

    const { category, search, page } = router.query;
    
    // 1. Resolve Category from URL
    let targetCategory = 'all';
    if (category && typeof category === 'string') {
      const found = categories.find(c => c.slug === category);
      targetCategory = found ? found.id : category;
    }

    // 2. Resolve Search from URL
    const targetSearch = (search && typeof search === 'string') ? search : '';

    // 3. Resolve Page from URL
    const targetPage = (page && typeof page === 'string') ? parseInt(page) : 1;

    // 4. Update state if different from URL to avoid unnecessary re-renders
    if (targetCategory !== selectedCategory) {
      setSelectedCategory(targetCategory);
    }
    if (targetSearch !== searchTerm) {
      setSearchTerm(targetSearch);
    }
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [router.isReady, router.query, categories, currentPage, searchTerm, selectedCategory]);

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
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

  // Real-time subscription
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('articles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, () => {
        mutate(); // Re-fetch data via SWR
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, mutate]);

  // Error Toast
  useEffect(() => {
    if (fetchError) {
      toast.error('Failed to load articles');
      console.error('SWR fetch error:', fetchError);
    }
  }, [fetchError]);

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const newQuery = { ...router.query, category: category ? category.slug : undefined, page: '1' };
    if (!category || category.slug === 'all') delete newQuery.category;
    
    // Update local state first for immediate UI response
    setSelectedCategory(categoryId);
    setCurrentPage(1);

    router.push({
      pathname: router.pathname,
      query: newQuery
    }, undefined, { shallow: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();
    
    // Update local state first
    setCurrentPage(1);

    router.push({
      pathname: router.pathname,
      query: { ...router.query, search: trimmedSearch, page: '1' }
    }, undefined, { shallow: true });
  };

  const handlePageChange = (page: number) => {
    // Update state and URL
    setCurrentPage(page);
    
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: page.toString() }
    }, undefined, { shallow: true });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
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
    console.log('Loading state is true, showing loader');
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

        {/* Articles Listing Banner Ad */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdDisplay adType="banner" location="articles_banner" className="w-full" />
          </div>
        </section>

        {/* Articles Grid with Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3">
              {articles.length > 0 ? (
                <div>
                  <MotionDiv
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                      {articles.map((article: Article, index: number) => {
                        if (!article || !article.id) return null;
                        
                        const isLinkable = article.isAnonymous 
                          ? (article.id && article.id.trim() !== '' && !article.id.includes('['))
                          : (article.slug && article.slug.trim() !== '');

                        const href = article.isAnonymous 
                          ? `/anonymous/${article.id}` 
                          : `/articles/${article.slug}`;

                        return (
                          <MotionDiv
                            key={article.id}
                            variants={itemVariants}
                            transition={{ delay: index * 0.1 }}
                          >
                            {isLinkable ? (
                              <NextLink 
                                href={href} 
                                onMouseEnter={() => !article.isAnonymous && prefetchArticle(String(article.slug))}
                                className={`block bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group ${article.is_featured ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
                              >
                                {!article.isAnonymous && article.featured_image ? (
                                  <div className="relative h-48 overflow-hidden">
                                    <NextImage
                                      src={article.featured_image}
                                      alt={article.title}
                                      width={400}
                                      height={192}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                ) : !article.isAnonymous && (
                                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">No image available</span>
                                  </div>
                                )}

                                <div className="p-6">
                                  <div className="flex items-center text-gray-500 text-sm mb-3">
                                    <FiCalendar className="mr-1" />
                                    <span>{formatDate(article.published_at)}</span>
                                    {article.isAnonymous && (
                                      <span className="ml-2 bg-golden/10 text-golden px-2 py-1 rounded-full text-xs">
                                        Anonymous Message
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-xl font-bold text-navy mb-3 group-hover:text-golden transition-colors line-clamp-2">
                                    {article.isAnonymous ? `Anonymous: ${article.title}` : article.title}
                                  </h3>

                                  <p className="text-gray-600 mb-4 line-clamp-3">
                                    {article.excerpt}
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">
                                        {article.isAnonymous ? 'Anonymous' : (
                                          article.contributor_name?.trim() || 
                                          (typeof article.author === 'object' ? article.author?.name : article.author) || 
                                          'Unknown'
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-500 text-sm">
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
                              <div className="bg-white rounded-xl shadow-lg p-6 opacity-75">
                                <h3 className="text-xl font-bold text-navy mb-2">{article.title}</h3>
                                <p className="text-gray-600">Article content currently unavailable.</p>
                              </div>
                            )}
                          </MotionDiv>
                        );
                      })}
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
                              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${page === currentPage ? 'bg-golden text-navy' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
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
                        {searchTerm && (` for "${searchTerm}"`)}
                        {selectedCategory !== 'all' && (` in ${categories.find(c => c.id === selectedCategory)?.name || ''}`)}
                      </p>
                    </MotionDiv>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiMessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                  <p className="text-gray-500">Try adjusting your filters to find what you&apos;re looking for.</p>
                </div>
              )}
            </div>

              <div className="sticky top-24 space-y-6">
                <AdDisplay adType="sidebar" location="articles_sidebar" className="w-full" />
              </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArticlesPage;




