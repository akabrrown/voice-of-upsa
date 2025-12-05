import React, { useState, useCallback } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import { FiUpload, FiX } from 'react-icons/fi';

// Type assertion for Next.js Image component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextImage = Image as any;

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

  const handleUpload = useCallback((result: unknown) => {
    if (
      result && 
      typeof result === 'object' && 
      'event' in result && 
      result.event === 'success' &&
      'info' in result &&
      result.info &&
      typeof result.info === 'object' &&
      'secure_url' in result.info
    ) {
      onChange(result.info.secure_url as string);
      setIsUploading(false);
      
      // Fix scroll issue caused by Cloudinary widget
      setTimeout(() => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }, 100);
    }
  }, [onChange]);

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-300">
          <NextImage
            src={value}
            alt="Upload preview"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={true}
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
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'default'}
          onUpload={handleUpload}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => {
                setIsUploading(true);
                // Ensure scroll is not disabled when opening widget
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                open();
              }}
              disabled={disabled || isUploading}
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
          )}
        </CldUploadWidget>
      )}
    </div>
  );
};

export default ImageUpload;
