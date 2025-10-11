export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          category_id: string | null
          cost_type: string
          created_at: string
          error_message: string | null
          generation_time_seconds: number | null
          id: string
          image_url: string | null
          is_public: boolean
          optimized_prompt: string | null
          prompt: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          cost_type: string
          created_at?: string
          error_message?: string | null
          generation_time_seconds?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          optimized_prompt?: string | null
          prompt: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          cost_type?: string
          created_at?: string
          error_message?: string | null
          generation_time_seconds?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          optimized_prompt?: string | null
          prompt?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          page_title: string | null
          page_url: string | null
          properties: Json | null
          referrer: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_type: string
          id?: string
          page_title?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          page_title?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          country: string | null
          device_type: string | null
          entry_page: string | null
          events_count: number | null
          exit_page: string | null
          id: string
          os: string | null
          page_views: number | null
          referrer: string | null
          session_end: string | null
          session_start: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          device_type?: string | null
          entry_page?: string | null
          events_count?: number | null
          exit_page?: string | null
          id?: string
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          session_end?: string | null
          session_start?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          device_type?: string | null
          entry_page?: string | null
          events_count?: number | null
          exit_page?: string | null
          id?: string
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          session_end?: string | null
          session_start?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      artwork_likes: {
        Row: {
          artwork_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_likes_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "user_artwork"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          level: number
          name: string
          order_position: number | null
          parent_id: string | null
          path: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          level?: number
          name: string
          order_position?: number | null
          parent_id?: string | null
          path: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          level?: number
          name?: string
          order_position?: number | null
          parent_id?: string | null
          path?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      color_inspiration_cache: {
        Row: {
          created_at: string
          generated_image_data: string
          id: string
          source_image_url: string
          style: string
        }
        Insert: {
          created_at?: string
          generated_image_data: string
          id?: string
          source_image_url: string
          style: string
        }
        Update: {
          created_at?: string
          generated_image_data?: string
          id?: string
          source_image_url?: string
          style?: string
        }
        Relationships: []
      }
      coloring_history: {
        Row: {
          action_type: string
          coloring_page_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          coloring_page_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          coloring_page_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coloring_history_coloring_page_id_fkey"
            columns: ["coloring_page_id"]
            isOneToOne: false
            referencedRelation: "coloring_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      coloring_pages: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          download_count: number
          id: string
          image_url: string
          is_featured: boolean
          last_posted_at: string | null
          published_at: string | null
          scheduled_publish_at: string | null
          series_id: string | null
          series_order: number | null
          series_slug: string | null
          series_title: string | null
          series_total: number | null
          slug: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          download_count?: number
          id?: string
          image_url: string
          is_featured?: boolean
          last_posted_at?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          series_id?: string | null
          series_order?: number | null
          series_slug?: string | null
          series_title?: string | null
          series_total?: number | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          download_count?: number
          id?: string
          image_url?: string
          is_featured?: boolean
          last_posted_at?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          series_id?: string | null
          series_order?: number | null
          series_slug?: string | null
          series_title?: string | null
          series_total?: number | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coloring_pages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          replied: boolean
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          replied?: boolean
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          replied?: boolean
          subject?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          name: string
          price_usd: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          name: string
          price_usd: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          name?: string
          price_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          generation_id: string | null
          id: string
          notes: string | null
          package_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          notes?: string | null
          package_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          coloring_page_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          coloring_page_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          coloring_page_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_coloring_page_id_fkey"
            columns: ["coloring_page_id"]
            isOneToOne: false
            referencedRelation: "coloring_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_stats: {
        Row: {
          category_id: string | null
          created_at: string | null
          difficulty: string
          generated_at: string
          generation_type: string
          id: string
          pages_count: number
          success: boolean
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          difficulty: string
          generated_at: string
          generation_type: string
          id?: string
          pages_count: number
          success: boolean
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          difficulty?: string
          generated_at?: string
          generation_type?: string
          id?: string
          pages_count?: number
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "generation_stats_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      print_basket: {
        Row: {
          added_at: string | null
          coloring_page_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          coloring_page_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          coloring_page_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_basket_coloring_page_id_fkey"
            columns: ["coloring_page_id"]
            isOneToOne: false
            referencedRelation: "coloring_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      publishing_jobs: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          is_recurring: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          publish_count: number
          schedule_days: number[] | null
          schedule_time: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          publish_count?: number
          schedule_days?: number[] | null
          schedule_time: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          publish_count?: number
          schedule_days?: number[] | null
          schedule_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reddit_auto_config: {
        Row: {
          allowed_subreddits: string[] | null
          created_at: string | null
          hours_between_posts: number | null
          id: string
          is_enabled: boolean | null
          last_post_at: string | null
          max_replies_per_post: number | null
          minutes_between_replies: number | null
          posts_per_day: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_subreddits?: string[] | null
          created_at?: string | null
          hours_between_posts?: number | null
          id?: string
          is_enabled?: boolean | null
          last_post_at?: string | null
          max_replies_per_post?: number | null
          minutes_between_replies?: number | null
          posts_per_day?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_subreddits?: string[] | null
          created_at?: string | null
          hours_between_posts?: number | null
          id?: string
          is_enabled?: boolean | null
          last_post_at?: string | null
          max_replies_per_post?: number | null
          minutes_between_replies?: number | null
          posts_per_day?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_media_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          platform: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          ai_generated: boolean | null
          coloring_page_id: string | null
          created_at: string | null
          description: string | null
          engagement_score: number | null
          error_message: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          platform: string
          post_id: string | null
          post_url: string | null
          posted_at: string | null
          reply_count: number | null
          status: string
          subreddit: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          coloring_page_id?: string | null
          created_at?: string | null
          description?: string | null
          engagement_score?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          platform: string
          post_id?: string | null
          post_url?: string | null
          posted_at?: string | null
          reply_count?: number | null
          status?: string
          subreddit?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          coloring_page_id?: string | null
          created_at?: string | null
          description?: string | null
          engagement_score?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          platform?: string
          post_id?: string | null
          post_url?: string | null
          posted_at?: string | null
          reply_count?: number | null
          status?: string
          subreddit?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_coloring_page_id_fkey"
            columns: ["coloring_page_id"]
            isOneToOne: false
            referencedRelation: "coloring_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          id: string
          metadata: Json | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_artwork: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_public: boolean | null
          likes_count: number | null
          original_coloring_page_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_public?: boolean | null
          likes_count?: number | null
          original_coloring_page_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_public?: boolean | null
          likes_count?: number | null
          original_coloring_page_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_artwork_original_coloring_page_id_fkey"
            columns: ["original_coloring_page_id"]
            isOneToOne: false
            referencedRelation: "coloring_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_purchased: number
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          monthly_quota: number
          quota_reset_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_at: string | null
          subscription_end_date: string | null
          subscription_start_at: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          used_quota: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_quota?: number
          quota_reset_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_at?: string | null
          subscription_end_date?: string | null
          subscription_start_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          used_quota?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_quota?: number
          quota_reset_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_at?: string | null
          subscription_end_date?: string | null
          subscription_start_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          used_quota?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_unlock_achievements: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_download_count: {
        Args: { page_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      difficulty_level: "easy" | "medium" | "hard"
      subscription_tier: "free" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      difficulty_level: ["easy", "medium", "hard"],
      subscription_tier: ["free", "premium"],
    },
  },
} as const
