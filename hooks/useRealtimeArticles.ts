import { useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import toast from 'react-hot-toast';

interface ArticleRecord {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
}

interface ArticleEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record?: ArticleRecord;
  old_record?: ArticleRecord;
  new_record?: ArticleRecord;
}

interface UseRealtimeArticlesOptions {
  onArticleChange?: (event: ArticleEvent) => void;
  enabled?: boolean;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record?: ArticleRecord;
  old_record?: ArticleRecord;
  new_record?: ArticleRecord;
}

export const useRealtimeArticles = ({
  onArticleChange,
  enabled = true
}: UseRealtimeArticlesOptions = {}) => {
  const { supabase } = useSupabase();
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const setupRealtimeSubscription = useCallback(() => {
    if (!enabled || !supabase) return;

    console.log('Setting up realtime articles subscription...');

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Set up new subscription for articles table
    const subscription = supabase
      .channel('articles-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'articles'
        },
        (payload: RealtimePayload) => {
          console.log('Realtime article change detected:', payload);
          
          const event: ArticleEvent = {
            type: payload.eventType,
            table: payload.table,
            record: payload.record,
            old_record: payload.old_record,
            new_record: payload.new_record
          };

          // Show toast notification for article changes
          switch (payload.eventType) {
            case 'INSERT':
              toast.success(`New article "${payload.record?.title}" created`);
              break;
            case 'UPDATE':
              const title = payload.new_record?.title || payload.record?.title;
              const status = payload.new_record?.status || payload.record?.status;
              toast.success(`Article "${title}" updated (${status})`);
              break;
            case 'DELETE':
              const deletedTitle = payload.old_record?.title || 'Unknown';
              toast.success(`Article "${deletedTitle}" deleted`);
              break;
          }

          // Call custom handler if provided
          if (onArticleChange) {
            onArticleChange(event);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to articles changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to articles changes');
          toast.error('Failed to enable real-time updates');
        }
      });

    subscriptionRef.current = subscription;
  }, [supabase, enabled, onArticleChange]);

  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('Cleaning up realtime articles subscription...');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      cleanupSubscription();
    };
  }, [setupRealtimeSubscription, cleanupSubscription]);

  // Manual refresh trigger for when components want to force refresh
  const triggerRefresh = useCallback(() => {
    if (onArticleChange) {
      // Simulate a refresh event
      onArticleChange({
        type: 'UPDATE',
        table: 'articles',
        record: undefined
      });
    }
  }, [onArticleChange]);

  return {
    isConnected: !!subscriptionRef.current,
    triggerRefresh,
    cleanup: cleanupSubscription,
    setup: setupRealtimeSubscription
  };
};
