import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiSend, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

const DRAFT_KEY = 'anonymous_story_draft';

const AnonymousSubmitPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        toast.success('Draft restored from previous session');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const saveDraft = () => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    };

    // Save draft when form data changes (debounced)
    const timeoutId = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Clear draft after successful submission
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please add a title for your story');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Please write your story');
      return;
    }
    
    if (formData.content.trim().length < 10) {
      toast.error('Your story must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/anonymous-stories/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category
        }),
      });

      const data = await response.json();

      if (response.ok) {
        clearDraft(); // Clear the saved draft
        toast.success('Your anonymous story has been submitted for review');
        setFormData({ title: '', content: '', category: 'general' });
        
        // Redirect to categories page after successful submission
        setTimeout(() => {
          router.push('/articles?category=anonymous');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to submit story');
      }
    } catch (error) {
      toast.error('Error submitting story');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout 
      title="Share Your Anonymous Story - Voice of UPSA" 
      description="Submit your anonymous story to the UPSA community"
    >
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link 
              href="/articles?category=anonymous"
              className="inline-flex items-center text-gray-600 hover:text-golden transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Anonymous Stories
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-golden rounded-full flex items-center justify-center">
                <FiMessageCircle className="w-8 h-8 text-navy" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Share Your Anonymous Story
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your identity is completely protected. Share your thoughts, experiences, or stories without fear of judgment.
            </p>
          </motion.div>

          {/* Submission Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-navy to-navy-light p-6 text-white">
              <h2 className="text-xl font-semibold">Your Story</h2>
              <p className="text-gray-300 text-sm mt-1">
                All submissions are reviewed before being published.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Give your story a title..."
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent transition-colors"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum 100 characters
                </p>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent transition-colors"
                >
                  <option value="general">General</option>
                  <option value="experience">Personal Experience</option>
                  <option value="opinion">Opinion</option>
                  <option value="question">Question</option>
                  <option value="story">Story</option>
                  <option value="advice">Advice</option>
                </select>
              </div>

              {/* Content */}
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Story *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Share your story anonymously..."
                  rows={8}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent transition-colors resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 10 characters. Be respectful and constructive.
                </p>
              </div>

              {/* Guidelines */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Community Guidelines:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be respectful and constructive</li>
                  <li>• No hate speech or discrimination</li>
                  <li>• No personal attacks or bullying</li>
                  <li>• No explicit or inappropriate content</li>
                  <li>• Keep it relevant to the UPSA community</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/articles?category=anonymous"
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      clearDraft();
                      setFormData({ title: '', content: '', category: 'general' });
                      toast.success('Draft cleared');
                    }}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm"
                  >
                    Clear Draft
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                  className="flex items-center bg-golden text-navy px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      Submit Story
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Privacy Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center space-x-2 text-gray-600">
              <FiMessageCircle className="w-4 h-4" />
              <span>Your identity is completely anonymous and protected.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AnonymousSubmitPage;
