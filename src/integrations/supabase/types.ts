export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      battle_history: {
        Row: {
          battle_type: string
          created_at: string
          generation: number
          id: string
          pokemon_ids: number[]
          selected_pokemon_ids: number[]
          user_id: string
        }
        Insert: {
          battle_type: string
          created_at?: string
          generation: number
          id?: string
          pokemon_ids: number[]
          selected_pokemon_ids: number[]
          user_id: string
        }
        Update: {
          battle_type?: string
          created_at?: string
          generation?: number
          id?: string
          pokemon_ids?: number[]
          selected_pokemon_ids?: number[]
          user_id?: string
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          console_logs: string | null
          created_at: string
          description: string
          email: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          type: string
          updated_at: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          console_logs?: string | null
          created_at?: string
          description: string
          email?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          console_logs?: string | null
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      global_rankings: {
        Row: {
          average_rating: number
          confidence_score: number
          created_at: string
          generation: number
          id: string
          last_updated: string
          pokemon_id: number
          pokemon_name: string
          total_battles: number
          total_wins: number
        }
        Insert: {
          average_rating?: number
          confidence_score?: number
          created_at?: string
          generation: number
          id?: string
          last_updated?: string
          pokemon_id: number
          pokemon_name: string
          total_battles?: number
          total_wins?: number
        }
        Update: {
          average_rating?: number
          confidence_score?: number
          created_at?: string
          generation?: number
          id?: string
          last_updated?: string
          pokemon_id?: number
          pokemon_name?: string
          total_battles?: number
          total_wins?: number
        }
        Relationships: []
      }
      preview_image_cache: {
        Row: {
          cache_key: string
          cached_at: string
          content_type: string | null
          created_at: string
          expires_at: string
          id: string
          image_data: string | null
          image_url: string
          storage_path: string | null
          stored_in_storage: boolean | null
        }
        Insert: {
          cache_key: string
          cached_at?: string
          content_type?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_data?: string | null
          image_url: string
          storage_path?: string | null
          stored_in_storage?: boolean | null
        }
        Update: {
          cache_key?: string
          cached_at?: string
          content_type?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_data?: string | null
          image_url?: string
          storage_path?: string | null
          stored_in_storage?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          trueskill_session_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          trueskill_session_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          trueskill_session_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      tcg_cards_cache: {
        Row: {
          card_data: Json
          created_at: string
          id: string
          pokemon_name: string
          second_card_data: Json | null
          updated_at: string
        }
        Insert: {
          card_data: Json
          created_at?: string
          id?: string
          pokemon_name: string
          second_card_data?: Json | null
          updated_at?: string
        }
        Update: {
          card_data?: Json
          created_at?: string
          id?: string
          pokemon_name?: string
          second_card_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      trueskill_sessions: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          pending_battles: Json | null
          ratings_data: Json
          refinement_queue: Json
          session_id: string
          total_battles: number
          total_battles_last_updated: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          pending_battles?: Json | null
          ratings_data?: Json
          refinement_queue?: Json
          session_id: string
          total_battles?: number
          total_battles_last_updated?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          pending_battles?: Json | null
          ratings_data?: Json
          refinement_queue?: Json
          session_id?: string
          total_battles?: number
          total_battles_last_updated?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          form_filters: Json | null
          id: string
          image_preferences: Json | null
          other_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_filters?: Json | null
          id?: string
          image_preferences?: Json | null
          other_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_filters?: Json | null
          id?: string
          image_preferences?: Json | null
          other_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rankings: {
        Row: {
          battle_results: Json
          battles_completed: number | null
          completion_percentage: number | null
          created_at: string
          generation: number
          id: string
          pokemon_rankings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          battle_results: Json
          battles_completed?: number | null
          completion_percentage?: number | null
          created_at?: string
          generation: number
          id?: string
          pokemon_rankings: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          battle_results?: Json
          battles_completed?: number | null
          completion_percentage?: number | null
          created_at?: string
          generation?: number
          id?: string
          pokemon_rankings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_preview_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_global_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
