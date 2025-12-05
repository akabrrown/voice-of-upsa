import React from 'react';
import Image from 'next/image';

interface ArticleMetadataProps {
  author?: {
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
  updatedAt?: string;
  readTime?: number;
  category?: string;
  tags?: string[];
  className?: string;
}

const ArticleMetadata: React.FC<ArticleMetadataProps> = ({
  author,
  publishedAt,
  updatedAt,
  readTime,
  category,
  tags,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm text-gray-500 ${className}`}>
      {author && (
        <div className="flex items-center space-x-2">
          {author.avatar && (
            <Image
              src={author.avatar}
              alt={author.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span>{author.name}</span>
        </div>
      )}
      
      {publishedAt && (
        <time dateTime={publishedAt}>
          {new Date(publishedAt).toLocaleDateString()}
        </time>
      )}
      
      {updatedAt && updatedAt !== publishedAt && (
        <span>
          Updated {new Date(updatedAt).toLocaleDateString()}
        </span>
      )}
      
      {readTime && (
        <span>{readTime} min read</span>
      )}
      
      {category && (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {category}
        </span>
      )}
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleMetadata;
