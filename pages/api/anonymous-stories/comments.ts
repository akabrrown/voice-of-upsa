import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/database-server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database-types';

type AnonymousStory = Database['public']['Tables']['anonymous_stories']['Row'];
type AnonymousStoryCommentInsert = Database['public']['Tables']['anonymous_story_comments']['Insert'];

const COMMENT_RATE_LIMIT = 8; // max posts per window
const COMMENT_RATE_WINDOW_MS = 60 * 1000; // 1 minute
const rateStore = new Map<string, { count: number; reset: number }>();

function getClientIp(req: NextApiRequest): string {
  const header = (req.headers['x-forwarded-for'] as string) || '';
  if (header) return header.split(',')[0]?.trim() || 'unknown';
  return req.socket.remoteAddress || 'unknown';
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const existing = rateStore.get(key);
  if (!existing || existing.reset < now) {
    rateStore.set(key, { count: 1, reset: now + COMMENT_RATE_WINDOW_MS });
    return;
  }
  if (existing.count >= COMMENT_RATE_LIMIT) {
    throw new Error('RATE_LIMIT');
  }
  existing.count += 1;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = getClientIp(req);

  if (req.method === 'GET') {
    const { storyId, page = '1', pageSize = '25' } = req.query;
    if (!storyId || typeof storyId !== 'string') {
      return res.status(400).json({ success: false, error: 'storyId is required' });
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limit = Math.min(Math.max(5, Number(pageSize) || 25), 100);
    const from = (pageNum - 1) * limit;
    const to = from + limit - 1;

    try {
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error('Database unavailable');
      }
      const supabase = supabaseAdmin as SupabaseClient<Database>;
      const { data, error, count } = await supabase
        .from('anonymous_story_comments')
        .select('*', { count: 'exact' })
        .eq('story_id', storyId)
        .eq('status', 'visible')
        .order('created_at', { ascending: true })
        .range(from, to);
      if (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ success: false, error: 'Failed to load comments' });
      }

      return res.status(200).json({
        success: true,
        data: data ?? [],
        pagination: {
          currentPage: pageNum,
          pageSize: limit,
          total: count ?? 0,
          totalPages: count ? Math.max(1, Math.ceil(count / limit)) : 1,
        },
      });
    } catch (error) {
      console.error('Unexpected error loading comments:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      enforceRateLimit(`ip:${ip}`);
    } catch {
      return res.status(429).json({
        success: false,
        error: 'Too many comments in a short period. Please slow down.',
      });
    }

    const { storyId, content, sessionId } = req.body || {};
    if (!storyId || typeof storyId !== 'string') {
      return res.status(400).json({ success: false, error: 'storyId is required' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    const sanitizedContent = content.trim();
    const sessionFingerprint = typeof sessionId === 'string' ? sessionId.slice(0, 128) : null;
    const userAgent = typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent'].slice(0, 255)
      : null;
    const ipHash = ip && ip !== 'unknown'
      ? crypto.createHash('sha256').update(ip).digest('hex')
      : null;

    try {
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error('Database unavailable');
      }
      const supabase = supabaseAdmin as SupabaseClient<Database>;

      const { data: story, error: storyError } = await supabase
        .from('anonymous_stories')
        .select('id, status')
        .eq('id', storyId)
        .single<Pick<AnonymousStory, 'id' | 'status'>>();

      if (storyError || !story) {
        return res.status(404).json({ success: false, error: 'Story not found' });
      }
      if (story.status !== 'approved') {
        return res.status(400).json({ success: false, error: 'Story is not available for comments' });
      }

      const insertPayload: AnonymousStoryCommentInsert = {
        story_id: storyId,
        content: sanitizedContent,
        status: 'visible',
        session_fingerprint: sessionFingerprint,
        ip_hash: ipHash,
        user_agent: userAgent,
        metadata: null,
      };

      const { data: insertedComment, error: insertError } = await supabase
        .from('anonymous_story_comments')
        // @ts-expect-error - forcing insert
        .insert(insertPayload)
        .select('*')
        .single();

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        return res.status(500).json({ success: false, error: 'Failed to save comment' });
      }

      return res.status(201).json({ success: true, data: insertedComment });
    } catch (error) {
      console.error('Unexpected error creating comment:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
