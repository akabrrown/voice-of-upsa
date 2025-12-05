import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiSearch, FiCalendar, FiEye, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';

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
}

const EditorArticlesPage: React.FC = () => {
  const { user, loading: authLoading, supabase } = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      let url = '/api/admin/articles';
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
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.data?.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, searchTerm]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchArticles();
    }
  }, [user, authLoading, filter, searchTerm, fetchArticles]);

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
      
      const response = await fetch(`/api/articles/${articleId}`, {
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

  if (authLoading || loading) {
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                      {article.status === 'published' && article.slug && article.slug.trim() ? (
                        <Link 
                          href={`/articles/${article.slug}`}
                          className="p-2 text-gray-600 hover:text-navy transition-colors inline-block"
                        >
                          <FiEye className="text-xl" />
                        </Link>
                      ) : article.status === 'published' ? (
                        <button className="p-2 text-gray-400 cursor-not-allowed" disabled>
                          <FiEye className="text-xl" />
                        </button>
                      ) : null}
                      <Link 
                        href={`/editor/${article.id}/edit`}
                        className="p-2 text-gray-600 hover:text-navy transition-colors inline-block"
                      >
                        <FiEdit2 className="text-xl" />
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="text-xl" />
                      </button>
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
      </div>
    </Layout>
  );
};

export default EditorArticlesPage;
