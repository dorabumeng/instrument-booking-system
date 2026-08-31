export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type UserRole = "user" | "admin";
export type InstrumentStatus = "available" | "maintenance" | "unavailable";
export type BookingStatus = "confirmed" | "cancelled" | "completed";
export type BillingStatus = "pending" | "charged" | "exempt" | "not_applicable";
export type ContractStatus = "signed" | "not_signed" | "not_required";
export type EvaluationStatus = "submitted" | "not_submitted" | "not_required";
export type SurveyStatus = "completed" | "not_completed" | "not_required";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; email: string; group_name: string | null; phone: string | null; role: UserRole; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string; email: string; group_name?: string | null; phone?: string | null; role?: UserRole; created_at?: string; updated_at?: string };
        Update: { full_name?: string; email?: string; group_name?: string | null; phone?: string | null; role?: UserRole; updated_at?: string };
        Relationships: [];
      };
      instruments: {
        Row: { id: string; name: string; description: string; location: string; manager: string; status: InstrumentStatus; image_url: string | null; archived_at: string | null; asset_number: string | null; booking_slot_minutes: number; min_booking_minutes: number; max_booking_minutes: number | null; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; description?: string; location: string; manager: string; status?: InstrumentStatus; image_url?: string | null; archived_at?: string | null; asset_number?: string | null; booking_slot_minutes?: number; min_booking_minutes?: number; max_booking_minutes?: number | null; created_at?: string; updated_at?: string };
        Update: { name?: string; description?: string; location?: string; manager?: string; status?: InstrumentStatus; image_url?: string | null; archived_at?: string | null; asset_number?: string | null; booking_slot_minutes?: number; min_booking_minutes?: number; max_booking_minutes?: number | null; updated_at?: string };
        Relationships: [];
      };
      bookings: {
        Row: { id: string; instrument_id: string; user_id: string; start_time: string; end_time: string; sample_name: string; sample_count: number; purpose: string; notes: string | null; status: BookingStatus; cancelled_at: string | null; cancelled_by: string | null; cancellation_reason: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; instrument_id: string; user_id: string; start_time: string; end_time: string; sample_name: string; sample_count?: number; purpose: string; notes?: string | null; status?: BookingStatus; cancelled_at?: string | null; cancelled_by?: string | null; cancellation_reason?: string | null; created_at?: string; updated_at?: string };
        Update: { instrument_id?: string; start_time?: string; end_time?: string; sample_name?: string; sample_count?: number; purpose?: string; notes?: string | null; status?: BookingStatus; cancelled_at?: string | null; cancelled_by?: string | null; cancellation_reason?: string | null; updated_at?: string };
        Relationships: [{ foreignKeyName: "bookings_instrument_id_fkey"; columns: ["instrument_id"]; isOneToOne: false; referencedRelation: "instruments"; referencedColumns: ["id"] }, { foreignKeyName: "bookings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      audit_logs: {
        Row: { id: number; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Json; created_at: string };
        Insert: { id?: never; actor_user_id?: string | null; action: string; entity_type: string; entity_id?: string | null; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [{ foreignKeyName: "audit_logs_actor_user_id_fkey"; columns: ["actor_user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      booking_ledger_details: {
        Row: { booking_id: string; sample_count: number; statistical_hours: number | null; payer_name: string | null; payer_organization: string | null; billing_status: BillingStatus; contract_status: ContractStatus; contract_amount: number | null; evaluation_status: EvaluationStatus; survey_status: SurveyStatus; created_at: string; updated_at: string; updated_by: string | null };
        Insert: { booking_id: string; sample_count?: number; statistical_hours?: number | null; payer_name?: string | null; payer_organization?: string | null; billing_status?: BillingStatus; contract_status?: ContractStatus; contract_amount?: number | null; evaluation_status?: EvaluationStatus; survey_status?: SurveyStatus; created_at?: string; updated_at?: string; updated_by?: string | null };
        Update: { sample_count?: number; statistical_hours?: number | null; payer_name?: string | null; payer_organization?: string | null; billing_status?: BillingStatus; contract_status?: ContractStatus; contract_amount?: number | null; evaluation_status?: EvaluationStatus; survey_status?: SurveyStatus; updated_at?: string; updated_by?: string | null };
        Relationships: [{ foreignKeyName: "booking_ledger_details_booking_id_fkey"; columns: ["booking_id"]; isOneToOne: true; referencedRelation: "bookings"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_instrument_availability: { Args: { requested_instrument_id: string; range_start: string; range_end: string }; Returns: { booking_id: string; instrument_id: string; start_time: string; end_time: string; status: BookingStatus; reserver_name: string }[] };
      admin_instrument_future_counts: { Args: Record<string, never>; Returns: { instrument_id: string; future_booking_count: number }[] };
    };
    Enums: { user_role: UserRole; instrument_status: InstrumentStatus; booking_status: BookingStatus; billing_status: BillingStatus; contract_status: ContractStatus; evaluation_status: EvaluationStatus; survey_status: SurveyStatus };
    CompositeTypes: Record<string, never>;
  };
}
