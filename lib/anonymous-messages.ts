import { createClient } from '@supabase/supabase-js';

// Check for environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface AnonymousMessage {
  id: string;
  content: string;
  type: 'question' | 'response';
  status: 'pending' | 'approved' | 'declined';
  question_id?: string; // For responses, links to the question
  admin_question?: boolean; // True if this is an admin-posted question
  created_at: string;
  updated_at: string;
  likes_count?: number;
  reports_count?: number;
}

export interface AnonymousQuestion extends AnonymousMessage {
  type: 'question';
  admin_question: boolean;
  responses?: AnonymousMessage[];
}

// Submit anonymous message (question or response)
export async function submitAnonymousMessage(content: string, type: 'question' | 'response', questionId?: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized - missing environment variables');
  }
  
  try {
    const { data, error } = await supabase
      .from('anonymous_messages')
      .insert({
        content,
        type,
        question_id: questionId,
        status: 'pending',
        admin_question: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting anonymous message:', error);
    throw error;
  }
}

// Submit admin question
export async function submitAdminQuestion(content: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized - missing environment variables');
  }
  
  try {
    const { data, error } = await supabase
      .from('anonymous_messages')
      .insert({
        content,
        type: 'question',
        status: 'approved', // Admin questions are auto-approved
        admin_question: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting admin question:', error);
    throw error;
  }
}

// Get approved questions with their responses
export async function getApprovedQuestions() {
  if (!supabase) {
    console.error('Supabase client not initialized - missing environment variables');
    return []; // Return empty array instead of throwing
  }
  
  try {
    const { data, error } = await supabase
      .from('anonymous_messages')
      .select('*')
      .eq('type', 'question')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      // Check if table doesn't exist
      const errorCode = (error as { code?: string })?.code;
      if (
        error.message.includes('relation') ||
        error.message.includes('does not exist') ||
        error.message.includes('PGRST116') ||
        errorCode === '42P01' ||
        errorCode === 'PGRST116'
      ) {
        console.log('Anonymous messages table does not exist yet');
        return [];
      }
      throw error;
    }

    // Get responses for each question
    const questionsWithResponses = await Promise.all(
      (data || []).map(async (question: AnonymousMessage) => {
        const { data: responses, error: responsesError } = await supabase
          .from('anonymous_messages')
          .select('*')
          .eq('type', 'response')
          .eq('question_id', question.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: true });

        if (responsesError) {
          console.error('Error fetching responses for question:', responsesError);
          return { ...question, responses: [] };
        }

        return {
          ...question,
          responses: responses || [],
        };
      })
    );

    return questionsWithResponses;
  } catch (error) {
    console.error('Error getting approved questions:', error);
    throw error;
  }
}

// Get pending messages for admin review
export async function getPendingMessages() {
  if (!supabase) {
    console.error('Supabase client not initialized - missing environment variables');
    return []; // Return empty array instead of throwing
  }
  
  try {
    const { data, error } = await supabase
      .from('anonymous_messages')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      // Check if table doesn't exist
      const errorCode = (error as { code?: string })?.code;
      if (
        error.message.includes('relation') ||
        error.message.includes('PGRST116') ||
        errorCode === '42P01' ||
        errorCode === 'PGRST116'
      ) {
        console.log('Anonymous messages table does not exist yet');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error getting pending messages:', error);
    throw error;
  }
}

// Approve or decline message
export async function moderateMessage(messageId: string, status: 'approved' | 'declined') {
  if (!supabase) {
    throw new Error('Supabase client not initialized - missing environment variables');
  }
  
  try {
    const { data, error } = await supabase
      .from('anonymous_messages')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error moderating message:', error);
    throw error;
  }
}

// Like a message
export async function likeMessage(messageId: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized - missing environment variables');
  }
  
  try {
    const { data, error } = await supabase.rpc('increment_likes', {
      message_id: messageId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error liking message:', error);
    throw error;
  }
}

// Report a message
export async function reportMessage(messageId: string, reason: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized - missing environment variables');
  }
  
  try {
    const { data, error } = await supabase
      .from('message_reports')
      .insert({
        message_id: messageId,
        reason,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Increment reports count
    await supabase.rpc('increment_reports', { message_id: messageId });

    return data;
  } catch (error) {
    console.error('Error reporting message:', error);
    throw error;
  }
}
