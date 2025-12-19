import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  type: 'article' | 'author';
  highlight: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Query parameter is required and must be at least 2 characters' });
    }

    const searchTerm = `%${q.toLowerCase()}%`;

    // Search articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, slug, status')
      .eq('status', 'published')
      .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
      .limit(5);

    if (articlesError) {
      console.error('Articles search error:', articlesError);
      return res.status(500).json({ error: 'Failed to search articles' });
    }

    // Transform articles to suggestions
    const articleSuggestions = articles?.map(article => ({
      id: `article-${article.id}`,
      title: article.title,
      slug: article.slug,
      type: 'article' as const,
      highlight: highlightText(article.title, q)
    })) || [];

    // Search for tags (you might want to add a tags table later)
    const tagSuggestions: Suggestion[] = [];

    // Search for authors
    const { data: authors, error: authorsError } = await supabase
      .from('users')
      .select('id, name')
      .ilike('name', searchTerm)
      .limit(3);

    if (!authorsError && authors) {
      const authorSuggestions = authors.map(author => ({
        id: `author-${author.id}`,
        title: author.name,
        slug: author.id,
        type: 'author' as const,
        highlight: highlightText(author.name, q)
      }));
      
      tagSuggestions.push(...authorSuggestions);
    }

    const suggestions = [...articleSuggestions, ...tagSuggestions].slice(0, 8);

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function highlightText(text: string, query: string): string {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
