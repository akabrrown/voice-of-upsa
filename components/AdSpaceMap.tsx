import React from 'react';

interface AdSpace {
  id: string;
  name: string;
  description: string;
  location: string;
  type: 'banner' | 'sidebar' | 'in-article' | 'popup' | 'sponsored-content' | 'other';
  dimensions: string;
  visibility: string;
  price: string;
}

const AdSpaceMap: React.FC = () => {
  const adSpaces: AdSpace[] = [
    {
      id: 'homepage-banner',
      name: 'Homepage Banner',
      description: 'Large banner ad on the homepage between featured articles and latest news',
      location: 'Homepage - Center section',
      type: 'banner',
      dimensions: '1200x200px',
      visibility: 'High - All homepage visitors',
      price: 'Premium'
    },
    {
      id: 'homepage-sponsored',
      name: 'Homepage Sponsored Content',
      description: 'Dedicated section for sponsored content on homepage',
      location: 'Homepage - Below banner ad',
      type: 'sponsored-content',
      dimensions: '1200x300px',
      visibility: 'High - All homepage visitors',
      price: 'Premium'
    },
    {
      id: 'articles-sidebar',
      name: 'Articles Page Sidebar',
      description: 'Sidebar ad on the articles listing page',
      location: 'Articles Index Page - Right sidebar',
      type: 'sidebar',
      dimensions: '300x600px',
      visibility: 'Medium - Users browsing articles',
      price: 'Standard'
    },
    {
      id: 'article-inarticle',
      name: 'In-Article Ad',
      description: 'Ad placement within article content',
      location: 'Article Detail Page - Within content',
      type: 'in-article',
      dimensions: '600x400px',
      visibility: 'High - Article readers',
      price: 'Premium'
    },
    {
      id: 'article-popup',
      name: 'Article Popup Ad',
      description: 'Prominent ad placement with enhanced styling',
      location: 'Article Detail Page - After in-article ad',
      type: 'popup',
      dimensions: '600x400px (with border emphasis)',
      visibility: 'High - Article readers',
      price: 'Premium'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'banner': return 'bg-blue-100 text-blue-800';
      case 'sidebar': return 'bg-green-100 text-green-800';
      case 'in-article': return 'bg-purple-100 text-purple-800';
      case 'popup': return 'bg-red-100 text-red-800';
      case 'sponsored-content': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriceColor = (price: string) => {
    switch (price) {
      case 'Premium': return 'text-golden font-bold';
      case 'Standard': return 'text-blue-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-navy mb-4">Available Ad Spaces</h3>
      
      <div className="space-y-4">
        {adSpaces.map((space) => (
          <div key={space.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-semibold text-navy">{space.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(space.type)}`}>
                {space.type}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{space.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <p className="text-gray-600">{space.location}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Dimensions:</span>
                <p className="text-gray-600">{space.dimensions}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Price Tier:</span>
                <p className={getPriceColor(space.price)}>{space.price}</p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  <span className="font-medium">Visibility:</span> {space.visibility}
                </span>
                <span className="text-xs text-gray-400">
                  Ad Type: <span className="font-mono bg-gray-100 px-1 rounded">{space.type}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How Ad Placement Works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Choose your preferred ad type when submitting</li>
          <li>• Your ad will appear in all locations that match your chosen type</li>
          <li>• Premium spaces have higher visibility and engagement</li>
          <li>• Admin reviews and approves all submissions before publishing</li>
        </ul>
      </div>
    </div>
  );
};

export default AdSpaceMap;
