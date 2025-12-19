import React from 'react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface ArticleTableProps {
  articles: Article[];
  onEdit?: (article: Article) => void;
  onDelete?: (article: Article) => void;
  isLoading?: boolean;
}

const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No articles found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Author
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Published
            </th>
            <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {articles.map((article) => (
            <tr key={article.id} className="hover:bg-gray-50">
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div className="max-w-[150px] sm:max-w-xs md:max-w-md lg:max-w-lg overflow-hidden">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {article.title}
                  </div>
                  {article.excerpt && (
                    <div className="text-xs sm:text-sm text-gray-500 truncate mt-1">
                      {article.excerpt}
                    </div>
                  )}
                </div>
              </td>
              <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {article.author.name}
              </td>
              <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    article.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : article.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {article.status}
                </span>
              </td>
              <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString()
                  : '-'}
              </td>
              <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(article.updated_at).toLocaleDateString()}
              </td>
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {onEdit && (
                  <button
                    onClick={() => onEdit(article)}
                    className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-3"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(article)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleTable;
