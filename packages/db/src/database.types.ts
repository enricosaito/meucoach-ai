export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_days: {
        Row: {
          created_at: string
          day: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_days_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ai_calls: {
        Row: {
          cost_usd: number
          created_at: string
          error: string | null
          feature: string
          id: string
          input_tokens: number
          latency_ms: number
          model: string
          output_tokens: number
          prompt_version: string
          provider: string
          request_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          error?: string | null
          feature: string
          id?: string
          input_tokens?: number
          latency_ms: number
          model: string
          output_tokens?: number
          prompt_version: string
          provider: string
          request_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          error?: string | null
          feature?: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          model?: string
          output_tokens?: number
          prompt_version?: string
          provider?: string
          request_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ai_calls_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      body_scans: {
        Row: {
          ai_call_id: string | null
          analysis: Json | null
          back_path: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          front_path: string | null
          id: string
          model: string | null
          prompt_version: string | null
          side_path: string | null
          status: string
          user_id: string
        }
        Insert: {
          ai_call_id?: string | null
          analysis?: Json | null
          back_path?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          front_path?: string | null
          id: string
          model?: string | null
          prompt_version?: string | null
          side_path?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ai_call_id?: string | null
          analysis?: Json | null
          back_path?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          front_path?: string | null
          id?: string
          model?: string | null
          prompt_version?: string | null
          side_path?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'body_scans_ai_call_id_fkey'
            columns: ['ai_call_id']
            isOneToOne: false
            referencedRelation: 'ai_calls'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'body_scans_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      chat_messages: {
        Row: {
          ai_call_id: string | null
          content: string
          created_at: string
          id: string
          prompt_version: string | null
          role: string
          user_id: string
        }
        Insert: {
          ai_call_id?: string | null
          content: string
          created_at?: string
          id?: string
          prompt_version?: string | null
          role: string
          user_id: string
        }
        Update: {
          ai_call_id?: string | null
          content?: string
          created_at?: string
          id?: string
          prompt_version?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_ai_call_id_fkey'
            columns: ['ai_call_id']
            isOneToOne: false
            referencedRelation: 'ai_calls'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chat_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      consents: {
        Row: {
          granted_at: string
          id: string
          kind: string
          revoked_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          granted_at?: string
          id?: string
          kind: string
          revoked_at?: string | null
          user_id: string
          version: number
        }
        Update: {
          granted_at?: string
          id?: string
          kind?: string
          revoked_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'consents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          key: string
          request_hash: string
          response_body: Json | null
          response_status: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          key: string
          request_hash: string
          response_body?: Json | null
          response_status?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          key?: string
          request_hash?: string
          response_body?: Json | null
          response_status?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'idempotency_keys_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      metabolic_assessments: {
        Row: {
          activity_level: string
          age_years: number
          bmr_kcal: number
          created_at: string
          formula: string
          formula_version: number
          height_cm: number
          id: string
          sex: string
          tdee_kcal: number
          user_id: string
          weight_kg: number
        }
        Insert: {
          activity_level: string
          age_years: number
          bmr_kcal: number
          created_at?: string
          formula?: string
          formula_version: number
          height_cm: number
          id?: string
          sex: string
          tdee_kcal: number
          user_id: string
          weight_kg: number
        }
        Update: {
          activity_level?: string
          age_years?: number
          bmr_kcal?: number
          created_at?: string
          formula?: string
          formula_version?: number
          height_cm?: number
          id?: string
          sex?: string
          tdee_kcal?: number
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: 'metabolic_assessments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      outbox_events: {
        Row: {
          created_at: string
          dispatched_at: string | null
          id: string
          payload: Json
          type: string
        }
        Insert: {
          created_at?: string
          dispatched_at?: string | null
          id?: string
          payload: Json
          type: string
        }
        Update: {
          created_at?: string
          dispatched_at?: string | null
          id?: string
          payload?: Json
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          goals: Json
          id: string
          locale: string
          timezone: string
          units: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          goals?: Json
          id: string
          locale?: string
          timezone?: string
          units?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          goals?: Json
          id?: string
          locale?: string
          timezone?: string
          units?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      training_profiles: {
        Row: {
          created_at: string
          days_per_week: number
          equipment: string
          experience: string
          limitations: string | null
          session_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week: number
          equipment: string
          experience: string
          limitations?: string | null
          session_minutes: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number
          equipment?: string
          experience?: string
          limitations?: string | null
          session_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'training_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      workout_plans: {
        Row: {
          ai_call_id: string | null
          body_scan_id: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          inputs: Json
          model: string | null
          plan: Json | null
          prompt_version: string | null
          status: string
          user_id: string
        }
        Insert: {
          ai_call_id?: string | null
          body_scan_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          inputs: Json
          model?: string | null
          plan?: Json | null
          prompt_version?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ai_call_id?: string | null
          body_scan_id?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          inputs?: Json
          model?: string | null
          plan?: Json | null
          prompt_version?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_plans_ai_call_id_fkey'
            columns: ['ai_call_id']
            isOneToOne: false
            referencedRelation: 'ai_calls'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_plans_body_scan_id_fkey'
            columns: ['body_scan_id']
            isOneToOne: false
            referencedRelation: 'body_scans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_plans_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          day_index: number
          day_title: string
          id: string
          local_date: string
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_index: number
          day_title: string
          id?: string
          local_date: string
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_index?: number
          day_title?: string
          id?: string
          local_date?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_sessions_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'workout_plans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'xp_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gamification_xp_total: { Args: { p_user_id: string }; Returns: number }
      generate_username: { Args: { base: string }; Returns: string }
      training_request_plan: {
        Args: {
          p_inputs: Json
          p_request_id: string
          p_scan: Json
          p_training_profile: Json
          p_user_id: string
        }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
