import { ApiClient } from '@/lib/api-client';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  contributor_name?: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
    bio?: string;
  };
  views_count: number;
  likes_count: number;
  comments_count: number;
  category?: {
    name: string;
    slug: string;
    color: string;
  };
  // Featured article fields
  is_featured?: boolean;
  featured_order?: number;
  featured_until?: string;
  // Display location
  display_location?: string;
  // Content allowance fields
  allow_comments?: boolean;
  moderate_comments?: boolean;
  notify_on_publish?: boolean;
  content_warning?: boolean;
  age_restriction?: boolean;
  is_premium?: boolean;
}

export interface ArticlesListResponse {
  articles: Article[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalArticles: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ArticleParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  category?: string;
  author?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const ArticlesApi = {
  getArticles: async (params: ArticleParams = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return ApiClient.get<ArticlesListResponse>(`/api/articles?${queryParams.toString()}`);
  },

  getArticleBySlug: async (slug: string) => {
    return ApiClient.get<{ article: Article }>(`/api/articles/${slug}`);
  },

  createArticle: async (data: Partial<Article>) => {
    return ApiClient.post<{ article: Article }>('/api/articles', data);
  },

  updateArticle: async (id: string, data: Partial<Article>) => {
    return ApiClient.put<{ article: Article }>(`/api/articles/${id}`, data);
  },

  deleteArticle: async (id: string) => {
    return ApiClient.delete<{ message: string }>(`/api/articles/${id}`);
  },
  
  // Interaction endpoints
  trackArticleView: async (id: string) => {
    // Fire and forget, usually
    return ApiClient.post<void>(`/api/articles/${id}/view`, {});
  },
  
  getArticleComments: async (id: string) => {
    return ApiClient.get<unknown[]>(`/api/articles/${id}/comments`);
  },
  
  createComment: async (id: string, content: string) => {
    return ApiClient.post<unknown>(`/api/articles/${id}/comments`, { content });
  },
  
  getArticleReactions: async (id: string) => {
    return ApiClient.get<unknown[]>(`/api/articles/${id}/reactions`);
  },
  
  reactToArticle: async (id: string, type: string) => {
    return ApiClient.post<void>(`/api/articles/${id}/reactions`, { type });
  },
  
  getBookmarkStatus: async (id: string) => {
    return ApiClient.get<{ bookmarked: boolean }>(`/api/articles/${id}/bookmark`);
  },
  
  toggleBookmark: async (id: string) => {
    return ApiClient.post<{ bookmarked: boolean }>(`/api/articles/${id}/bookmark`, {});
  }
};
