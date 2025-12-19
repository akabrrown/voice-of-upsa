// Database type definitions for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          featured_image: string | null;
          contributor_name: string | null;
          author_id: string;
          category_id: string | null;
          status: 'draft' | 'published' | 'archived';
          display_location: 'homepage' | 'category_page' | 'both' | 'none';
          views_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          featured_image: string | null;
          parent_id: string | null;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'user' | 'admin' | 'editor';
          avatar_url: string | null;
          bio: string | null;
          status: 'active' | 'archived';
          created_at: string;
          updated_at: string;
          last_sign_in: string | null;
          archived_at: string | null;
          archived_by: string | null;
          archive_reason: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      comments: {
        Row: {
          id: string;
          article_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          status: 'pending' | 'approved' | 'rejected';
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          status: 'new' | 'read' | 'in_progress' | 'resolved';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contact_messages']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
      };
      reactions: {
        Row: {
          id: string;
          article_id: string;
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['article_views']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['article_views']['Insert']>;
      };
      article_views: {
        Row: {
          id: string;
          article_id: string;
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['article_views']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['article_views']['Insert']>;
      };
      settings: {
        Row: {
          id: string;
          site_name: string;
          site_description: string;
          site_url: string;
          contact_email: string;
          notification_email: string;
          site_logo: string | null;
          social_links: Json;
          maintenance_mode: boolean;
          allow_comments: boolean;
          moderate_comments: boolean;
          max_upload_size: number;
          allowed_image_types: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
      anonymous_messages: {
        Row: {
          id: string;
          content: string;
          type: 'question' | 'response';
          status: 'pending' | 'approved' | 'declined';
          question_id: string | null;
          admin_question: boolean;
          likes_count: number;
          reports_count: number;
          decline_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['anonymous_messages']['Row'], 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'reports_count'>;
        Update: Partial<Database['public']['Tables']['anonymous_messages']['Insert']>;
      };
      message_reports: {
        Row: {
          id: string;
          message_id: string;
          reason: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['message_reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['message_reports']['Insert']>;
      };
      anonymous_stories: {
        Row: {
          id: string;
          title: string | null;
          content: string | null;
          category: string | null;
          author_type: string | null;
          status: 'pending' | 'approved' | 'declined';
          featured: boolean;
          reports_count: number;
          views_count: number;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['anonymous_stories']['Row'], 'id' | 'created_at' | 'updated_at' | 'reports_count' | 'featured' | 'views_count' | 'likes_count'>;
        Update: Partial<Database['public']['Tables']['anonymous_stories']['Insert']>;
      };
      story_reports: {
        Row: {
          id: string;
          story_id: string;
          reason: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['story_reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_reports']['Insert']>;
      };
      story_likes: {
        Row: {
          id: string;
          story_id: string;
          user_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['story_likes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_likes']['Insert']>;
      };
      story_views: {
        Row: {
          id: string;
          story_id: string;
          user_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['story_views']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_views']['Insert']>;
      };
      ad_submissions: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          company: string | null;
          business_type: string;
          ad_type: string;
          ad_title: string;
          ad_description: string;
          target_audience: string;
          budget: string;
          duration: string;
          custom_duration: string | null;
          start_date: string;
          website: string | null;
          additional_info: string | null;
          terms_accepted: boolean;
          attachment_urls: string[] | null;
          status: string;
          payment_status: string;
          payment_reference: string | null;
          payment_amount: number | null;
          payment_date: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ad_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ad_submissions']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'user' | 'admin' | 'editor';
      article_status: 'draft' | 'published' | 'archived';
      comment_status: 'pending' | 'approved' | 'rejected';
      message_status: 'new' | 'read' | 'in_progress' | 'resolved';
      display_location: 'homepage' | 'category_page' | 'both' | 'none';
      reaction_type: 'thumbsup' | 'heart' | 'smile' | 'star' | 'meh';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
