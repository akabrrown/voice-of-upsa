import React, { useState, useCallback, useRef } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { FiUpload, FiX } from 'react-icons/fi';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const uploadTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if Cloudinary is properly configured for client-side
  const isCloudinaryConfigured = !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );

  interface CloudinaryResult {
    event?: string;
    info?: {
      secure_url?: string;
      url?: string;
      public_id?: string;
      original_secure_url?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  const handleUpload = useCallback((result: unknown) => {
    console.log('=== Image Upload Debug ===');
    console.log('Raw result:', result);
    console.log('Result type:', typeof result);
    
    // Clear any existing timeout
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }
    
    // Check different result structures
    if (result && typeof result === 'object') {
      const cloudinaryResult = result as CloudinaryResult;
      console.log('Result keys:', Object.keys(result));
      
      // Check for success event
      if (cloudinaryResult.event) {
        console.log('Event type:', cloudinaryResult.event);
        
        if (cloudinaryResult.event === 'success') {
          console.log('Upload success detected');
          
          // Try different ways to get the URL
          if (cloudinaryResult.info && typeof cloudinaryResult.info === 'object') {
            console.log('Info object:', cloudinaryResult.info);
            console.log('Info keys:', Object.keys(cloudinaryResult.info));
            
            if (cloudinaryResult.info.secure_url) {
              console.log('Found secure_url:', cloudinaryResult.info.secure_url);
              onChange(cloudinaryResult.info.secure_url);
              setIsUploading(false);
              
              // Fix scroll issue caused by Cloudinary widget
              setTimeout(() => {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
              }, 100);
              return;
            }
            
            // Try other possible URL fields
            const possibleUrlFields: (keyof typeof cloudinaryResult.info)[] = ['url', 'public_id', 'secure_url', 'original_secure_url'];
            for (const field of possibleUrlFields) {
              if (field in cloudinaryResult.info && cloudinaryResult.info[field]) {
                console.log(`Found ${field}:`, cloudinaryResult.info[field]);
                if (typeof field === 'string' && field.includes('url') && typeof cloudinaryResult.info[field] === 'string') {
                  onChange(cloudinaryResult.info[field]);
                  setIsUploading(false);
                  return;
                }
              }
            }
          }
        }
      }
      
      // Handle other events
      if (cloudinaryResult.event === 'close' || cloudinaryResult.event === 'abort') {
        console.log('Upload cancelled/closed');
        setIsUploading(false);
      } else if (cloudinaryResult.event === 'error') {
        console.log('Upload error:', result);
        setIsUploading(false);
      }
    }
    
    console.log('=== End Upload Debug ===');
  }, [onChange]);

  const handleOpen = useCallback(() => {
    console.log('=== Handle Open Called ===');
    console.log('Setting isUploading to true');
    setIsUploading(true);
    
    // Ensure scroll is not disabled when opening widget
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Add timeout to reset upload state if it gets stuck
    console.log('Setting 60-second timeout');
    uploadTimeoutRef.current = setTimeout(() => {
      console.log('Upload timeout - resetting state');
      setIsUploading(false);
    }, 60000); // 60 seconds timeout
  }, []);

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-300">
          <Image
            src={value}
            alt="Upload preview"
            className="w-full h-full object-cover"
            width={500}
            height={500}
            unoptimized
          />
          {!disabled && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        // Only render Cloudinary widget if properly configured
        isCloudinaryConfigured ? (
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'voice_of_upsa'}
            onUpload={(result, widget) => {
              console.log('=== OnUpload Callback Called ===');
              console.log('Result:', result);
              console.log('Widget:', widget);
              handleUpload(result);
            }}
            onSuccess={(result, widget) => {
              console.log('=== OnSuccess Callback Called ===');
              console.log('Result:', result);
              console.log('Widget:', widget);
              handleUpload(result);
            }}
            onError={(error, widget) => {
              console.log('=== OnError Callback Called ===');
              console.log('Error:', error);
              console.log('Widget:', widget);
              setIsUploading(false);
            }}
            onClose={() => {
              console.log('=== OnClose Callback Called ===');
              setIsUploading(false);
            }}
            options={{
              folder: 'voice-of-upsa/articles',
              resourceType: 'image',
              // Size limits
              maxFileSize: 5242880, // 5MB
              // Cropping and transformation settings
              cropping: false,
              // UI settings
              showPoweredBy: false,
              showSkipCropButton: false,
              showAdvancedOptions: false,
              showInsecurePreview: false,
              // Language and theme
              language: 'en',
              theme: 'minimal',
              // Multiple files disabled for single upload
              multiple: false,
              maxFiles: 1,
            }}
          >
            {(widget) => {
              console.log('=== Cloudinary Widget Debug ===');
              console.log('Widget object:', widget);
              
              // Add null check for widget
              if (!widget) {
                console.error('Cloudinary widget not initialized');
                return (
                  <div className="w-full h-64 border-2 border-dashed border-red-300 rounded-lg flex flex-col items-center justify-center">
                    <p className="text-red-600 font-medium">Upload widget not available</p>
                    <p className="text-red-400 text-sm mt-2">Please check Cloudinary configuration</p>
                  </div>
                );
              }
              
              // Add more robust destructuring with defaults
              const { open = undefined, isLoading = false } = widget || {};
              console.log('Open function:', open);
              console.log('Is loading:', isLoading);
              console.log('Widget type:', typeof widget);
              console.log('Widget keys:', widget ? Object.keys(widget) : 'widget is null');
              
              return (
                <button
                  type="button"
                  onClick={() => {
                    console.log('=== Button Clicked ===');
                    handleOpen();
                    if (open && typeof open === 'function') {
                      console.log('Calling open() function');
                      open();
                    } else {
                      console.error('Open function not available or not a function');
                      console.log('Widget properties:', widget ? Object.keys(widget) : 'widget is null');
                    }
                  }}
                  disabled={disabled || isUploading || isLoading}
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">
                  {isUploading ? 'Uploading...' : 'Click to upload image'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
                </button>
              );
            }}
          </CldUploadWidget>
        ) : (
          // Fallback UI when Cloudinary is not configured
          <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
            <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">Image upload unavailable</p>
            <p className="text-gray-400 text-sm mt-2">Cloudinary not configured</p>
          </div>
        )
      )}
    </div>
  );
};

export default ImageUpload;
