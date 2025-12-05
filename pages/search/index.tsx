import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiSearch, FiUser, FiCalendar, FiEye, FiHeart, FiMessageCircle, FiFileText, FiBookmark } from 'react-icons/fi';

interface SearchResult {
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featured_image?: string;
    published_at: string;
    author: {
      name: string;
      avatar_url?: string;
    };
    category?: {
      id: string;
      name: string;
      slug: string;
      color: string;
    };
    comments_count: number;
    likes_count: number;
    views_count: number;
    bookmarks_count: number;
  }>;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      name: string;
      avatar_url?: string;
    };
    article: {
      title: string;
      slug: string;
    };
  }>;
  users: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    bio?: string;
    role: string;
    created_at: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
  };
}

const SearchResults: React.FC = () => {
  const router = useRouter();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'comments' | 'users'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const { q, category: cat } = router.query;
    if (q && typeof q === 'string') {
      setSearchQuery(q);
      if (cat && typeof cat === 'string') {
        setCategory(cat);
      }
      performSearch(q as string, 'all', cat as string);
    }
  }, [router.query]);

  const performSearch = async (query: string, type: 'all' | 'articles' | 'comments' | 'users' = 'all', cat: string = '') => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        q: query.trim(),
        type,
        page: '1',
        limit: '10',
      });
      
      if (cat) {
        params.append('category', cat);
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${category ? `&category=${category}` : ''}`);
      performSearch(searchQuery.trim(), activeTab, category);
    }
  };

  const handleTabChange = (tab: 'all' | 'articles' | 'comments' | 'users') => {
    setActiveTab(tab);
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim(), tab, category);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-navy text-white py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-6">Search Results</h1>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="max-w-2xl">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles and comments..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent text-navy"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-golden text-navy rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Results Summary */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Found {results.pagination.totalResults} results for &quot;{searchQuery}&quot;
                </p>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-lg mb-6">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => handleTabChange('all')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                      activeTab === 'all'
                        ? 'text-golden border-b-2 border-golden'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    All Results ({results.articles.length + results.comments.length + results.users.length})
                  </button>
                  <button
                    onClick={() => handleTabChange('articles')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                      activeTab === 'articles'
                        ? 'text-golden border-b-2 border-golden'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Articles ({results.articles.length})
                  </button>
                  <button
                    onClick={() => handleTabChange('comments')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                      activeTab === 'comments'
                        ? 'text-golden border-b-2 border-golden'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Comments ({results.comments.length})
                  </button>
                  <button
                    onClick={() => handleTabChange('users')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${
                      activeTab === 'users'
                        ? 'text-golden border-b-2 border-golden'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Users ({results.users.length})
                  </button>
                </div>
              </div>

              {/* Results Content */}
              <div className="space-y-6">
                {/* Articles */}
                {(activeTab === 'all' || activeTab === 'articles') && results.articles.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-navy mb-4 flex items-center">
                      <FiFileText className="w-5 h-5 mr-2" />
                      Articles
                    </h3>
                    <div className="space-y-4">
                      {results.articles.map((article) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white rounded-xl shadow-lg p-6"
                        >
                          <Link href={article.slug && article.slug.trim() ? `/articles/${article.slug}` : '#'} className="block">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-xl font-bold text-navy hover:text-blue-600 transition-colors duration-200">
                                {highlightText(article.title, searchQuery)}
                              </h4>
                              {article.category && (
                                <span 
                                  className="px-2 py-1 text-xs font-medium rounded-full"
                                  style={{ 
                                    backgroundColor: `${article.category.color}20`,
                                    color: article.category.color 
                                  }}
                                >
                                  {article.category.name}
                                </span>
                              )}
                            </div>
                          </Link>
                          
                          {article.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {highlightText(article.excerpt, searchQuery)}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                {article.author.avatar_url ? (
                                  <Image 
                                    src={article.author.avatar_url} 
                                    alt={article.author.name}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full mr-2"
                                    unoptimized
                                  />
                                ) : (
                                  <FiUser className="w-4 h-4 mr-1" />
                                )}
                                {article.author.name}
                              </div>
                              <div className="flex items-center">
                                <FiCalendar className="w-4 h-4 mr-1" />
                                {formatDate(article.published_at)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <FiEye className="w-4 h-4 mr-1" />
                                {article.views_count}
                              </div>
                              <div className="flex items-center">
                                <FiHeart className="w-4 h-4 mr-1" />
                                {article.likes_count}
                              </div>
                              <div className="flex items-center">
                                <FiMessageCircle className="w-4 h-4 mr-1" />
                                {article.comments_count}
                              </div>
                              <div className="flex items-center">
                                <FiBookmark className="w-4 h-4 mr-1" />
                                {article.bookmarks_count}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {(activeTab === 'all' || activeTab === 'comments') && results.comments.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-navy mb-4 flex items-center">
                      <FiMessageCircle className="w-5 h-5 mr-2" />
                      Comments
                    </h3>
                    <div className="space-y-4">
                      {results.comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white rounded-xl shadow-lg p-6"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              {comment.user.avatar_url ? (
                                <Image
                                  src={comment.user.avatar_url}
                                  alt={comment.user.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-full"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <FiUser className="w-5 h-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="font-semibold text-navy">{comment.user.name}</span>
                                  <span className="text-gray-500 text-sm ml-2">
                                    commented on
                                  </span>
                                  <Link href={comment.article.slug && comment.article.slug.trim() ? `/articles/${comment.article.slug}` : '#'} className="text-blue-600 hover:text-blue-800 ml-1">
                                    {comment.article.title}
                                  </Link>
                                </div>
                                <span className="text-gray-500 text-sm">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700">
                                {highlightText(comment.content, searchQuery)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-navy mb-4 flex items-center">
                      <FiUser className="w-5 h-5 mr-2" />
                      Users
                    </h3>
                    <div className="space-y-4">
                      {results.users.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white rounded-xl shadow-lg p-6"
                        >
                          <div className="flex items-start space-x-4">
                            {user.avatar_url ? (
                              <Image 
                                src={user.avatar_url} 
                                alt={user.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full"
                                unoptimized
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <FiUser className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-navy mb-1">
                                {highlightText(user.name, searchQuery)}
                              </h4>
                              <p className="text-sm text-gray-500 mb-2">
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)} • Joined {formatDate(user.created_at)}
                              </p>
                              {user.bio && (
                                <p className="text-gray-600 line-clamp-2">
                                  {highlightText(user.bio, searchQuery)}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {results.articles.length === 0 && results.comments.length === 0 && results.users.length === 0 && (
                  <div className="text-center py-12">
                    <FiSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or browse our articles.
                    </p>
                    <Link href="/articles" className="inline-block mt-4 bg-golden text-navy px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200">
                      Browse Articles
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchResults;
