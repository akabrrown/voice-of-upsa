import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { updatePassword } from '@/lib/supabase-client';

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if we're in reset mode (has access token in URL)
    if (router.isReady && router.query.access_token) {
      setIsResetMode(true);
    }
  }, [router.isReady, router.query]);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error?.message || 'Password reset failed');
        return;
      }

      // Show success message
      toast.success('Password reset instructions sent to your email!');
      
      // In development, show the reset link if available
      if (data.data?.developmentLink && process.env.NODE_ENV === 'development') {
        console.log('🔗 Development Reset Link:', data.data.developmentLink);
        
        // Create a temporary element to show the link
        const linkElement = document.createElement('div');
        linkElement.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #f3f4f6; border: 1px solid #d1d5db; padding: 16px; border-radius: 8px; max-width: 400px; z-index: 9999; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h4 style="margin: 0 0 8px 0; color: #111827;">Development Reset Link</h4>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Click this link to reset password (development only):</p>
            <a href="${data.data.developmentLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px; font-size: 14px;" target="_blank">
              Reset Password
            </a>
            <button onclick="this.parentElement.remove()" style="display: block; margin-top: 8px; background: none; border: none; color: #6b7280; cursor: pointer; font-size: 12px;">✕ Close</button>
          </div>
        `;
        document.body.appendChild(linkElement);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
          if (linkElement.parentElement) {
            linkElement.remove();
          }
        }, 30000);
      }
      
      setEmail('');
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password updated successfully!');
      router.push('/auth/sign-in');
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Update password error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center text-navy hover:text-golden transition-colors mb-6">
                <FiArrowLeft className="mr-2" />
                Back to Home
              </Link>
              
              <div className="flex justify-center mb-6">
                <Image
                  src="/logo.jpg"
                  alt="Voice of UPSA Logo"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full"
                  loading="eager"
                  priority
                  unoptimized
                />
              </div>
              
              <h1 className="text-3xl font-bold text-navy mb-2">
                {isResetMode ? 'Set New Password' : 'Reset Password'}
              </h1>
              <p className="text-gray-600">
                {isResetMode 
                  ? 'Enter your new password below' 
                  : 'Enter your email address and we\'ll send you instructions to reset your password'
                }
              </p>
            </div>

            <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
              {!isResetMode ? (
                // Request reset form
                <form className="space-y-6" onSubmit={handleResetRequest}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-navy hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending Instructions...
                        </div>
                      ) : (
                        'Send Reset Instructions'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                // Update password form
                <form className="space-y-6" onSubmit={handleUpdatePassword}>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                        ) : (
                          <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                        ) : (
                          <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-navy hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating Password...
                        </div>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link href="/auth/sign-in" className="text-sm text-golden hover:text-yellow-400 transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
