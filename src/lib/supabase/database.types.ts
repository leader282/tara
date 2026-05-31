export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      couple_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          couple_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invite_code: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          couple_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          invite_code: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          couple_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invite_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          couple_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_rituals: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          ritual_template_id: string
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          ritual_template_id: string
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          ritual_template_id?: string
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_rituals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_rituals_ritual_template_id_fkey"
            columns: ["ritual_template_id"]
            isOneToOne: false
            referencedRelation: "ritual_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_settings: {
        Row: {
          couple_id: string
          created_at: string
          privacy_level: string
          ritual_frequency: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          privacy_level?: string
          ritual_frequency?: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          privacy_level?: string
          ritual_frequency?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_settings_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          anniversary_date: string | null
          created_at: string
          created_by: string
          id: string
          next_meetup_at: string | null
          next_meetup_location: string | null
          status: string
          updated_at: string
        }
        Insert: {
          anniversary_date?: string | null
          created_at?: string
          created_by: string
          id?: string
          next_meetup_at?: string | null
          next_meetup_location?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          anniversary_date?: string | null
          created_at?: string
          created_by?: string
          id?: string
          next_meetup_at?: string | null
          next_meetup_location?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          media_type: string
          mime_type: string
          owner_id: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          media_type: string
          mime_type: string
          owner_id: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          media_type?: string
          mime_type?: string
          owner_id?: string
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_capsule_contents: {
        Row: {
          capsule_id: string
          created_at: string
          media_asset_id: string | null
          note: string | null
          updated_at: string
        }
        Insert: {
          capsule_id: string
          created_at?: string
          media_asset_id?: string | null
          note?: string | null
          updated_at?: string
        }
        Update: {
          capsule_id?: string
          created_at?: string
          media_asset_id?: string | null
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_capsule_contents_capsule_id_fkey"
            columns: ["capsule_id"]
            isOneToOne: true
            referencedRelation: "memory_capsules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_capsule_contents_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_capsules: {
        Row: {
          couple_id: string
          created_at: string
          creator_id: string
          emotional_context: string | null
          id: string
          opened_at: string | null
          opened_by: string | null
          title: string
          unlock_at: string
          unlock_type: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          creator_id: string
          emotional_context?: string | null
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          title: string
          unlock_at: string
          unlock_type?: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          creator_id?: string
          emotional_context?: string | null
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          title?: string
          unlock_at?: string
          unlock_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_capsules_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          capsules_enabled: boolean
          countdown_enabled: boolean
          created_at: string
          presence_enabled: boolean
          quiet_hours_enabled: boolean
          rituals_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          capsules_enabled?: boolean
          countdown_enabled?: boolean
          created_at?: string
          presence_enabled?: boolean
          quiet_hours_enabled?: boolean
          rituals_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          capsules_enabled?: boolean
          countdown_enabled?: boolean
          created_at?: string
          presence_enabled?: boolean
          quiet_hours_enabled?: boolean
          rituals_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      presence_events: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          optional_message: string | null
          sender_id: string
          type: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          optional_message?: string | null
          sender_id: string
          type: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          optional_message?: string | null
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string
          id: string
          onboarding_completed: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          id: string
          onboarding_completed?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          onboarding_completed?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ritual_completions: {
        Row: {
          couple_ritual_id: string
          created_at: string
          id: string
          media_asset_id: string | null
          text_response: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          couple_ritual_id: string
          created_at?: string
          id?: string
          media_asset_id?: string | null
          text_response?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          couple_ritual_id?: string
          created_at?: string
          id?: string
          media_asset_id?: string | null
          text_response?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_completions_couple_ritual_id_fkey"
            columns: ["couple_ritual_id"]
            isOneToOne: false
            referencedRelation: "couple_rituals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritual_completions_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          input_type: string
          is_active: boolean
          prompt: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          input_type: string
          is_active?: boolean
          prompt: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          input_type?: string
          is_active?: boolean
          prompt?: string
          title?: string
        }
        Relationships: []
      }
      timeline_items: {
        Row: {
          actor_id: string | null
          couple_id: string
          created_at: string
          id: string
          payload: Json
          subtitle: string | null
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          couple_id: string
          created_at?: string
          id?: string
          payload?: Json
          subtitle?: string | null
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          payload?: Json
          subtitle?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          emotional_tone: string | null
          notification_tone: string | null
          preferred_love_signals: string[]
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emotional_tone?: string | null
          notification_tone?: string | null
          preferred_love_signals?: string[]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emotional_tone?: string | null
          notification_tone?: string | null
          preferred_love_signals?: string[]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
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
      accept_couple_invite: {
        Args: { p_invite_code: string }
        Returns: {
          couple_id: string
        }[]
      }
      create_couple_with_invite: {
        Args: {
          p_anniversary_date?: string
          p_next_meetup_at?: string
          p_next_meetup_location?: string
        }
        Returns: {
          couple_id: string
          expires_at: string
          invite_code: string
          invite_id: string
        }[]
      }
      open_memory_capsule: {
        Args: { p_capsule_id: string }
        Returns: {
          couple_id: string
          created_at: string
          creator_id: string
          emotional_context: string
          id: string
          opened_at: string
          opened_by: string
          title: string
          unlock_at: string
          unlock_type: string
          updated_at: string
        }[]
      }
      send_presence_pulse: {
        Args: { p_optional_message?: string; p_type: string }
        Returns: {
          couple_id: string
          created_at: string
          id: string
          optional_message: string
          sender_id: string
          type: string
        }[]
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
