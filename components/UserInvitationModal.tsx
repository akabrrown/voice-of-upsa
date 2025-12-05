import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCopy, FiMail, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/database';

interface UserInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

const UserInvitationModal: React.FC<UserInvitationModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateInvitation = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: user.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setInvitationLink(data.data.invitationLink);
        toast.success('Invitation link generated successfully!');
      } else {
        setError(data.error?.message || 'Failed to generate invitation');
        toast.error(data.error?.message || 'Failed to generate invitation');
      }
    } catch (error) {
      console.error('Invitation generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationLink) return;

    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      toast.success('Invitation link copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      toast.error('Failed to copy link');
    }
  };

  const sendEmail = () => {
    if (!invitationLink || !user) return;

    const subject = encodeURIComponent('Welcome to Voice of UPSA - Your Account Invitation');
    const body = encodeURIComponent(
      `Hi ${user.name},\n\n` +
      `Your account has been created on Voice of UPSA. Click the link below to set your password and access your account:\n\n` +
      `${invitationLink}\n\n` +
      `This link will expire in 24 hours. If you need a new link, please contact your administrator.\n\n` +
      `Best regards,\n` +
      `Voice of UPSA Team`
    );

    window.open(`mailto:${user.email}?subject=${subject}&body=${body}`);
  };

  const resetModal = () => {
    setInvitationLink('');
    setError('');
    setCopied(false);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={resetModal}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Invite User</h2>
              <p className="text-sm text-gray-600 mt-1">{user.name} ({user.email})</p>
            </div>
            <button
              onClick={resetModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!invitationLink ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How this works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• We&apos;ll generate a secure invitation link</li>
                  <li>• The user will use this link to set their password</li>
                  <li>• Link expires in 24 hours for security</li>
                  <li>• User can log in immediately after setting password</li>
                </ul>
              </div>

              <button
                onClick={generateInvitation}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Generating Invitation...' : 'Generate Invitation Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Invitation Link Generated!</h3>
                <p className="text-sm text-green-800 mb-3">
                  Share this link with {user.name} via email or messaging:
                </p>
                <div className="bg-white border border-gray-300 rounded-md p-3 break-all">
                  <code className="text-xs text-gray-700">{invitationLink}</code>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {copied ? (
                    <>
                      <FiCheck className="w-4 h-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </button>

                <button
                  onClick={sendEmail}
                  className="flex-1 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiMail className="w-4 h-4 mr-2" />
                  Send Email
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={generateInvitation}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Generate New Link
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserInvitationModal;
