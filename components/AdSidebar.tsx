import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface AdSidebarProps {
  ad: {
    id?: string;
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    company?: string;
  };
  className?: string;
}

const AdSidebar: React.FC<AdSidebarProps> = ({ ad, className = "" }) => {
  const router = useRouter();

  const handleClick = () => {
    console.log('AdSidebar clicked:', { id: ad.id, title: ad.title });
    
    // Always navigate to internal detail page if ID exists
    if (ad.id) {
      router.push(`/ads/${ad.id}`);
    } else if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Show ad details in a modal/alert when no link is available
      alert(`Ad Details:\n\nTitle: ${ad.title}\nCompany: ${ad.company || 'N/A'}\n\n${ad.description}`);
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${className}`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
          {ad.company || 'Advertisement'}
        </div>
        
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {ad.title}
        </h3>
        
        {ad.imageUrl && (
          <div className="relative w-full h-32 mb-3 rounded overflow-hidden">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
        )}
        
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
          {ad.description}
        </p>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="w-full bg-golden text-navy px-3 py-2 rounded text-sm font-semibold hover:bg-yellow-400 transition-colors"
        >
          Learn More
        </button>
      </div>
    </div>
  );
};

export default AdSidebar;
