export type Database = {
  public: {
    Tables: {
      neighborhoods: {
        Row: {
          id: string;
          name: string;
          city: string;
          district: string;
          boundary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          district: string;
          boundary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          district?: string;
          boundary?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          avatar_url: string | null;
          neighborhood_id: string | null;
          location_verified: boolean;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          avatar_url?: string | null;
          neighborhood_id?: string | null;
          location_verified?: boolean;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          handle?: string;
          display_name?: string;
          avatar_url?: string | null;
          neighborhood_id?: string | null;
          location_verified?: boolean;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          neighborhood_id: string;
          title: string;
          description: string;
          category: 'shoes' | 'toy' | 'clothing' | 'bag' | 'electronics' | 'wallet' | 'keys' | 'pet' | 'other';
          post_type: 'lost' | 'found';
          status: 'active' | 'resolved';
          location: string | null;
          location_name: string | null;
          image_urls: string[];
          verification_question: string | null;
          verification_answer_hash: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          neighborhood_id: string;
          title: string;
          description: string;
          category: 'shoes' | 'toy' | 'clothing' | 'bag' | 'electronics' | 'wallet' | 'keys' | 'pet' | 'other';
          post_type: 'lost' | 'found';
          status?: 'active' | 'resolved';
          location?: string | null;
          location_name?: string | null;
          image_urls?: string[];
          verification_question?: string | null;
          verification_answer_hash?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          neighborhood_id?: string;
          title?: string;
          description?: string;
          category?: 'shoes' | 'toy' | 'clothing' | 'bag' | 'electronics' | 'wallet' | 'keys' | 'pet' | 'other';
          post_type?: 'lost' | 'found';
          status?: 'active' | 'resolved';
          location?: string | null;
          location_name?: string | null;
          image_urls?: string[];
          verification_question?: string | null;
          verification_answer_hash?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          mentions: string[];
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          mentions?: string[];
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          mentions?: string[];
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      claims: {
        Row: {
          id: string;
          post_id: string;
          claimant_id: string;
          answer_hash: string | null;
          status: 'pending' | 'verified' | 'rejected';
          failed_attempts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          claimant_id: string;
          answer_hash?: string | null;
          status?: 'pending' | 'verified' | 'rejected';
          failed_attempts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          claimant_id?: string;
          answer_hash?: string | null;
          status?: 'pending' | 'verified' | 'rejected';
          failed_attempts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: 'new_post' | 'comment' | 'mention' | 'claim' | 'resolved' | 'lost_alert_match';
          post_id: string | null;
          actor_id: string | null;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          type: 'new_post' | 'comment' | 'mention' | 'claim' | 'resolved' | 'lost_alert_match';
          post_id?: string | null;
          actor_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          type?: 'new_post' | 'comment' | 'mention' | 'claim' | 'resolved' | 'lost_alert_match';
          post_id?: string | null;
          actor_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lost_alerts: {
        Row: {
          id: string;
          user_id: string;
          category: 'shoes' | 'toy' | 'clothing' | 'bag' | 'electronics' | 'wallet' | 'keys' | 'pet' | 'other';
          keywords: string[];
          neighborhood_id: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: 'shoes' | 'toy' | 'clothing' | 'bag' | 'electronics' | 'wallet' | 'keys' | 'pet' | 'other';
          keywords?: string[];
          neighborhood_id: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: 'shoes' | 'toy' | 'clothing' | 'bag' | 'electronics' | 'wallet' | 'keys' | 'pet' | 'other';
          keywords?: string[];
          neighborhood_id?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      phone_hashes: {
        Row: {
          id: string;
          user_id: string;
          phone_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          phone_hash?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      contacts_matches: {
        Row: {
          id: string;
          user_id: string;
          matched_user_id: string;
          contact_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          matched_user_id: string;
          contact_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          matched_user_id?: string;
          contact_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          post_id: string | null;
          comment_id: string | null;
          reason: string;
          status: 'pending' | 'reviewed' | 'dismissed';
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason: string;
          status?: 'pending' | 'reviewed' | 'dismissed';
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason?: string;
          status?: 'pending' | 'reviewed' | 'dismissed';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
