import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/database';
import { z } from 'zod';

// Enhanced validation schema
const createRoleSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email address too long')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-_']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  role: z.enum(['user', 'editor', 'admin'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  })
});

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user' as 'user' | 'editor' | 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    try {
      const sanitizedData = {
        email: sanitizeInput(formData.email),
        name: sanitizeInput(formData.name),
        role: formData.role
      };
      
      createRoleSchema.parse(sanitizedData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(error => {
          const pathItem = error.path[0];
          if (typeof pathItem === 'string' || typeof pathItem === 'number') {
            newErrors[pathItem.toString()] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  const handleInputChange = useCallback((field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix validation errors', {
        icon: '⚠️'
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Get current session properly
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setErrors({ general: 'No authentication session found. Please log in again.' });
        toast.error('Please log in again', {
          icon: '🔒'
        });
        setLoading(false);
        return;
      }

      // Add CSRF protection
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      const response = await fetch('/api/admin/users/create-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify(formData)
      });

      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);

      if (data.success) {
        toast.success(`User created successfully! Temp password: ${data.data.tempPassword}`, {
          icon: '✅'
        });
        setFormData({ email: '', name: '', role: 'user' });
        onSuccess();
        onClose();
      } else {
        // Handle specific error types
        if (response.status === 401) {
          setErrors({ general: 'Session expired. Please log in again.' });
          toast.error('Session expired. Please log in again.', {
            icon: '🔒'
          });
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (response.status === 403) {
          setErrors({ general: 'Insufficient permissions to create users.' });
          toast.error('Insufficient permissions', {
            icon: '🚫'
          });
        } else if (response.status === 429) {
          setErrors({ general: 'Too many requests. Please try again later.' });
          toast.error('Too many requests', {
            icon: '⏱️'
          });
        } else {
          setErrors({ general: data.error?.message || 'Failed to create user' });
          toast.error(data.error?.message || 'Failed to create user', {
            icon: '❌'
          });
        }
      }
    } catch (err) {
      console.error('Create role error:', err);
      
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setErrors({ general: 'Network error. Please check your connection.' });
        toast.error('Network error. Please check your connection.', {
          icon: '🌐'
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setErrors({ general: errorMessage });
        toast.error(errorMessage, {
          icon: '❌'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onSuccess, onClose]);

  const handleCancel = useCallback(() => {
    if (loading) return; // Prevent cancel during submission
    
    setErrors({});
    setFormData({ email: '', name: '', role: 'user' });
    onClose();
  }, [loading, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create User with Role</h2>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="user@example.com"
                required
                maxLength={254}
                autoComplete="email"
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errors.name 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="John Doe"
                required
                maxLength={100}
                autoComplete="name"
                disabled={loading}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errors.role 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
                disabled={loading}
                aria-invalid={!!errors.role}
                aria-describedby={errors.role ? 'role-error' : undefined}
              >
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p id="role-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.role}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateRoleModal;
