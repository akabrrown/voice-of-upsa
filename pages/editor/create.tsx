import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import ImageUpload from '@/components/ImageUpload';
import MediaManager from '@/components/MediaManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useFormPersist } from '@/hooks/useFormPersist';
import { 
  FiEye, 
  FiImage, 
  FiBold, 
  FiItalic, 
  FiLink, 
  FiList, 
  FiSave, 
  FiSend,
  FiTag,
  FiFolder,
  FiUser,
  FiHash,
  FiX,
  FiPlus,
  FiCode,
  FiMinimize,
  FiPaperclip,
  FiUpload,
  FiMaximize,
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
  status: 'draft' | 'scheduled' | 'published';
  category: string;
  tags: string[];
  reading_time: number;
  published_at: string | null;
  author_bio: string;
  contributor_name: string;
  is_featured: boolean;
  allow_comments: boolean;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  content_type: 'article' | 'tutorial' | 'news' | 'opinion';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time: number;
  media_files: MediaFile[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  size: number;
  duration?: number;
  thumbnail?: string;
  caption?: string;
  alt?: string;
}

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  size: number;
  thumbnail?: string;
  alt?: string;
}

const CreateArticlePage: React.FC = () => {
  const { user, loading: authLoading, supabase } = useSupabase();
  const router = useRouter();
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  
  const initialFormData: ArticleFormData = {
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
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    content_type: 'article',
    difficulty_level: 'beginner',
    estimated_read_time: 0,
    media_files: [],
  };

  const {
    formData,
    setFormData,
    isRestoring,
    lastSaved: persistLastSaved,
    saveStatus,
    clearSavedData
  } = useFormPersist<ArticleFormData>({
    storageKey: 'article-create-draft',
    initialValues: initialFormData,
    debounceMs: 2000,
  });
  
  const [preview, setPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<{ role: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [titleFontSize, setTitleFontSize] = useState('text-4xl');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          console.log('Categories API response:', data);
          // Handle the correct response structure: { success: true, data: { categories: [...] } }
          setCategories(data.data?.categories || []);
        } else {
          console.error('Categories API error:', response.status);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      if (user && !authLoading) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push('/auth/sign-in');
            return;
          }
          
          // Fetch user role with existing session (no refresh to avoid rate limits)
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          
          console.log('Profile response status:', response.status);
          const responseText = await response.text();
          console.log('Profile response:', responseText);
          
          if (!response.ok) {
            // If token is expired, try refresh once
            if (response.status === 401) {
              const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError || !freshSession) {
                console.error('Session refresh failed:', refreshError);
                router.push('/auth/sign-in');
                return;
              }
              
              // Retry with fresh token
              const retryResponse = await fetch('/api/user/profile', {
                headers: {
                  'Authorization': `Bearer ${freshSession.access_token}`,
                },
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                setUserData(retryData.data?.profile || retryData.profile);
                return;
              }
            }
            throw new Error(`Failed to fetch user data: ${response.status} - ${responseText}`);
          }
          
          const userDataResponse = JSON.parse(responseText);
          setUserData(userDataResponse.data?.profile || userDataResponse.profile);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Failed to load user data. Please try signing in again.');
          router.push('/auth/sign-in');
        }
      }
    };

    // Add debouncing to prevent excessive calls
    const timeoutId = setTimeout(checkRole, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, authLoading, router, supabase.auth]);

  useEffect(() => {
    // Calculate word count, character count and reading time
    const text = formData.content.replace(/<[^>]*>/g, '');
    const countWords = (text: string): number => {
      return text.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    };
    const words = countWords(text);
    setWordCount(words);
    const characters = text.length;
    setCharacterCount(characters);
    const readingTime = Math.max(1, Math.ceil(words / 200)); // Average reading speed: 200 words/min
    setReadingTime(readingTime);
    setFormData((prev: ArticleFormData) => ({ ...prev, reading_time: readingTime }));
  }, [formData.content, setFormData]);

  const handleAutoSave = useCallback(async () => {
    // Temporarily disabled auto-save due to schema issues
    console.log('Auto-save temporarily disabled');
    return;
    
    if (!user || !formData.title.trim()) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const response = await fetch('/api/articles/auto-save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Auto-save successful, the useFormPersist hook will handle the status
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
    
    setFormData((prev: ArticleFormData) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
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

  const generateExcerpt = () => {
    const plainText = formData.content.replace(/<[^>]*>/g, '');
    const excerpt = plainText.trim().substring(0, 150);
    setFormData((prev: ArticleFormData) => ({ ...prev, excerpt: excerpt + (plainText.length > 150 ? '...' : '') }));
  };

  const addTag = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev: ArticleFormData) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev: ArticleFormData) => ({ ...prev, tags: prev.tags.filter((tag: string) => tag !== tagToRemove) }));
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
        mediaMarkdown = `[🎥 Video: ${media.name}](${media.url})\n\n*Click to play video*`;
        break;
      case 'audio':
        mediaMarkdown = `[🎵 Audio: ${media.name}](${media.url})\n\n*Click to play audio*`;
        break;
      case 'document':
        mediaMarkdown = `[📄 Document: ${media.name}](${media.url})\n\n*Download document*`;
        break;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = formData.content.substring(0, start) + 
                      '\n' + mediaMarkdown + '\n' + 
                      formData.content.substring(end);
    
    setFormData((prev: ArticleFormData) => ({ ...prev, content: newContent }));
    
    // Add to media files array
    const mediaFile: MediaFile = {
      id: media.id,
      name: media.name,
      type: media.type,
      url: media.url,
      size: media.size,
      thumbnail: media.thumbnail,
      alt: media.alt,
    };
    
    setFormData((prev: ArticleFormData) => ({ 
      ...prev, 
      media_files: [...prev.media_files, mediaFile] 
    }));
    
    // Restore cursor position after the inserted media
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + mediaMarkdown.length + 2; // +2 for newlines
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          const mediaItem: MediaItem = {
            id: result.id,
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 
                  file.type.startsWith('audio/') ? 'audio' : 'document',
            url: result.url,
            size: file.size,
            alt: file.name,
          };
          
          handleMediaInsert(mediaItem);
        }
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
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
    setFormData((prev: ArticleFormData) => ({ ...prev, content: newContent }));
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) {
      toast.error('User data not loaded');
      return;
    }

    // Validation
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      toast.error('Title must be at least 3 characters long');
      return;
    }

    if (!formData.content.trim() || formData.content.trim().length < 10) {
      toast.error('Content must be at least 10 characters long');
      return;
    }

    // Editors can now publish directly without admin approval
    // No restrictions based on user role - all users can publish

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/sign-in');
        return;
      }

      const response = await fetch('/api/editor/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.error || 'Failed to create article';
        throw new Error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
      }

      await response.json();
      
      if (formData.status === 'scheduled') {
        toast.success('Article scheduled successfully!');
      } else if (formData.status === 'published') {
        toast.success('Article published successfully!');
      } else {
        toast.success('Article saved as draft!');
      }

      // Clear saved draft data after successful submission
      clearSavedData();
      router.push('/editor/articles');
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create article');
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

  if (authLoading) {
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
                <h1 className="text-2xl font-bold text-navy">Create Article</h1>
                <div className="flex items-center space-x-2">
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
                      {formData.tags.map((tag: string) => (
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
                      <div className="border-2 border-gray-200 rounded-xl mb-4 bg-white shadow-sm overflow-hidden">
                        {/* First Row - Basic Formatting */}
                        <div className="flex items-center space-x-1 p-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center space-x-1 pr-2 border-r border-gray-300">
                            <button
                              type="button"
                              onClick={() => insertFormatting('bold')}
                              className="p-2.5 hover:bg-gray-200 rounded-lg font-bold text-gray-700 hover:text-gray-900 transition-colors duration-150"
                              title="Bold (Ctrl+B)"
                            >
                              <FiBold />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('italic')}
                              className="p-2.5 hover:bg-gray-200 rounded-lg italic text-gray-700 hover:text-gray-900 transition-colors duration-150"
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

                        {/* Content Textarea */}
                        <div 
                          className={`relative ${dragOver ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            placeholder="Start writing your article... or drag and drop files here"
                            className={`w-full h-96 px-6 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800 placeholder-gray-400 bg-white shadow-sm transition-all duration-200 ${
                              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{
                              fontSize: `${fontSize}px`,
                              lineHeight: '1.6',
                              fontFamily: fontFamily === 'Inter' ? 'Inter, system-ui, -apple-system, sans-serif' : fontFamily
                            }}
                            required
                          />
                          
                          {/* Upload Progress */}
                          {isUploading && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-sm text-gray-600 mb-2">Uploading files...</p>
                                <div className="w-48 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{Math.round(uploadProgress)}%</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Drag Overlay */}
                          {dragOver && (
                            <div className="absolute inset-0 bg-blue-50 bg-opacity-95 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-400">
                              <div className="text-center">
                                <FiUpload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                                <p className="text-lg font-semibold text-blue-700 mb-2">Drop files here</p>
                                <p className="text-sm text-blue-600">Images, videos, audio, and documents supported</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Toolbar Enhancements */}
                          <div className="absolute top-2 right-2 flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setFullscreen(!fullscreen)}
                              className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-md shadow-sm"
                              title="Toggle Fullscreen"
                            >
                              {fullscreen ? <FiMinimize /> : <FiMaximize />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowMediaManager(true)}
                              className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-md shadow-sm"
                              title="Media Manager"
                            >
                              <FiPaperclip />
                            </button>
                            <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-md shadow-sm">
                              Markdown supported
                            </span>
                          </div>
                        </div>

                        {/* Second Row - Style Controls */}
                        <div className="flex items-center space-x-4 p-3 bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <label className="text-xs font-medium text-gray-600">Font:</label>
                            <select
                              value={fontFamily}
                              onChange={(e) => setFontFamily(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="sans-serif">Sans Serif</option>
                              <option value="serif">Serif</option>
                              <option value="monospace">Monospace</option>
                              <option value="cursive">Cursive</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <label className="text-xs font-medium text-gray-600">Size:</label>
                            <select
                              value={fontSize}
                              onChange={(e) => setFontSize(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="12">12px</option>
                              <option value="14">14px</option>
                              <option value="16">16px</option>
                              <option value="18">18px</option>
                              <option value="20">20px</option>
                              <option value="24">24px</option>
                              <option value="28">28px</option>
                              <option value="32">32px</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-1">
                            <input
                              type="datetime-local"
                              id="published_at"
                              name="published_at"
                              value={formData.published_at || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-center space-x-6">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="is_featured"
                                checked={formData.is_featured}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span className="text-gray-700">Featured article</span>
                            </label>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="allow_comments"
                                checked={formData.allow_comments}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span className="text-gray-700">Allow comments</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview Mode */}
                    {preview && (
                      <div className="border-2 border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="prose prose-lg max-w-none">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                              {formData.title || 'Untitled Article'}
                            </h1>
                            {formData.excerpt && (
                              <div className="text-gray-600 italic mb-6">
                                {formData.excerpt}
                              </div>
                            )}
                            <div className="text-gray-800 leading-relaxed">
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
                          </div>
                        </div>
                      </div>
                    )}

                      {/* Author Settings */}
                      <div>
                        <h4 className="text-lg font-medium text-navy mb-4 flex items-center">
                          <FiUser className="mr-2" />
                          Author Settings
                        </h4>
                        <div>
                          <label htmlFor="author_bio" className="block text-sm font-medium text-gray-700 mb-2">
                            Author Bio (optional)
                          </label>
                          <textarea
                            id="author_bio"
                            name="author_bio"
                            value={formData.author_bio}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent resize-none"
                            placeholder="Brief author biography..."
                          />
                        </div>
                      </div>
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
                          value="scheduled"
                          checked={formData.status === 'scheduled'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-blue-700 font-medium">Schedule for Later</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="published"
                          checked={formData.status === 'published'}
                          onChange={handleInputChange}
                          className="mr-2"
                          disabled={userData?.role !== 'admin' && userData?.role !== 'editor'} // Only admins and editors can publish
                        />
                        <span className="text-green-700 font-medium">Publish Now</span>
                      </label>
                      {/* Debug info - remove in production */}
                      <div className="text-xs text-gray-500 mt-2">
                        Debug: User role = {userData?.role}, Can publish = {userData?.role === 'admin' || userData?.role === 'editor'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => router.push('/editor/articles')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  
                  {formData.status === 'scheduled' ? (
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <FiSend />
                      <span>{isSubmitting ? 'Scheduling...' : 'Schedule Article'}</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-3 bg-golden text-navy rounded-lg hover:bg-yellow-400 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {formData.status === 'published' ? <FiSend /> : <FiSave />}
                      <span>{isSubmitting ? 'Publishing...' : (formData.status === 'published' ? 'Publish Now' : 'Save Draft')}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </MotionDiv>
        </div>
      </div>
      
      {/* Media Manager */}
      <MediaManager
        isOpen={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        onMediaInsert={handleMediaInsert}
      />
    </Layout>
  );
};

export default CreateArticlePage;
