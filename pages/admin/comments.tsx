import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiMessageCircle, FiSearch, FiUser, FiCalendar, FiTrash2 } from 'react-icons/fi';

// Type assertion for Next.js Link component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextLink = Link as any;
// Type assertion for Framer Motion component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

interface Comment {
  id: string;
  content: string;
  article_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  article_title: string;
  article_slug: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

const AdminCommentsPage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch('/api/admin/comments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.data?.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchComments();
    }
  }, [user, fetchComments]);

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
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
      
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      toast.success('Comment deleted successfully');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.article_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-gray-300 rounded"></div>
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
        {/* Header */}
        <section className="bg-navy text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <FiMessageCircle className="mr-3" />
                Comment Moderation
              </h1>
              <p className="text-gray-300">Review and manage all comments on the platform</p>
            </MotionDiv>
          </div>
        </section>

        {/* Search */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-6"
            >
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search comments by content, author, or article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                />
              </div>
            </MotionDiv>

            {/* Comments List */}
            <MotionDiv
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filteredComments.length > 0 ? (
                filteredComments.map((comment) => (
                  <MotionDiv
                    key={comment.id}
                    variants={itemVariants}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Comment Info */}
                      <div className="flex-1">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-navy mb-2 line-clamp-3">
                            {comment.content}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <FiUser className="mr-1" />
                              {comment.user_name} ({comment.user_email})
                            </div>
                            <div className="flex items-center">
                              <FiCalendar className="mr-1" />
                              {new Date(comment.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <FiMessageCircle className="mr-1" />
                              {comment.likes_count} likes
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">On article:</span>
                            <NextLink 
                              href={comment.article_slug ? `/articles/${comment.article_slug}` : '#'}
                              className="text-golden hover:text-yellow-400 font-medium"
                            >
                              {comment.article_title}
                            </NextLink>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-2 lg:space-y-0 lg:space-x-2">
                        <button
                          onClick={() => setSelectedComment(comment)}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <FiTrash2 className="text-xl" />
                        </button>
                      </div>
                    </div>
                  </MotionDiv>
                ))
              ) : (
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-lg shadow-lg p-12 text-center"
                >
                  <div className="text-gray-400 mb-4">
                    <FiMessageCircle className="text-5xl mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-2">No comments found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'No comments have been posted yet'}
                  </p>
                </MotionDiv>
              )}
            </MotionDiv>
          </div>
        </section>

        {/* Comment Details Modal */}
        {selectedComment && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedComment(null)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-navy mb-4">Comment Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Content</label>
                  <p className="text-gray-900 mt-1">{selectedComment.content}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Author</label>
                    <p className="text-gray-900 mt-1">{selectedComment.user_name}</p>
                    <p className="text-gray-600 text-sm">{selectedComment.user_email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedComment.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {new Date(selectedComment.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Article</label>
                  <NextLink 
                    href={selectedComment.article_slug ? `/articles/${selectedComment.article_slug}` : '#'}
                    className="text-golden hover:text-yellow-400 font-medium mt-1 block"
                  >
                    {selectedComment.article_title}
                  </NextLink>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Engagement</label>
                  <p className="text-gray-900 mt-1">{selectedComment.likes_count} likes</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setSelectedComment(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedComment.id);
                    setSelectedComment(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete Comment
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </div>
    </Layout>
  );
};

export default AdminCommentsPage;
