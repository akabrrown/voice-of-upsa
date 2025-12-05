/* eslint-disable @next/next/no-img-element */
/* 
  This file intentionally uses regular <img> tags instead of Next.js Image component
  to avoid positioning conflicts and routing issues with uploaded files in /uploads/ directory.
  Next.js Image treats these URLs as routes causing "hard navigate to same URL" errors
  and positioning conflicts with static parent elements.
*/
import React from 'react';

interface ArticleHeroProps {
  title: string;
  excerpt?: string;
  featuredImage?: string;
  contributor_name?: string;
  author?: {
    name: string;
    avatar?: string;
  };
  publishedAt?: string;
  className?: string;
}

const ArticleHero: React.FC<ArticleHeroProps> = ({
  title,
  excerpt,
  featuredImage,
  contributor_name,
  author,
  publishedAt,
  className = ''
}) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      {featuredImage && (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}
      
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        
        {excerpt && (
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {excerpt}
          </p>
        )}
        
        {(author || publishedAt) && (
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {author && (
              <div className="flex items-center space-x-2">
                {author.avatar && (
                  <img
                    src={author.avatar}
                    alt={contributor_name && contributor_name.trim() ? contributor_name : author.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>
                  {contributor_name && contributor_name.trim() 
                    ? contributor_name 
                    : author.name}
                </span>
              </div>
            )}
            
            {publishedAt && (
              <time dateTime={publishedAt}>
                {new Date(publishedAt).toLocaleDateString()}
              </time>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleHero;
