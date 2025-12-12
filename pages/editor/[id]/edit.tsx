import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import ImageUpload from '@/components/ImageUpload';
import MediaManager from '@/components/MediaManager';
import MarkdownContent from '@/components/MarkdownContent';
import { 
  FiEye, 
  FiImage, 
  FiBold, 
  FiItalic, 
  FiLink, 
  FiList, 
  FiTag,
  FiFolder,
  FiHash,
  FiX,
  FiPlus,
  FiPaperclip,
  FiCode,
  FiMinimize
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Type assertion for framer-motion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: 'draft' | 'published' | 'pending_review';
  category: string;
  tags: string[];
  reading_time: number;
  published_at: string | null;
  author_bio: string;
  contributor_name: string;
  is_featured: boolean;
  allow_comments: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
  size: number;
  alt?: string;
}

const EditArticlePage: React.FC = () => {
  const { user, loading: authLoading, supabase } = useSupabase();
  const router = useRouter();
  const { id } = router.query;
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    excerpt: '',
    featured_image: null,
    status: 'draft',
    category: '',
    tags: [],
    reading_time: 0,
    published_at: null,
    author_bio: '',
    contributor_name: '',
    is_featured: false,
    allow_comments: true,
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [titleFontSize, setTitleFontSize] = useState('text-4xl');

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check user role first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/sign-in');
        return;
      }
      
      const userResponse = await fetch(`/api/users/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userDataResponse = await userResponse.json();
      const userRole = userDataResponse.data?.role || userDataResponse.role;
      if (userRole !== 'editor' && userRole !== 'admin') {
        router.push('/unauthorized');
        return;
      }

      // Fetch article
      const response = await fetch(`/api/editor/articles/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch article:', response.status, errorText);
        throw new Error('Article not found');
      }

      const data = await response.json();
      const article = data.data?.article || data.article;
      
      // Check if user can edit this article
      if (userRole === 'editor' && article.author_id !== user?.id) {
        toast.error('You can only edit your own articles');
        router.push('/editor/articles');
        return;
      }
      
      setFormData({
        title: article?.title || '',
        content: article?.content || '',
        excerpt: article?.excerpt || '',
        featured_image: article?.featured_image || '',
        status: article?.status || 'draft',
        category: article?.category_id || '',
        tags: article?.tags || [],
        reading_time: article?.reading_time || 0,
        published_at: article?.published_at || null,
        author_bio: article?.author_bio || '',
        contributor_name: article?.contributor_name || '',
        is_featured: article?.is_featured || false,
        allow_comments: article?.allow_comments !== false,
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      router.push('/editor/articles');
    } finally {
      setLoading(false);
    }
  }, [user, router, id, supabase]);

  useEffect(() => {
    if (id && user && !authLoading) {
      fetchArticle();
    }
  }, [id, user, authLoading, fetchArticle]);

  useEffect(() => {
    // Calculate word count, character count and reading time
    const text = formData.content.replace(/<[^>]*>/g, '');
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(characters);
    const readingTime = Math.max(1, Math.ceil(words.length / 200)); // Average reading speed: 200 words/min
    setReadingTime(readingTime);
    setFormData(prev => ({ ...prev, reading_time: readingTime }));
  }, [formData.content]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (!user || !formData.title.trim()) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/articles/auto-save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [user, formData, supabase.auth]);

  // Auto-save functionality
  useEffect(() => {
    if (formData.title || formData.content) {
      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [formData, handleAutoSave]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
  };

  const handleImageUpload = (imageUrl: string | null) => {
    setFormData(prev => ({ ...prev, featured_image: imageUrl }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, featured_image: null }));
  };

  const addTag = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleMediaInsert = (media: MediaItem) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    let mediaMarkdown = '';
    switch (media.type) {
      case 'image':
        mediaMarkdown = `![${media.alt || media.name}](${media.url})`;
        break;
      case 'video':
        mediaMarkdown = `[Video: ${media.name}](${media.url})`;
        break;
      case 'document':
        mediaMarkdown = `[Document: ${media.name}](${media.url})`;
        break;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = formData.content.substring(0, start) + 
                      '\n' + mediaMarkdown + '\n' + 
                      formData.content.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Restore cursor position after the inserted media
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + mediaMarkdown.length + 2; // +2 for newlines
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      toast.error('Title must be at least 3 characters long');
      return;
    }

    if (!formData.content.trim() || formData.content.trim().length < 10) {
      toast.error('Content must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/sign-in');
        return;
      }

      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.error || 'Failed to update article';
        throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
      }

      await response.json();
      
      if (formData.status === 'pending_review') {
        toast.success('Article submitted for approval! Admin will review it soon.');
      } else if (formData.status === 'published') {
        toast.success('Article updated and published successfully!');
      } else {
        toast.success('Article updated as draft!');
      }

      router.push('/editor/articles');
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReadingTimeColor = () => {
    if (readingTime <= 3) return 'text-green-600';
    if (readingTime <= 7) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getWordCountColor = () => {
    if (wordCount >= 300 && wordCount <= 1500) return 'text-green-600';
    if (wordCount >= 150 && wordCount <= 2000) return 'text-yellow-600';
    return 'text-red-600';
  };


  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let formattedText = '';
    switch (tag) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'codeblock':
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText}`;
        break;
      case 'orderedlist':
        formattedText = `\n1. ${selectedText}`;
        break;
      case 'hr':
        formattedText = `\n---\n`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const generateExcerpt = () => {
    const plainText = formData.content.replace(/<[^>]*>/g, '');
    const excerpt = plainText.trim().substring(0, 150);
    setFormData(prev => ({ ...prev, excerpt: excerpt + (plainText.length > 150 ? '...' : '') }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertFormatting('bold');
          break;
        case 'i':
          e.preventDefault();
          insertFormatting('italic');
          break;
        case 'u':
          e.preventDefault();
          insertFormatting('underline');
          break;
        case 'k':
          e.preventDefault();
          insertFormatting('link');
          break;
        case '1':
          e.preventDefault();
          insertFormatting('h1');
          break;
        case '2':
          e.preventDefault();
          insertFormatting('h2');
          break;
        case '3':
          e.preventDefault();
          insertFormatting('h3');
          break;
      }
    }
  };


  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-32 bg-gray-300 rounded w-full"></div>
                  <div className="h-64 bg-gray-300 rounded w-full"></div>
                </div>
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
        {/* Header with status */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-navy">Edit Article</h1>
                {lastSaved && (
                  <span className="text-sm text-gray-500">
                    Auto-saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <form onSubmit={handleSubmit}>
            {/* Featured Image */}
            <div className="p-8 border-b">
              <h3 className="text-lg font-semibold text-navy mb-4 flex items-center">
                <FiImage className="mr-2" />
                Featured Image
              </h3>
              <ImageUpload
                value={formData.featured_image || undefined}
                onChange={handleImageUpload}
                onRemove={handleImageRemove}
              />
            </div>

            {/* Article Content */}
            <div className="p-8">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent text-lg"
                    placeholder="Enter your article title..."
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{formData.title.length}/60 characters</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Title Size:</span>
                      <select 
                        value={titleFontSize} 
                        onChange={(e) => setTitleFontSize(e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="text-2xl">Small</option>
                        <option value="text-3xl">Medium</option>
                        <option value="text-4xl">Large</option>
                        <option value="text-5xl">Extra Large</option>
                        <option value="text-6xl">Huge</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Title Preview */}
                {formData.title && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Title Preview:</p>
                    <h3 className={`${titleFontSize} font-bold text-gray-900`}>
                      {formData.title}
                    </h3>
                  </div>
                )}

                {/* Contributor Name */}
                <div>
                  <label htmlFor="contributor_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Contributor Name
                  </label>
                  <input
                    type="text"
                    id="contributor_name"
                    name="contributor_name"
                    value={formData.contributor_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                    placeholder="Enter contributor name (if different from author)..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Credit the person who contributed to this article (optional)
                  </p>
                </div>

                {/* Category and Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      <FiFolder className="inline mr-1" />
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
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
                      <FiTag className="inline mr-1" />
                      Tags (max 10)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(e);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                        placeholder="Add a tag..."
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-golden text-navy rounded-lg hover:bg-yellow-400"
                      >
                        <FiPlus />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                        >
                          <FiHash className="w-3 h-3 mr-1" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-gray-500 hover:text-red-500"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                  {/* Excerpt */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
                        Article Excerpt
                      </label>
                      <button
                        type="button"
                        onClick={generateExcerpt}
                        className="text-sm text-golden hover:text-golden-dark"
                      >
                        Generate from content
                      </button>
                    </div>
                    <textarea
                      id="excerpt"
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none"
                      placeholder="Brief description of your article (max 150 characters)..."
                    />
                  </div>

                  {/* Content Editor */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        Article Content *
                      </label>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getWordCountColor()}`}>
                            {wordCount} words
                          </span>
                          {wordCount < 300 && <span className="text-orange-600 text-xs">(min: 300)</span>}
                          {wordCount > 2000 && <span className="text-orange-600 text-xs">(max: 2000)</span>}
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <span className="text-gray-600">
                          {characterCount.toLocaleString()} chars
                        </span>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <span className={`font-medium ${getReadingTimeColor()}`}>
                          {readingTime} min read
                          {readingTime < 1 && ' (very short)'}
                          {readingTime > 10 && ' (very long)'}
                        </span>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <button
                          type="button"
                          onClick={() => setPreview(!preview)}
                          className="text-golden hover:text-golden-dark flex items-center"
                        >
                          <FiEye className="mr-1" />
                          {preview ? 'Edit' : 'Preview'}
                        </button>
                      </div>
                    </div>

                    {/* Formatting Toolbar */}
                    {!preview && (
                      <div className="border-b border-gray-200 mb-4">
                        {/* First Row - Basic Formatting */}
                        <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center space-x-1 pr-2 border-r border-gray-300">
                            <button
                              type="button"
                              onClick={() => insertFormatting('bold')}
                              className="p-2 hover:bg-gray-200 rounded font-bold"
                              title="Bold (Ctrl+B)"
                            >
                              <FiBold />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('italic')}
                              className="p-2 hover:bg-gray-200 rounded italic"
                              title="Italic (Ctrl+I)"
                            >
                              <FiItalic />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('underline')}
                              className="p-2 hover:bg-gray-200 rounded underline"
                              title="Underline (Ctrl+U)"
                            >
                              U
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('strikethrough')}
                              className="p-2 hover:bg-gray-200 rounded line-through"
                              title="Strikethrough"
                            >
                              <FiMinimize />
                            </button>
                          </div>

                          <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                            <button
                              type="button"
                              onClick={() => insertFormatting('h1')}
                              className="p-2 hover:bg-gray-200 rounded text-lg font-bold"
                              title="Heading 1"
                            >
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('h2')}
                              className="p-2 hover:bg-gray-200 rounded font-semibold"
                              title="Heading 2"
                            >
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('h3')}
                              className="p-2 hover:bg-gray-200 rounded text-sm"
                              title="Heading 3"
                            >
                              H3
                            </button>
                          </div>

                          <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
                            <button
                              type="button"
                              onClick={() => insertFormatting('list')}
                              className="p-2 hover:bg-gray-200 rounded"
                              title="Bullet List"
                            >
                              <FiList />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('orderedlist')}
                              className="p-2 hover:bg-gray-200 rounded"
                              title="Numbered List"
                            >
                              1.
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('quote')}
                              className="p-2 hover:bg-gray-200 rounded"
                              title="Quote"
                            >
                              &quot;
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('code')}
                              className="p-2 hover:bg-gray-200 rounded font-mono text-sm"
                              title="Inline Code"
                            >
                              <FiCode />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('codeblock')}
                              className="p-2 hover:bg-gray-200 rounded font-mono text-sm"
                              title="Code Block"
                            >
                              {`</>`}
                            </button>
                          </div>

                          <div className="flex items-center space-x-1 px-2">
                            <button
                              type="button"
                              onClick={() => insertFormatting('link')}
                              className="p-2 hover:bg-gray-200 rounded text-blue-600"
                              title="Insert Link"
                            >
                              <FiLink />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowMediaManager(true)}
                              className="p-2 hover:bg-gray-200 rounded text-blue-600"
                              title="Insert Media"
                            >
                              <FiPaperclip />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('hr')}
                              className="p-2 hover:bg-gray-200 rounded"
                              title="Horizontal Rule"
                            >
                              ―
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {preview ? (
                      <div className="min-h-[400px] p-6 bg-gray-50 rounded-lg">
                        <MarkdownContent 
                          content={formData.content} 
                          editable={true}
                          onImageSizeChange={(url, size) => {
                            console.log('Image resized:', url, `${size}%`);
                          }}
                        />
                      </div>
                    ) : (
                      <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        rows={15}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none font-mono"
                        placeholder="Write your article content here. You can use Markdown formatting..."
                        required
                      />
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publication Status
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={formData.status === 'draft'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-gray-700">Draft</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="published"
                          checked={formData.status === 'published'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-gray-700">Published</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="pending_review"
                          checked={formData.status === 'pending_review'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-gray-700">Pending Review</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => router.push('/editor/articles')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, status: 'draft' }));
                          const event = new Event('submit', { cancelable: true }) as unknown as React.FormEvent;
                          handleSubmit(event);
                        }}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Draft'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-golden text-navy rounded-lg hover:bg-yellow-400 disabled:opacity-50 font-semibold"
                      >
                        {isSubmitting ? 'Publishing...' : 'Update Article'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </MotionDiv>
        </div>
      </div>

      {/* Media Manager Modal */}
      {showMediaManager && (
        <MediaManager
          onMediaInsert={handleMediaInsert}
          isOpen={showMediaManager}
          onClose={() => setShowMediaManager(false)}
        />
      )}
    </Layout>
  );
};

export default EditArticlePage;
