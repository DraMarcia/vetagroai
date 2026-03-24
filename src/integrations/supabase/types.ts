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
      ai_response_cache: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          request_hash: string
          request_signature: string | null
          response_text: string
          tool_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          request_hash: string
          request_signature?: string | null
          response_text: string
          tool_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          request_hash?: string
          request_signature?: string | null
          response_text?: string
          tool_name?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          ai_model: string | null
          created_at: string
          id: string
          response_time_ms: number | null
          tokens_input: number | null
          tokens_output: number | null
          tool_name: string
          user_id: string
          user_plan: string | null
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          id?: string
          response_time_ms?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          tool_name: string
          user_id: string
          user_plan?: string | null
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          id?: string
          response_time_ms?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          tool_name?: string
          user_id?: string
          user_plan?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reports: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          profile_id: string
          report_type: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          profile_id: string
          report_type?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          report_type?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          profile_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          profile_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          profile_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_memory: {
        Row: {
          created_at: string
          id: string
          memory_key: string
          memory_value: string
          profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_key: string
          memory_value: string
          profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_key?: string
          memory_value?: string
          profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits_reset_at: string | null
          current_plan: Database["public"]["Enums"]["subscription_plan"] | null
          daily_credits: number | null
          full_name: string | null
          id: string
          is_professional: boolean | null
          plan_expires_at: string | null
          professional_registry_number: string | null
          professional_registry_type:
            | Database["public"]["Enums"]["professional_registry_type"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_reset_at?: string | null
          current_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          daily_credits?: number | null
          full_name?: string | null
          id?: string
          is_professional?: boolean | null
          plan_expires_at?: string | null
          professional_registry_number?: string | null
          professional_registry_type?:
            | Database["public"]["Enums"]["professional_registry_type"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_reset_at?: string | null
          current_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          daily_credits?: number | null
          full_name?: string | null
          id?: string
          is_professional?: boolean | null
          plan_expires_at?: string | null
          professional_registry_number?: string | null
          professional_registry_type?:
            | Database["public"]["Enums"]["professional_registry_type"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_entries: {
        Row: {
          id: string
          rate_key: string
          request_count: number
          window_end: string
          window_start: string
        }
        Insert: {
          id?: string
          rate_key: string
          request_count?: number
          window_end: string
          window_start?: string
        }
        Update: {
          id?: string
          rate_key?: string
          request_count?: number
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      territorial_agro_metrics: {
        Row: {
          calculation_method: string | null
          created_at: string
          emission_type: string | null
          estimated_emission_value: number | null
          herd_size_range: string | null
          id: string
          metadata: Json | null
          municipality: string | null
          production_system: string | null
          state: string | null
          tool_name: string
        }
        Insert: {
          calculation_method?: string | null
          created_at?: string
          emission_type?: string | null
          estimated_emission_value?: number | null
          herd_size_range?: string | null
          id?: string
          metadata?: Json | null
          municipality?: string | null
          production_system?: string | null
          state?: string | null
          tool_name: string
        }
        Update: {
          calculation_method?: string | null
          created_at?: string
          emission_type?: string | null
          estimated_emission_value?: number | null
          herd_size_range?: string | null
          id?: string
          metadata?: Json | null
          municipality?: string | null
          production_system?: string | null
          state?: string | null
          tool_name?: string
        }
        Relationships: []
      }
      tool_monitoring_logs: {
        Row: {
          created_at: string
          error_message: string | null
          error_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          request_id: string | null
          request_status: string | null
          response_time_ms: number | null
          tool_name: string
          tool_route: string | null
          user_id: string | null
          user_plan: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          request_id?: string | null
          request_status?: string | null
          response_time_ms?: number | null
          tool_name: string
          tool_route?: string | null
          user_id?: string | null
          user_plan?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          request_id?: string | null
          request_status?: string | null
          response_time_ms?: number | null
          tool_name?: string
          tool_route?: string | null
          user_id?: string | null
          user_plan?: string | null
        }
        Relationships: []
      }
      tool_suggestions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          status: string | null
          suggestion: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          status?: string | null
          suggestion: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          status?: string | null
          suggestion?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_farm_metrics: {
        Row: {
          category: string | null
          created_at: string
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          farm_name: string | null
          id: string
          preferred_segments: string[] | null
          profile_photo_url: string | null
          role_description: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_name?: string | null
          id?: string
          preferred_segments?: string[] | null
          profile_photo_url?: string | null
          role_description?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_name?: string | null
          id?: string
          preferred_segments?: string[] | null
          profile_photo_url?: string | null
          role_description?: string | null
          updated_at?: string
          user_id?: string
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
      user_tool_history: {
        Row: {
          created_at: string
          id: string
          input_data: Json | null
          output_summary: string | null
          tool_name: string
          tool_route: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_data?: Json | null
          output_summary?: string | null
          tool_name: string
          tool_route: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_data?: Json | null
          output_summary?: string | null
          tool_name?: string
          tool_route?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tool_suggestions_admin_view: {
        Row: {
          category: string | null
          created_at: string | null
          id: string | null
          status: string | null
          suggestion: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          suggestion?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          suggestion?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_credits: { Args: never; Returns: Json }
      check_rate_limit: {
        Args: {
          _identifier: string
          _max_requests?: number
          _plan?: string
          _window_seconds?: number
        }
        Returns: Json
      }
      cleanup_expired_cache: { Args: never; Returns: number }
      cleanup_expired_rate_limits: { Args: never; Returns: number }
      get_admin_tool_suggestions: {
        Args: never
        Returns: {
          category: string
          created_at: string
          id: string
          status: string
          suggestion: string
        }[]
      }
      get_cached_response: {
        Args: { _request_hash: string; _tool_name: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_territorial_metric: {
        Args: {
          _calculation_method?: string
          _emission_type?: string
          _estimated_emission_value?: number
          _herd_size_range?: string
          _metadata?: Json
          _municipality?: string
          _production_system?: string
          _state?: string
          _tool_name: string
        }
        Returns: undefined
      }
      set_cached_response: {
        Args: {
          _expires_at: string
          _request_hash: string
          _request_signature: string
          _response_text: string
          _tool_name: string
        }
        Returns: undefined
      }
      use_credit: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      professional_registry_type: "crmv" | "crea" | "crbio" | "other"
      subscription_plan: "free" | "pro" | "enterprise"
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
      app_role: ["admin", "moderator", "user"],
      professional_registry_type: ["crmv", "crea", "crbio", "other"],
      subscription_plan: ["free", "pro", "enterprise"],
    },
  },
} as const
