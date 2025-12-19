import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import Layout from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEye } from 'react-icons/fi';

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
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: 'draft' | 'published';
  author: {
    name: string;
  };
}

const EditArticlePage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [article, setArticle] = useState<Article>({
    id: '',
    title: '',
    content: '',
    excerpt: '',
    featured_image: null,
    status: 'draft',
    author: { name: '' }
  });

  const fetchArticle = useCallback(async () => {
    try {
      setFetching(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch(`/api/editor/articles/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch article');
      }

      setArticle(data.article);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      router.push('/admin/dashboard');
    } finally {
      setFetching(false);
    }
  }, [supabase, id, router]);

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (id && typeof id === 'string') {
      fetchArticle();
    }
  }, [user, id, fetchArticle, router]);

  const handleInputChange = (field: keyof Article, value: string | null) => {
    setArticle(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (url: string | null) => {
    handleInputChange('featured_image', url);
  };

  const handleImageRemove = () => {
    handleInputChange('featured_image', null);
  };

  const generateExcerpt = () => {
    if (article.content) {
      const excerpt = article.content
        .replace(/[#*`]/g, '')
        .split('\n')
        .find(line => line.trim().length > 0)
        ?.substring(0, 150) || '';
      
      handleInputChange('excerpt', excerpt + (excerpt.length >= 150 ? '...' : ''));
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!article.title.trim() || !article.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const articleData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        featured_image: article.featured_image,
        status: publish ? 'published' : 'draft'
      };

      const response = await fetch(`/api/editor/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(articleData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update article');
      }

      toast.success(`Article ${publish ? 'published' : 'updated'} successfully`);
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    return (
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-navy mb-4">{article.title}</h1>
        
        {article.featured_image && (
          <NextImage 
            src={article.featured_image} 
            alt="Featured" 
            width={800}
            height={256}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}
        
        {article.excerpt && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6 italic">
            {article.excerpt}
          </div>
        )}
        
        <div className="whitespace-pre-wrap">{article.content}</div>
      </div>
    );
  };

  const renderEditor = () => {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={article.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
            placeholder="Enter article title..."
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image
          </label>
          <ImageUpload
            value={article.featured_image || undefined}
            onChange={handleImageChange}
            onRemove={handleImageRemove}
          />
        </div>

        {/* Excerpt */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Excerpt
            </label>
            <button
              onClick={generateExcerpt}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Generate from content
            </button>
          </div>
          <textarea
            value={article.excerpt}
            onChange={(e) => handleInputChange('excerpt', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
            placeholder="Brief description of the article..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={article.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent font-mono"
            placeholder="Write your article content here..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Supports Markdown formatting
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="draft"
                checked={article.status === 'draft'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Draft</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="published"
                checked={article.status === 'published'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Published</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  if (!user || fetching) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto mb-4"></div>
            <p className="text-gray-600">Loading article...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-navy text-white py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <NextLink href="/admin/dashboard">
                  <button className="flex items-center text-white hover:text-gray-300">
                    <FiArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                  </button>
                </NextLink>
                <h1 className="text-2xl font-bold">Edit Article</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    previewMode
                      ? 'bg-golden text-navy'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <FiEye className="inline mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            {previewMode ? renderPreview() : renderEditor()}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {article.status === 'draft' ? 'Draft will not be visible to public' : 'Article will be visible to public'}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={loading}
                  className="px-6 py-2 bg-golden text-navy rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>
    </Layout>
  );
};

export default EditArticlePage;
