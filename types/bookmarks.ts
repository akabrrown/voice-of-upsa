export interface BookmarkedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  author_name: string;
  author_avatar_url?: string;
  category_name?: string;
  category_slug?: string;
  category_color?: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  bookmarked_at: string;
}

export interface BookmarkResponse {
  success: boolean;
  data: {
    bookmarks: BookmarkedArticle[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  timestamp: string;
}

export interface BookmarkError {
  success: false;
  error: {
    code: string;
    message: string;
    details: string | null;
  };
  timestamp: string;
}

export interface BookmarkMutationResponse {
  success: boolean;
  data?: {
    message: string;
    bookmarked: boolean;
  };
  error?: {
    code: string;
    message: string;
    details: string | null;
  };
  timestamp: string;
}

export interface BookmarkFormData {
  article_id: string;
  user_id: string;
}

export interface BookmarkQueryParams {
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'published_at' | 'title';
  order?: 'asc' | 'desc';
}

export interface BookmarkStats {
  total_bookmarks: number;
  recent_bookmarks: number;
  popular_articles: Array<{
    article_id: string;
    title: string;
    bookmark_count: number;
  }>;
}
