import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  author: {
    name: string;
    avatar_url?: string;
  };
  category: {
    name: string;
    slug: string;
    color: string;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  article: {
    id: string;
    title: string;
    slug: string;
  };
}

interface User {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  created_at: string;
}

interface SearchResults {
  articles: Article[];
  comments: Comment[];
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET - Search articles and comments
    if (req.method === 'GET') {
      const { 
        q, 
        type = 'all', 
        page = 1, 
        limit = 10,
        category,
        sort = 'relevance'
      } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const searchTerm = q.trim();
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      const results: SearchResults = {
        articles: [],
        comments: [],
        users: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalResults: 0,
        }
      };

      // Search articles using full-text search
      if (type === 'all' || type === 'articles') {
        let articlesQuery = supabase
          .from('articles')
          .select(`
            *,
            author:users(name, avatar_url),
            category:categories(name, slug, color)
          `, { count: 'exact' })
          .eq('status', 'published');

        // Use basic text search instead of full-text search
        articlesQuery = articlesQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);

        // Add category filter if provided
        if (category && typeof category === 'string') {
          // First get the category ID from the slug
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', category)
            .single();
          
          if (!categoryError && categoryData) {
            articlesQuery = articlesQuery.eq('category_id', categoryData.id);
          } else {
            // If category doesn't exist, return no results
            articlesQuery = articlesQuery.eq('category_id', 'non-existent-id');
          }
        }

        // Apply sorting
        if (sort === 'relevance') {
          // For relevance sorting, we need to use raw SQL
          articlesQuery = articlesQuery.order('published_at', { ascending: false });
        } else if (sort === 'newest') {
          articlesQuery = articlesQuery.order('published_at', { ascending: false });
        } else if (sort === 'oldest') {
          articlesQuery = articlesQuery.order('published_at', { ascending: true });
        } else if (sort === 'popular') {
          articlesQuery = articlesQuery.order('views_count', { ascending: false });
        }

        const { data: articles, error: articlesError, count: articlesCount } = await articlesQuery
          .range(offset, offset + limitNum - 1);

        if (!articlesError && articles) {
          results.articles = articles.map(article => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            featured_image: article.featured_image,
            published_at: article.published_at,
            views_count: article.views_count || 0,
            likes_count: article.likes_count || 0,
            comments_count: article.comments_count || 0,
            bookmarks_count: article.bookmarks_count || 0,
            author: article.author || {
              name: 'Unknown Author',
              avatar_url: null
            },
            category: article.category || null
          }));
          
          if (type === 'articles') {
            results.pagination.totalResults = articlesCount || 0;
            results.pagination.totalPages = articlesCount ? Math.ceil(articlesCount / limitNum) : 0;
          }
        }
      }

      // Search comments
      if (type === 'all' || type === 'comments') {
        const { data: comments, error: commentsError, count: commentsCount } = await supabase
          .from('comments')
          .select(`
            *,
            user:users(name, avatar_url),
            article:articles(title, slug)
          `, { count: 'exact' })
          .eq('status', 'published')
          .textSearch('content', searchTerm)
          .order('created_at', { ascending: false })
          .range(offset, offset + limitNum - 1);

        if (!commentsError && comments) {
          results.comments = comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user: comment.user,
            article: comment.article
          }));
          
          if (type === 'comments') {
            results.pagination.totalResults = commentsCount || 0;
            results.pagination.totalPages = commentsCount ? Math.ceil(commentsCount / limitNum) : 0;
          }
        }
      }

      // Search users (new feature)
      if (type === 'all' || type === 'users') {
        const { data: users, error: usersError, count: usersCount } = await supabase
          .from('users')
          .select('id, name, avatar_url, bio, role, created_at', { count: 'exact' })
          .or(`name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .range(offset, offset + limitNum - 1);

        if (!usersError && users) {
          results.users = users;
          
          if (type === 'users') {
            results.pagination.totalResults = usersCount || 0;
            results.pagination.totalPages = usersCount ? Math.ceil(usersCount / limitNum) : 0;
          }
        }
      }

      // For 'all' type, calculate combined pagination
      if (type === 'all') {
        const totalResults = (results.articles?.length || 0) + (results.comments?.length || 0) + (results.users?.length || 0);
        results.pagination.totalResults = totalResults;
        results.pagination.totalPages = Math.ceil(totalResults / limitNum);
      }

      return res.status(200).json(results);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

