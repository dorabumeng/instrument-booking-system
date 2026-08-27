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
    PostgrestVersion: "14.17"
  }
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
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_ledger_details: {
        Row: {
          billing_status: Database["public"]["Enums"]["billing_status"]
          booking_id: string
          contract_amount: number | null
          contract_status: Database["public"]["Enums"]["contract_status"]
          created_at: string
          evaluation_status: Database["public"]["Enums"]["evaluation_status"]
          payer_name: string | null
          payer_organization: string | null
          sample_count: number
          statistical_hours: number | null
          survey_status: Database["public"]["Enums"]["survey_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_status?: Database["public"]["Enums"]["billing_status"]
          booking_id: string
          contract_amount?: number | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          evaluation_status?: Database["public"]["Enums"]["evaluation_status"]
          payer_name?: string | null
          payer_organization?: string | null
          sample_count?: number
          statistical_hours?: number | null
          survey_status?: Database["public"]["Enums"]["survey_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_status?: Database["public"]["Enums"]["billing_status"]
          booking_id?: string
          contract_amount?: number | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          evaluation_status?: Database["public"]["Enums"]["evaluation_status"]
          payer_name?: string | null
          payer_organization?: string | null
          sample_count?: number
          statistical_hours?: number | null
          survey_status?: Database["public"]["Enums"]["survey_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_ledger_details_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_ledger_details_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          end_time: string
          id: string
          instrument_id: string
          notes: string | null
          purpose: string
          sample_name: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          end_time: string
          id?: string
          instrument_id: string
          notes?: string | null
          purpose: string
          sample_name: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          end_time?: string
          id?: string
          instrument_id?: string
          notes?: string | null
          purpose?: string
          sample_name?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instruments: {
        Row: {
          archived_at: string | null
          asset_number: string | null
          booking_slot_minutes: number
          created_at: string
          description: string
          id: string
          image_url: string | null
          location: string
          manager: string
          max_booking_minutes: number | null
          min_booking_minutes: number
          name: string
          status: Database["public"]["Enums"]["instrument_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          asset_number?: string | null
          booking_slot_minutes?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          location: string
          manager: string
          max_booking_minutes?: number | null
          min_booking_minutes?: number
          name: string
          status?: Database["public"]["Enums"]["instrument_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          asset_number?: string | null
          booking_slot_minutes?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          location?: string
          manager?: string
          max_booking_minutes?: number | null
          min_booking_minutes?: number
          name?: string
          status?: Database["public"]["Enums"]["instrument_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          group_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          group_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          group_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_instrument_future_counts: {
        Args: never
        Returns: {
          future_booking_count: number
          instrument_id: string
        }[]
      }
      get_instrument_availability: {
        Args: {
          range_end: string
          range_start: string
          requested_instrument_id: string
        }
        Returns: {
          booking_id: string
          end_time: string
          instrument_id: string
          reserver_name: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
    }
    Enums: {
      billing_status: "pending" | "charged" | "exempt" | "not_applicable"
      booking_status: "confirmed" | "cancelled" | "completed"
      contract_status: "signed" | "not_signed" | "not_required"
      evaluation_status: "submitted" | "not_submitted" | "not_required"
      instrument_status: "available" | "maintenance" | "unavailable"
      survey_status: "completed" | "not_completed" | "not_required"
      user_role: "user" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_status: ["pending", "charged", "exempt", "not_applicable"],
      booking_status: ["confirmed", "cancelled", "completed"],
      contract_status: ["signed", "not_signed", "not_required"],
      evaluation_status: ["submitted", "not_submitted", "not_required"],
      instrument_status: ["available", "maintenance", "unavailable"],
      survey_status: ["completed", "not_completed", "not_required"],
      user_role: ["user", "admin"],
    },
  },
} as const
