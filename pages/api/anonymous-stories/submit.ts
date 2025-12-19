import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';

// Simple HTML sanitization function
const sanitizeHTML = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^<]*>/gi, '')
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .trim();
};

// Define type for user data
interface UserData {
  role: string;
}

// Define proper error types
interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface SupabaseError extends DatabaseError {
  details?: string;
  hint?: string;
  code?: string;
}

import { rateLimits } from '@/lib/rate-limiter';

// ... (existing imports)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle POST request - submit new story
  if (req.method === 'POST') {
    // Apply rate limiting
    let isAllowed = false;
    rateLimits.stories(req, res, () => {
      isAllowed = true;
    });
    
    if (!isAllowed) {
      return; // Response already handled by rate limiter
    }

    try {
      // Get admin client
      const supabaseAdmin = await getSupabaseAdmin();
      
      // Test database connection first
      console.log('Testing database connection...');
      const { error: testError } = await supabaseAdmin
        .from('anonymous_stories')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        return res.status(500).json({ 
          error: 'Database connection failed', 
          details: testError.message 
        });
      }
      
      console.log('Database connection test passed');
      
      const { title, content, category } = req.body;

      // Validate input
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      if (typeof title !== 'string' || typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid input types' });
      }

      // Sanitize content to prevent XSS
      const sanitizedTitle = sanitizeHTML(title.trim());
      const sanitizedContent = sanitizeHTML(content.trim());

      // Check for malicious patterns
      const maliciousPatterns = /<script|javascript:|on\w+=/gi;
      if (maliciousPatterns.test(sanitizedContent) || maliciousPatterns.test(sanitizedTitle)) {
        return res.status(400).json({ error: 'Invalid content detected' });
      }

      if (sanitizedTitle.length < 5) {
        return res.status(400).json({ error: 'Title must be at least 5 characters' });
      }

      if (sanitizedContent.length < 10) {
        return res.status(400).json({ error: 'Story must be at least 10 characters' });
      }

      if (sanitizedContent.length > 2000) {
        return res.status(400).json({ error: 'Story must be less than 2000 characters' });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({ error: 'Title must be less than 200 characters' });
      }

      // Validate category
      const validCategories = ['general', 'campus-life', 'academics', 'relationships', 'personal-growth', 'struggles', 'achievements'];
      const storyCategory = category || 'general';
      if (!validCategories.includes(storyCategory)) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      // Determine author type based on authentication and role
      let authorType = 'non_user'; // Default for non-authenticated users
      
      // Check if user is authenticated (this would require auth token in headers)
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
          );
          
          if (!authError && user) {
            // Check if the authenticated user is an admin
            const { data: userData, error: userError } = await supabaseAdmin
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single();
            
            if (!userError && userData) {
              const userRole = (userData as unknown as UserData).role;
              if (userRole === 'admin' || userRole === 'editor') {
                authorType = 'admin';
              } else {
                authorType = 'user';
              }
            } else {
              authorType = 'user';
            }
          }
        } catch {
          // If auth fails, keep as non_user
          console.log('Auth check failed, treating as non-user');
        }
      }

      // Insert the story with service role bypass
      let story, insertError;
      
      try {
        // Try direct service role insert with explicit auth context
        const result = await supabaseAdmin
          .from('anonymous_stories')
          .insert({
            title: sanitizedTitle,
            content: sanitizedContent,
            category: storyCategory,
            author_type: authorType,
            status: 'pending', // All stories start as pending
          } as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- TODO: Fix Supabase type resolution
          .select()
          .single();
        
        story = result.data;
        insertError = result.error;
        
        console.log('Insert result:', { story: !!story, error: insertError?.message });
      } catch (error) {
        console.error('Insert exception:', error);
        insertError = error;
      }

      // If normal insert fails, try minimal data insert
      if (insertError) {
        console.log('Normal insert failed, trying minimal data approach:', (insertError as SupabaseError).message);
        
        try {
          const minimalResult = await supabaseAdmin
            .from('anonymous_stories')
            .insert({
              title: sanitizedTitle,
              content: sanitizedContent,
              category: storyCategory,
              author_type: authorType,
              status: 'pending'
            } as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- TODO: Fix Supabase type resolution
            .select('id, title, created_at')
            .single();
          
          if (minimalResult.error) {
            throw minimalResult.error;
          }
          
          story = minimalResult.data;
          insertError = null;
          console.log('Minimal insert succeeded:', story);
        } catch (minimalError) {
          console.error('Minimal insert also failed:', minimalError);
          insertError = minimalError;
        }
      }

      if (insertError) {
        const error = insertError as SupabaseError;
        console.error('Database error inserting story:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          table: 'anonymous_stories',
          data: {
            title: sanitizedTitle.substring(0, 50),
            content: sanitizedContent.substring(0, 50),
            category: storyCategory,
            author_type: authorType
          }
        });
        
        // Return detailed error to help debug
        return res.status(500).json({ 
          error: 'Database error', 
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Story submitted successfully! It will be reviewed by our team.',
        data: story,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      const errorDetails = dbError instanceof Error ? dbError.message : JSON.stringify(dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        details: errorDetails 
      });
    }
  }

  // Handle other methods
  return res.status(405).json({ error: 'Method not allowed' });
}
