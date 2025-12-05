import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiClock, FiMessageSquare, FiSearch, FiCornerUpLeft, FiX } from 'react-icons/fi';
import Layout from '@/components/Layout';
import { useSupabase } from '@/components/SupabaseProvider';
import toast from 'react-hot-toast';

// Type assertion for Framer Motion component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;
// Type assertion for Framer Motion AnimatePresence component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatePresenceComponent = AnimatePresence as any;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'pending' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  ip_address: string | null;
  user_agent: string | null;
  read_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageReply {
  id: string;
  message_id: string;
  admin_id: string;
  reply_text: string;
  reply_method: 'email' | 'internal';
  sent_at: string;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}

const AdminMessagesPage: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [replies, setReplies] = useState<MessageReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyModal, setReplyModal] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session found');
        return;
      }
      
      const response = await fetch('/api/admin/messages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.data?.messages || []);
      
      // Fetch replies for all messages
      if (data.data?.messages?.length > 0) {
        const repliesResponse = await fetch('/api/admin/messages/replies', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (repliesResponse.ok) {
          const repliesData = await repliesResponse.json();
          setReplies(repliesData.data?.replies || []);
        }
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, fetchMessages]);

  const filteredMessages = messages.filter((message) => {
    const matchesFilter = filter === 'all' || message.status === filter;
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-gray-100 text-gray-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-600';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (messageId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message status');
      }

      toast.success('Message status updated successfully');
      fetchMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setIsReplying(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No active session');
        return;
      }
      
      const response = await fetch(`/api/admin/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reply_text: replyText.trim(),
          reply_method: 'email'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      toast.success('Reply sent successfully');
      setReplyText('');
      setReplyModal(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const getMessageReplies = (messageId: string) => {
    return replies.filter(reply => reply.message_id === messageId);
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
                  <div key={i} className="h-24 bg-gray-300 rounded"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">Messages</h1>
            <p className="text-gray-600">Manage contact messages and replies</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                >
                  <option value="all">All Messages</option>
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <MotionDiv
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Message Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-navy mb-1">{message.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">{message.email}</p>
                          {message.subject && (
                            <p className="text-gray-800 font-medium mb-2">{message.subject}</p>
                          )}
                          <p className="text-gray-700 line-clamp-2">{message.message}</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {message.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <FiClock className="mr-1" />
                          {new Date(message.created_at).toLocaleDateString()}
                        </div>
                        {message.phone && (
                          <div className="flex items-center">
                            <FiMessageSquare className="mr-1" />
                            {message.phone}
                          </div>
                        )}
                      </div>

                      {/* Replies */}
                      {getMessageReplies(message.id).length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Replies:</h4>
                          <div className="space-y-2">
                            {getMessageReplies(message.id).map((reply) => (
                              <div key={reply.id} className="bg-gray-50 rounded p-3">
                                <p className="text-sm text-gray-700 mb-1">{reply.reply_text}</p>
                                <p className="text-xs text-gray-500">
                                  {reply.admin_name || 'Admin'} • {new Date(reply.sent_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-2 lg:space-y-0 lg:space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMessage(message);
                          setReplyModal(true);
                        }}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm"
                      >
                        <FiCornerUpLeft className="inline mr-1" />
                        Reply
                      </button>
                      <select
                        value={message.status}
                        onChange={(e) => handleStatusChange(message.id, e.target.value)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm"
                      >
                        <option value="new">New</option>
                        <option value="read">Mark as Read</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </MotionDiv>
              ))
            ) : (
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg shadow-sm p-12 text-center"
              >
                <div className="text-gray-400 mb-4">
                  <FiMail className="text-5xl mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-navy mb-2">No messages found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'No messages match the current filter'}
                </p>
              </MotionDiv>
            )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      <AnimatePresenceComponent>
        {replyModal && selectedMessage && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setReplyModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-navy">Reply to Message</h3>
                <button
                  onClick={() => setReplyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Original Message */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-800 mb-2">From: {selectedMessage.name} ({selectedMessage.email})</h4>
                {selectedMessage.subject && (
                  <p className="font-medium text-gray-700 mb-2">Subject: {selectedMessage.subject}</p>
                )}
                <p className="text-gray-700">{selectedMessage.message}</p>
              </div>

              {/* Reply Form */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reply
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                  placeholder="Type your reply here..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setReplyModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={isReplying || !replyText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isReplying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresenceComponent>
    </Layout>
  );
};

export default AdminMessagesPage;
