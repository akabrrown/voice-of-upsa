import React from 'react';
import Image from 'next/image';

interface AdInArticleProps {
  ad: {
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    company?: string;
  };
  className?: string;
}

const AdInArticle: React.FC<AdInArticleProps> = ({ ad, className = "" }) => {
  const handleClick = () => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`my-8 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 cursor-pointer transform transition-all duration-300 hover:border-golden hover:shadow-lg ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 text-center w-full">
          {ad.company ? `${ad.company} - Advertisement` : 'Advertisement'}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {ad.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {ad.description}
          </p>
          
          <button className="bg-golden text-navy px-4 py-2 rounded text-sm font-semibold hover:bg-yellow-400 transition-colors">
            Learn More
          </button>
        </div>
        
        {ad.imageUrl && (
          <div className="relative w-full md:w-48 h-32 rounded overflow-hidden flex-shrink-0">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 192px"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdInArticle;
