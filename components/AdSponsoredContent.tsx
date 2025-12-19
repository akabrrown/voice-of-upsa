import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface AdSponsoredContentProps {
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

const AdSponsoredContent: React.FC<AdSponsoredContentProps> = ({ ad, className = "" }) => {
  const router = useRouter();

  const handleClick = () => {
    console.log('AdSponsoredContent clicked:', { id: ad.id, title: ad.title });
    
    // Always navigate to internal detail page if ID exists
    if (ad.id) {
      router.push(`/ads/${ad.id}`);
    } else if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Show ad details in a modal/alert when no link is available
      alert(`Sponsored Content Details:\n\nTitle: ${ad.title}\nCompany: ${ad.company || 'N/A'}\n\n${ad.description}`);
    }
  };

  return (
    <div 
      className={`bg-gradient-to-br from-golden to-yellow-600 rounded-lg p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-wide bg-white/20 px-3 py-1 rounded-full">
          Sponsored Content
        </div>
        {ad.company && (
          <div className="text-sm opacity-90">
            Presented by {ad.company}
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-bold mb-3">{ad.title}</h3>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <p className="text-white/90 mb-4 line-clamp-3">
            {ad.description}
          </p>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="bg-white text-golden px-4 py-2 rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Read More
          </button>
        </div>
        
        {ad.imageUrl && (
          <div className="relative w-full md:w-40 h-40 rounded overflow-hidden flex-shrink-0">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 160px"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdSponsoredContent;
