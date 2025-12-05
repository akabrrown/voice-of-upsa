import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/components/SupabaseProvider';

// Type assertion for Next.js Link component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextLink = Link as any;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  contributor_name?: string;
  author: {
    name: string;
    avatar_url?: string;
  };
  views_count?: number;
}

interface TrendingArticlesProps {
  articles: Article[];
  className?: string;
  maxItems?: number;
}

const TrendingArticles: React.FC<TrendingArticlesProps> = ({
  articles,
  className = '',
  maxItems = 5
}) => {
  const { session } = useSupabase();
  const [isAdmin, setIsAdmin] = useState(false); // Represents admin OR editor access

  // Check if user is admin or editor
  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const userRole = data.data?.role || data.role;
            setIsAdmin(userRole === 'admin' || userRole === 'editor');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };
    
    checkUserRole();
  }, [session]);

  const sortedArticles = [...articles]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, maxItems);

  if (sortedArticles.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <svg
          className="h-5 w-5 text-red-500 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Trending Articles</h3>
      </div>

      <div className="space-y-4">
        {sortedArticles.map((article, index) => (
          <article key={article.id} className="group">
            <NextLink href={`/articles/${article.slug}`}>
              <div className="flex space-x-3">
                <div className="flex-shrink-0 text-sm font-bold text-gray-400 w-6 h-6 flex items-center justify-center">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {article.contributor_name && article.contributor_name.trim() 
                        ? article.contributor_name 
                        : article.author.name}
                    </span>
                    <time dateTime={article.published_at} className="text-xs text-gray-500">
                      {new Date(article.published_at).toLocaleDateString()}
                    </time>
                  </div>
                  
                  {/* Only show view count to admins and editors */}
                  {isAdmin && article.views_count !== undefined && (
                    <div className="flex items-center mt-1">
                      <svg
                        className="h-3 w-3 text-gray-400 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-500">
                        {article.views_count.toLocaleString()} views
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </NextLink>
          </article>
        ))}
      </div>

      {articles.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <NextLink
            href="/trending"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all trending articles →
          </NextLink>
        </div>
      )}
    </div>
  );
};

export default TrendingArticles;
