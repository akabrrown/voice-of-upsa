import React, { useState } from 'react';
import { z } from 'zod';
import { FiEye, FiEdit } from 'react-icons/fi';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

interface ArticleFormProps {
  initialData?: Partial<z.infer<typeof articleSchema>>;
  onSubmit: (data: z.infer<typeof articleSchema>) => void;
  isLoading?: boolean;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ 
  initialData = {}, 
  onSubmit, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    content: initialData.content || '',
    excerpt: initialData.excerpt || '',
    slug: initialData.slug || '',
    status: initialData.status || 'draft' as 'draft' | 'published',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreview, setIsPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = articleSchema.parse(formData);
      onSubmit(validatedData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(error => {
          newErrors[error.path[0]] = error.message;
        });
        setErrors(newErrors);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Convert plain text to HTML for preview
  const formatContentForPreview = (content: string) => {
    return content
      .replace(/\n/g, '<br />')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  };

  return (
    <div className="space-y-6">
      {/* Toggle between Edit and Preview */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setIsPreview(false)}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            !isPreview
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiEdit className="inline mr-2" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setIsPreview(true)}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            isPreview
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiEye className="inline mr-2" />
          Preview
        </button>
      </div>

      {!isPreview ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Brief description of the article..."
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="mt-1">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                <p className="text-sm text-blue-800">
                  <strong>Formatting Tips:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Press Enter for new paragraphs</li>
                  <li>• Use Tab for indentation</li>
                  <li>• Content will be formatted automatically when published</li>
                </ul>
              </div>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={12}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                placeholder="Write your article content here..."
                required
              />
            </div>
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="url-friendly-article-title"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to auto-generate from title
            </p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </form>
      ) : (
        /* Preview Mode */
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {formData.title || 'Untitled Article'}
            </h1>
            
            {formData.excerpt && (
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6">
                <p className="text-gray-700 italic">{formData.excerpt}</p>
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formatContentForPreview(formData.content || 'No content yet...') 
              }}
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiEdit className="inline mr-2" />
              Back to Edit
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleForm;
