import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import { useCMSAuth } from '@/hooks/useCMSAuth';
import ImageUpload from '@/components/ImageUpload';
import { useFormPersist } from '@/hooks/useFormPersist';
import { FiEye, FiSave } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: 'draft' | 'published' | 'scheduled';
  category_id: string;
  display_location: 'homepage' | 'category_page' | 'both' | 'none';
  contributor_name?: string;
  published_at?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const EditArticlePage: React.FC = () => {
  const { user, loading: authLoading, supabase } = useSupabase();
  const { user: cmsUser, hasPermission, isEditor, loading: cmsLoading } = useCMSAuth();
  const router = useRouter();
  const { id } = router.query;
  
  // Check if user has required permissions
  const canEditArticles = hasPermission('write:content');
  
  // Combined loading state
  const isLoading = authLoading || cmsLoading;
  
  const initialFormData: ArticleFormData = {
    title: '',
    content: '',
    excerpt: '',
    featured_image: null,
    status: 'draft',
    category_id: '',
    display_location: 'category_page',
    contributor_name: ''
  };

  const {
    formData,
    setFormData,
    isRestoring,
    lastSaved: persistLastSaved,
    saveStatus,
    clearSavedData
  } = useFormPersist<ArticleFormData>({
    storageKey: `article-edit-draft-${id}`,
    initialValues: initialFormData,
    debounceMs: 2000,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data?.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Load article data
  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/editor/articles/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Load server data but preserve any unsaved local changes
          const serverData = {
            title: data.article.title,
            content: data.article.content,
            excerpt: data.article.excerpt || '',
            featured_image: data.article.featured_image,
            status: data.article.status,
            category_id: data.article.category_id || '',
            display_location: data.article.display_location || 'category_page',
            contributor_name: data.article.contributor_name || '',
            published_at: data.article.published_at
          };
          
          // Only update if no local changes exist or if user explicitly wants to reload
          setFormData((prev: ArticleFormData) => {
            // If local form has meaningful changes, preserve them
            const hasLocalChanges = 
              prev.title !== initialFormData.title || 
              prev.content !== initialFormData.content ||
              prev.excerpt !== initialFormData.excerpt;
            
            return hasLocalChanges ? prev : serverData;
          });
        } else {
          toast.error(data.error || 'Failed to load article');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to load article');
      }
    } catch (error) {
      console.error('Load article error:', error);
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && user) {
      loadArticle();
    }
  }, [id, user, loadArticle]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }

      const response = await fetch(`/api/editor/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Article updated successfully');
          // Clear saved draft data after successful update
          clearSavedData();
          router.push('/editor/dashboard');
        } else {
          toast.error(data.error || 'Failed to update article');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update article');
      }
    } catch (error) {
      console.error('Update article error:', error);
      toast.error('Failed to update article');
    } finally {
      setSaving(false);
    }
  }, [formData, id, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: ArticleFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (imageUrl: string | null) => {
    setFormData((prev: ArticleFormData) => ({
      ...prev,
      featured_image: imageUrl
    }));
  };

  const handleImageRemove = () => {
    setFormData((prev: ArticleFormData) => ({
      ...prev,
      featured_image: null
    }));
  };


  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy mb-4">Access Denied</h1>
            <p className="text-gray-600">Please sign in to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Authorization checks
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
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
              You must be authenticated to edit articles.
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
              You must be an editor or admin to edit articles.
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

  if (!canEditArticles) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-4">
              You do not have permission to edit articles.
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-navy mb-2">Edit Article</h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-600">Update your article content</p>
                    {saveStatus === 'saving' && (
                      <span className="text-sm text-blue-600 flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                        Saving...
                      </span>
                    )}
                    {saveStatus === 'saved' && persistLastSaved && (
                      <span className="text-sm text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                        Auto-saved {persistLastSaved.toLocaleTimeString()}
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-sm text-red-600 flex items-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                        Save failed
                      </span>
                    )}
                    {isRestoring && (
                      <span className="text-sm text-yellow-600 flex items-center">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse mr-2"></div>
                        Restoring draft...
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setPreview(!preview)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      preview
                        ? 'bg-golden text-navy'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FiEye className="inline mr-2" />
                    {preview ? 'Edit' : 'Preview'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="Enter article title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Location
                    </label>
                    <select
                      name="display_location"
                      value={formData.display_location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    >
                      <option value="homepage">Homepage Only</option>
                      <option value="category_page">Category Page Only</option>
                      <option value="both">Both Homepage and Category Page</option>
                      <option value="none">Hidden (None)</option>
                    </select>
                  </div>

                  {formData.status === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publish Date
                      </label>
                      <input
                        type="datetime-local"
                        name="published_at"
                        value={formData.published_at || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contributor Name
                  </label>
                  <input
                    type="text"
                    name="contributor_name"
                    value={formData.contributor_name || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    placeholder="Enter contributor name (optional)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Credit the person who contributed to this article (if different from author)
                  </p>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    placeholder="Brief description of your article"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image
                  </label>
                  <ImageUpload
                    value={formData.featured_image || undefined}
                    onChange={handleImageUpload}
                    onRemove={handleImageRemove}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {preview ? (
                      <div className="p-6 prose max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({...props}) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                {...props}
                                alt={props.alt || 'Article image'}
                                className="max-w-full h-auto rounded-lg shadow-md my-4"
                                style={{ maxHeight: '500px' }}
                              />
                            ),
                            p: ({children}) => (
                              <p className="mb-4">{children}</p>
                            ),
                            h1: ({children}) => (
                              <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>
                            ),
                            h2: ({children}) => (
                              <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5">{children}</h2>
                            ),
                            h3: ({children}) => (
                              <h3 className="text-lg font-bold text-gray-900 mb-2 mt-4">{children}</h3>
                            ),
                            blockquote: ({children}) => (
                              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">{children}</blockquote>
                            ),
                            code: ({children}) => (
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{children}</code>
                            ),
                            pre: ({children}) => (
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">{children}</pre>
                            ),
                            ul: ({children}) => (
                              <ul className="list-disc pl-6 mb-4">{children}</ul>
                            ),
                            ol: ({children}) => (
                              <ol className="list-decimal pl-6 mb-4">{children}</ol>
                            ),
                            a: ({children, href}) => (
                              <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                            ),
                          }}
                        >
                          {formData.content || 'Start writing to see your preview here...'}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={15}
                        className="w-full px-4 py-3 border-0 focus:ring-2 focus:ring-golden focus:border-transparent"
                        placeholder="Write your article content here..."
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {formData.content.length} characters
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => router.push('/editor/dashboard')}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-golden hover:bg-yellow-600 text-navy px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <FiSave />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default EditArticlePage;
