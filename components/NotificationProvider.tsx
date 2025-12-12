import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSupabase } from './SupabaseProvider';
import toast from 'react-hot-toast';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

interface NotificationContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  enabled: true,
  setEnabled: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const userId = user?.id;
  const [enabled, setEnabled] = useState(true);
  const [userArticleIds, setUserArticleIds] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<{
    push_notifications: boolean;
    article_comments: boolean;
    email_notifications: boolean;
    new_followers: boolean;
    weekly_digest: boolean;
    security_alerts: boolean;
  }>({  
    push_notifications: true,
    article_comments: true,
    email_notifications: true,
    new_followers: true,
    weekly_digest: true,
    security_alerts: true
  });

  // Fetch user's articles and preferences for notification subscriptions
  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchUserData = async () => {
      try {
        // Fetch user's articles
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('id')
          .eq('author_id', userId);

        if (!articlesError && articles) {
          const articleIds = articles.map(a => a.id);
          setUserArticleIds(articleIds);
        }

        // Fetch user preferences from dedicated API
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          // Only make API call if we have a valid session
          if (session?.access_token) {
            const response = await fetch('/api/user/notification-preferences-simple', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data?.preferences) {
                setUserPreferences({
                  push_notifications: data.data.preferences.push_notifications ?? true,
                  article_comments: data.data.preferences.article_comments ?? true,
                  email_notifications: data.data.preferences.email_notifications ?? true,
                  new_followers: data.data.preferences.new_followers ?? true,
                  weekly_digest: data.data.preferences.weekly_digest ?? true,
                  security_alerts: data.data.preferences.security_alerts ?? true
                });
              }
            } else if (response.status === 401) {
              console.warn('Session expired or invalid token for notifications. Please sign in again.');
              // Avoid further retries or error noise
              return; 
            } else {
              console.log('Notification preferences API returned:', response.status);
            }
          }
        } catch (prefsError) {
          console.log('Could not load notification preferences:', prefsError);
          // Use defaults if preferences can't be loaded
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId, supabase]);

  // Subscribe to notifications for user's articles
  useEffect(() => {
    if (!userId || !supabase || !enabled || userArticleIds.length === 0) return;

    const newChannels: RealtimeChannel[] = [];

    // Subscribe to reactions on user's articles
    const reactionChannel = supabase
      .channel('user-article-reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
        },
        async (payload) => {
          if (!payload.new || !('article_id' in payload.new)) return;
          
          const articleId = payload.new.article_id as string;
          const actorId = payload.new.user_id as string;
          
          // Only notify if it's the user's article and not their own reaction
          if (userArticleIds.includes(articleId) && actorId !== userId) {
            // Fetch article and user details
            const { data: article } = await supabase
              .from('articles')
              .select('title')
              .eq('id', articleId)
              .single();

            // Fetch user data via API to avoid RLS issues
            let reactingUser = null;
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                const userResponse = await fetch(`/api/users/${actorId}`, {
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                });
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  reactingUser = userData.data;
                }
              }
            } catch (userError) {
              console.warn('Failed to fetch reacting user:', userError);
            }

            const reactionType = payload.new.reaction_type as string;
            const emoji = getReactionEmoji(reactionType);

            // Check if push notifications are enabled
            if (userPreferences.push_notifications) {
              toast.success(
                `${reactingUser?.name || 'Someone'} reacted ${emoji} to "${article?.title || 'your article'}"`,
                {
                  duration: 5000,
                  style: { cursor: 'pointer' },
                }
              );
            }
          }
        }
      )
      .subscribe();

    newChannels.push(reactionChannel);

    // Subscribe to bookmarks on user's articles
    const bookmarkChannel = supabase
      .channel('user-article-bookmarks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
        },
        async (payload) => {
          if (!payload.new || !('article_id' in payload.new)) return;
          
          const articleId = payload.new.article_id as string;
          const actorId = payload.new.user_id as string;
          
          // Only notify if it's the user's article and not their own bookmark
          if (userArticleIds.includes(articleId) && actorId !== userId) {
            // Fetch article and user details
            const { data: article } = await supabase
              .from('articles')
              .select('title')
              .eq('id', articleId)
              .single();

            // Fetch user data via API to avoid RLS issues
            let bookmarkingUser = null;
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                const userResponse = await fetch(`/api/users/${actorId}`, {
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                });
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  bookmarkingUser = userData.data;
                }
              }
            } catch (userError) {
              console.warn('Failed to fetch bookmarking user:', userError);
            }

            // Check if push notifications are enabled
            if (userPreferences.push_notifications) {
              toast.success(
                `${bookmarkingUser?.name || 'Someone'} bookmarked "${article?.title || 'your article'}"`,
                {
                  duration: 5000,
                  style: { cursor: 'pointer' },
                }
              );
            }
          }
        }
      )
      .subscribe();

    newChannels.push(bookmarkChannel);

    // Subscribe to comments on user's articles
    const commentChannel = supabase
      .channel('user-article-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        async (payload) => {
          if (!payload.new || !('article_id' in payload.new)) return;
          
          const articleId = payload.new.article_id as string;
          const actorId = payload.new.user_id as string;
          
          // Only notify if it's the user's article and not their own comment
          if (userArticleIds.includes(articleId) && actorId !== userId) {
            // Fetch article and user details
            const { data: article } = await supabase
              .from('articles')
              .select('title')
              .eq('id', articleId)
              .single();

            // Fetch user data via API to avoid RLS issues
            let commentingUser = null;
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                const userResponse = await fetch(`/api/users/${actorId}`, {
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                });
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  commentingUser = userData.data;
                }
              }
            } catch (userError) {
              console.warn('Failed to fetch commenting user:', userError);
            }

            const content = payload.new.content as string;
            const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;

            // Check if article comments and push notifications are enabled
            if (userPreferences.article_comments && userPreferences.push_notifications) {
              toast.success(
                `${commentingUser?.name || 'Someone'} commented on "${article?.title || 'your article'}": "${preview}"`,
                {
                  duration: 6000,
                  style: { cursor: 'pointer' },
                }
              );
            }
          }
        }
      )
      .subscribe();

    newChannels.push(commentChannel);

    // Cleanup function
    return () => {
      newChannels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId, supabase, enabled, userArticleIds, router.asPath, userPreferences.article_comments, userPreferences.push_notifications]);

  const value = {
    enabled,
    setEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to get emoji for reaction type
function getReactionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    thumbsup: '👍',
    heart: '❤️',
    smile: '😊',
    star: '⭐',
    meh: '😐',
  };
  return emojiMap[type] || '👍';
}
