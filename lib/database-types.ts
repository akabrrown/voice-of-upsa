// Database type definitions for Supabase
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
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
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
          user_id: string;
          reaction_type: 'thumbsup' | 'heart' | 'smile' | 'star' | 'meh';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reactions']['Insert']>;
      };
      settings: {
        Row: {
          id: string;
          site_name: string;
          site_description: string;
          site_url: string;
          contact_email: string;
          notification_email: string;
          social_links: {
            facebook: string;
            twitter: string;
            instagram: string;
            linkedin: string;
            tiktok: string;
          };
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
