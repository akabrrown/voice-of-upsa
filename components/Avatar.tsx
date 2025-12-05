import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeDimensions = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64
  };

  if (src) {
    return (
      <Image
        src={src}
        alt={alt || name || 'Avatar'}
        width={sizeDimensions[size]}
        height={sizeDimensions[size]}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
