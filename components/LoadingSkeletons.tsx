import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  lines = 1,
  height = 'h-4'
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, index) => (
        <div
          key={index}
          className={`${height} bg-gray-200 rounded animate-pulse`}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

export const ArticleSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 space-y-4 ${className}`}>
      <div className="flex space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/6" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      {[...Array(rows)].map((_, index) => (
        <div key={index} className="h-16 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 space-y-4 ${className}`}>
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
};

export default LoadingSkeleton;
