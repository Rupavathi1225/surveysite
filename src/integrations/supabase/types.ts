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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contest_entries: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          points: number | null
          rank: number | null
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          points?: number | null
          rank?: number | null
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          points?: number | null
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_entries_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_notifications: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          notification_type: string | null
          notified_at: string | null
          points_earned: number | null
          rank: number | null
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          notification_type?: string | null
          notified_at?: string | null
          points_earned?: number | null
          rank?: number | null
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          notification_type?: string | null
          notified_at?: string | null
          points_earned?: number | null
          rank?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_notifications_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          end_date: string
          excluded_users: string[] | null
          id: string
          start_date: string
          status: string | null
          title: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          end_date: string
          excluded_users?: string[] | null
          id?: string
          start_date: string
          status?: string | null
          title: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          end_date?: string
          excluded_users?: string[] | null
          id?: string
          start_date?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      earning_history: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          provider_id: string | null
          status: string | null
          survey_link_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          provider_id?: string | null
          status?: string | null
          survey_link_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          provider_id?: string | null
          status?: string | null
          survey_link_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earning_history_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "survey_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_history_survey_link_id_fkey"
            columns: ["survey_link_id"]
            isOneToOne: false
            referencedRelation: "survey_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earning_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          email: string
          id: string
          ip_address: string | null
          login_at: string
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          ip_address?: string | null
          login_at?: string
          status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          ip_address?: string | null
          login_at?: string
          status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          from_user: string | null
          id: string
          is_read: boolean | null
          message: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_user?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_user?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          content: string
          created_at: string
          id: string
          status: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          status?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_global: boolean
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          name: string
          slug: string
          status: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          fee_percentage: number | null
          id: string
          minimum_amount: number | null
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string
          fee_percentage?: number | null
          id?: string
          minimum_amount?: number | null
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string
          fee_percentage?: number | null
          id?: string
          minimum_amount?: number | null
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          cash_balance: number | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_verified: boolean | null
          last_name: string | null
          lifetime_payouts: number | null
          locked_points: number | null
          mobile: string | null
          payment_info: Json | null
          payment_method: string | null
          points_balance: number | null
          referral_code: string | null
          referral_count: number | null
          referral_earnings: number | null
          referred_by: string | null
          status: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          cash_balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          lifetime_payouts?: number | null
          locked_points?: number | null
          mobile?: string | null
          payment_info?: Json | null
          payment_method?: string | null
          points_balance?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          cash_balance?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          lifetime_payouts?: number | null
          locked_points?: number | null
          mobile?: string | null
          payment_info?: Json | null
          payment_method?: string | null
          points_balance?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promocode_uses: {
        Row: {
          created_at: string
          id: string
          promocode_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promocode_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promocode_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promocode_uses_promocode_id_fkey"
            columns: ["promocode_id"]
            isOneToOne: false
            referencedRelation: "promocodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocode_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promocodes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          reward: number
          status: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          reward: number
          status?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          reward?: number
          status?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string | null
          subject: string
          ticket_no: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string | null
          subject: string
          ticket_no: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string | null
          subject?: string
          ticket_no?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_links: {
        Row: {
          button_gradient: string | null
          button_text: string | null
          color_code: string | null
          content: string | null
          country: string | null
          created_at: string
          id: string
          image_url: string | null
          is_recommended: boolean | null
          level: number | null
          link: string | null
          name: string
          offer_id: string | null
          payout: number
          provider_id: string | null
          rating: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          button_gradient?: string | null
          button_text?: string | null
          color_code?: string | null
          content?: string | null
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_recommended?: boolean | null
          level?: number | null
          link?: string | null
          name: string
          offer_id?: string | null
          payout?: number
          provider_id?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          button_gradient?: string | null
          button_text?: string | null
          color_code?: string | null
          content?: string | null
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_recommended?: boolean | null
          level?: number | null
          link?: string | null
          name?: string
          offer_id?: string | null
          payout?: number
          provider_id?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_links_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "survey_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_providers: {
        Row: {
          button_gradient: string | null
          button_text: string | null
          code: string
          color_code: string | null
          content: string | null
          created_at: string
          id: string
          iframe_code: string | null
          iframe_keys: Json | null
          image_url: string | null
          is_recommended: boolean | null
          level: number | null
          name: string
          payout_type: string | null
          point_percentage: number | null
          postback_keys: Json | null
          postback_url: string | null
          rating: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          button_gradient?: string | null
          button_text?: string | null
          code: string
          color_code?: string | null
          content?: string | null
          created_at?: string
          id?: string
          iframe_code?: string | null
          iframe_keys?: Json | null
          image_url?: string | null
          is_recommended?: boolean | null
          level?: number | null
          name: string
          payout_type?: string | null
          point_percentage?: number | null
          postback_keys?: Json | null
          postback_url?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          button_gradient?: string | null
          button_text?: string | null
          code?: string
          color_code?: string | null
          content?: string | null
          created_at?: string
          id?: string
          iframe_code?: string | null
          iframe_keys?: Json | null
          image_url?: string | null
          is_recommended?: boolean | null
          level?: number | null
          name?: string
          payout_type?: string | null
          point_percentage?: number | null
          postback_keys?: Json | null
          postback_url?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_id: string
          admin_note: string | null
          amount: number
          created_at: string
          fee: number | null
          id: string
          payment_method: string
          status: string | null
          txn_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          admin_note?: string | null
          amount: number
          created_at?: string
          fee?: number | null
          id?: string
          payment_method: string
          status?: string | null
          txn_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          admin_note?: string | null
          amount?: number
          created_at?: string
          fee?: number | null
          id?: string
          payment_method?: string
          status?: string | null
          txn_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "subadmin"
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
      app_role: ["admin", "user", "subadmin"],
    },
  },
} as const
