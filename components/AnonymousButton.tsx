import React from 'react';
import Link from 'next/link';
import { FiMessageCircle } from 'react-icons/fi';

interface AnonymousButtonProps {
  variant?: 'primary' | 'secondary' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AnonymousButton: React.FC<AnonymousButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className = ''
}) => {
  // Use inline Tailwind classes instead of CSS modules to avoid TypeScript resolution issues
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    floating: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 fixed bottom-6 right-6 z-50 shadow-lg'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  if (variant === 'floating') {
    return (
      <Link href="/anonymous" className={buttonClasses}>
        <FiMessageCircle className="w-6 h-6" />
        <span className="ml-2">Anonymous</span>
      </Link>
    );
  }

  return (
    <Link href="/anonymous" className={buttonClasses}>
      <FiMessageCircle className="w-5 h-5" />
      <span className="ml-2">Anonymous Zone</span>
    </Link>
  );
};

export default AnonymousButton;
