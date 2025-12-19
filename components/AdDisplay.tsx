import React, { useState, useEffect } from 'react';
import AdBanner from './AdBanner';
import AdSidebar from './AdSidebar';
import AdInArticle from './AdInArticle';
import AdSponsoredContent from './AdSponsoredContent';
import useAds from '../hooks/useAds';

interface AdDisplayProps {
  adType: 'banner' | 'sidebar' | 'in-article' | 'popup' | 'sponsored-content' | 'other';
  className?: string;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ adType, className = "" }) => {
  const { ads, loading, error } = useAds(adType);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  console.log(`AdDisplay (${adType}):`, { ads, loading, error, adsLength: ads.length });

  // Rotate through ads every 5 seconds if there are multiple ads
  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [ads.length]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}>
        <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error || ads.length === 0) {
  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 ${className}`}>
      <div className="text-sm">
        {error ? `Error: ${error}` : `No ads available for ${adType}`}
      </div>
    </div>
  );
}

  const ad = ads[currentAdIndex]; // Get the current ad
  if (!ad) return null; // Safety check
  

  const adData = {
    id: ad.id,
    title: ad.adTitle || '',
    description: ad.adDescription || '',
    ...(ad.attachmentUrls?.[0] && { imageUrl: ad.attachmentUrls[0] }),
    ...(ad.website && { linkUrl: ad.website }),
    ...(ad.company && { company: ad.company }),
  };

  const renderAdComponent = () => {

    switch (adType) {
      case 'banner':
        return <AdBanner ad={adData} className={className} />;
      case 'sidebar':
        return <AdSidebar ad={adData} className={className} />;
      case 'in-article':
        return <AdInArticle ad={adData} className={className} />;
      case 'sponsored-content':
        return <AdSponsoredContent ad={adData} className={className} />;
      case 'popup':
        // For popup ads, show as banner for now but add popup styling
        return <AdBanner ad={adData} className={`${className} border-4 border-golden rounded-xl shadow-2xl`} />;
      case 'other':
      default:
        return <AdBanner ad={adData} className={className} />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {renderAdComponent()}
      {/* Show indicator when there are multiple ads */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {currentAdIndex + 1}/{ads.length}
        </div>
      )}
    </div>
  );
};

export default AdDisplay;
