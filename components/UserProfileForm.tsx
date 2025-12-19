import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import Image from 'next/image';

// Enhanced validation schema with security constraints
const profileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-_']+$/, 'Name can only contain letters, spaces, hyphens, underscores, and apostrophes'),
  bio: z.string()
    .max(500, 'Bio too long')
    .regex(/^[^<>]*$/, 'Bio cannot contain HTML tags')
    .optional(),
  avatar_url: z.string()
    .url('Invalid avatar URL')
    .refine((url) => url.startsWith('https://'), 'Avatar URL must use HTTPS')
    .optional()
    .nullable(),
  email: z.string()
    .email('Invalid email address')
    .refine((email) => email.length <= 254, 'Email address too long'),
});

// Allowed file types for avatar upload
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UserProfileFormProps {
  initialData?: Partial<z.infer<typeof profileSchema>>;
  onSubmit: (data: z.infer<typeof profileSchema>) => void;
  isLoading?: boolean;
  className?: string;
  onCancel?: () => void;
}

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
};

// Validate file for security
const validateFile = (file: File): string | null => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, GIF, and WebP files are allowed';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'File must be less than 5MB';
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [/\.php$/, /\.js$/, /\.exe$/, /\.bat$/, /\.cmd$/];
  if (suspiciousPatterns.some(pattern => pattern.test(file.name.toLowerCase()))) {
    return 'Invalid file type';
  }
  
  return null;
};

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  className = '',
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: sanitizeInput(initialData.name || ''),
    bio: sanitizeInput(initialData.bio || ''),
    avatar_url: initialData.avatar_url || '',
    email: sanitizeInput(initialData.email || ''),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData.avatar_url || null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Sanitize all form data before validation
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        bio: sanitizeInput(formData.bio),
        avatar_url: formData.avatar_url,
        email: sanitizeInput(formData.email),
      };
      
      const validatedData = profileSchema.parse(sanitizedData);
      onSubmit(validatedData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(error => {
          newErrors[error.path[0] as string] = error.message;
        });
        setErrors(newErrors);
      }
    }
  }, [formData, onSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'avatar_url') {
      setAvatarPreview(sanitizedValue || null);
    }
  }, [errors]);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setErrors(prev => ({ ...prev, avatar_url: validationError }));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Additional validation for the loaded image
        const img = document.createElement('img');
        img.src = result;
        img.onload = () => {
          setAvatarPreview(result);
          setFormData(prev => ({ ...prev, avatar_url: result }));
          setUploadProgress(100);
          setIsUploading(false);
          clearInterval(progressInterval);
          
          // Clear any previous avatar errors
          if (errors.avatar_url) {
            setErrors(prev => ({ ...prev, avatar_url: '' }));
          }
        };
        
        img.onerror = () => {
          setErrors(prev => ({ ...prev, avatar_url: 'Invalid image file' }));
          setIsUploading(false);
          clearInterval(progressInterval);
          setUploadProgress(0);
        };
        
        img.src = result;
      };
      
      reader.onerror = () => {
        setErrors(prev => ({ ...prev, avatar_url: 'Failed to read file' }));
        setIsUploading(false);
        clearInterval(progressInterval);
        setUploadProgress(0);
      };
      
      reader.readAsDataURL(file);
    }
  }, [errors]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`} noValidate>
      <div>
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
          Avatar
        </label>
        <div className="mt-2 flex items-center space-x-6">
          <div className="shrink-0">
            {avatarPreview ? (
              <Image
                className="h-16 w-16 object-cover rounded-full"
                src={avatarPreview}
                alt="Avatar preview"
                width={64}
                height={64}
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.png';
                }}
              />
            ) : (
              <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              id="avatar"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleAvatarChange}
              className="hidden"
              disabled={isUploading || isLoading}
            />
            <label
              htmlFor="avatar"
              className={`cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                isUploading ? 'bg-gray-100' : ''
              }`}
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : 'Change avatar'}
            </label>
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG, GIF, or WebP. Maximum 5MB.
            </p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          maxLength={100}
          autoComplete="name"
          disabled={isLoading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          maxLength={254}
          autoComplete="email"
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Tell us about yourself..."
          maxLength={500}
          disabled={isLoading}
          aria-invalid={!!errors.bio}
          aria-describedby={errors.bio ? 'bio-error' : undefined}
        />
        <div className="mt-1 flex justify-between">
          <p className="text-xs text-gray-500">
            {formData.bio.length}/500 characters
          </p>
          {errors.bio && (
            <p id="bio-error" className="text-xs text-red-600" role="alert">
              {errors.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading || isUploading}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || isUploading}
          className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : isUploading ? 'Uploading...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default UserProfileForm;
