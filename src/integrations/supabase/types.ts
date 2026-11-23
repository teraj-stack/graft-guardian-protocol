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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ebook_chapters: {
        Row: {
          body_md: string
          created_at: string
          day_from: number
          day_label: string
          day_to: number
          id: string
          order_idx: number
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string
          created_at?: string
          day_from: number
          day_label: string
          day_to: number
          id?: string
          order_idx?: number
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string
          created_at?: string
          day_from?: number
          day_label?: string
          day_to?: number
          id?: string
          order_idx?: number
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ebook_leads: {
        Row: {
          access_token: string
          consent: boolean
          created_at: string
          email: string
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          access_token: string
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          access_token?: string
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      pricing_overrides: {
        Row: {
          code: string
          hidden: boolean
          restore_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          hidden?: boolean
          restore_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          hidden?: boolean
          restore_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminder_sends: {
        Row: {
          channel: string
          error: string | null
          id: string
          provider_message_id: string | null
          sent_at: string
          status: string
          subscription_id: string
          week: number
        }
        Insert: {
          channel: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string
          status: string
          subscription_id: string
          week: number
        }
        Update: {
          channel?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string
          status?: string
          subscription_id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "reminder_sends_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "reminder_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_subscriptions: {
        Row: {
          active: boolean
          channel_email: boolean
          channel_sms: boolean
          consent_at: string
          created_at: string
          email: string
          id: string
          phone: string | null
          selected_weeks: number[]
          surgery_date: string
          token_rotated_at: string
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          channel_email?: boolean
          channel_sms?: boolean
          consent_at?: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          selected_weeks?: number[]
          surgery_date: string
          token_rotated_at?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          channel_email?: boolean
          channel_sms?: boolean
          consent_at?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          selected_weeks?: number[]
          surgery_date?: string
          token_rotated_at?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_sends: {
        Row: {
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          document_hash: string | null
          error: string | null
          id: string
          opened_at: string | null
          provider_message_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subscription_id: string | null
          template_version: string
          updated_at: string
          week: number
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          document_hash?: string | null
          error?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          template_version: string
          updated_at?: string
          week: number
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          document_hash?: string | null
          error?: string | null
          id?: string
          opened_at?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          template_version?: string
          updated_at?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_sends_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "reminder_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_watch_snapshots: {
        Row: {
          created_at: string
          findings: Json
          fingerprint: string
          id: string
        }
        Insert: {
          created_at?: string
          findings: Json
          fingerprint: string
          id?: string
        }
        Update: {
          created_at?: string
          findings?: Json
          fingerprint?: string
          id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      web_vitals: {
        Row: {
          connection: string | null
          country: string | null
          created_at: string
          device: string
          id: number
          metric: string
          metric_id: string | null
          nav_type: string | null
          page: string
          rating: string | null
          session_id: string
          user_agent: string | null
          value: number
        }
        Insert: {
          connection?: string | null
          country?: string | null
          created_at?: string
          device: string
          id?: number
          metric: string
          metric_id?: string | null
          nav_type?: string | null
          page: string
          rating?: string | null
          session_id: string
          user_agent?: string | null
          value: number
        }
        Update: {
          connection?: string | null
          country?: string | null
          created_at?: string
          device?: string
          id?: number
          metric?: string
          metric_id?: string | null
          nav_type?: string | null
          page?: string
          rating?: string | null
          session_id?: string
          user_agent?: string | null
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deactivate_and_rotate_subscription: {
        Args: { _token: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_unsubscribe_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      internal_cron_secret: { Args: never; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reminder_weeks_valid: { Args: { weeks: number[] }; Returns: boolean }
      security_watch_check: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    },
  },
} as const
