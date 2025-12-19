import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface AdBannerProps {
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

const AdBanner: React.FC<AdBannerProps> = ({ ad, className = "" }) => {
  const router = useRouter();

  const handleClick = () => {
    console.log('AdBanner clicked:', { id: ad.id, title: ad.title });
    
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
      className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide opacity-75 mb-1">
            {ad.company || 'Advertisement'}
          </div>
          <h3 className="text-lg font-bold mb-2">{ad.title}</h3>
          <p className="text-sm opacity-90 line-clamp-2">{ad.description}</p>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="mt-3 bg-white text-blue-600 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Learn More
          </button>
        </div>
        
        {ad.imageUrl && (
          <div className="ml-4 hidden md:block">
            <div className="relative w-32 h-32 bg-white/10 rounded-lg overflow-hidden">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 0px, 128px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBanner;
