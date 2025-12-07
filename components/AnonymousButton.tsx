import React from 'react';
import Link from 'next/link';
import { FiMessageCircle } from 'react-icons/fi';
import styles from '@/styles/components/Anonymous.module.css';

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
  const baseClasses = styles.anonymousButton + ' ' + className;
  
  const variantClasses = {
    primary: styles.anonymousButtonPrimary,
    secondary: styles.anonymousButtonSecondary,
    floating: styles.anonymousButtonPrimary + ' fixed bottom-6 right-6 z-50 shadow-lg'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };

  const buttonClasses = baseClasses + ' ' + variantClasses[variant] + ' ' + sizeClasses[size];

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
