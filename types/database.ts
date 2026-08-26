export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type UserRole = "user" | "admin";
export type InstrumentStatus = "available" | "maintenance" | "unavailable";
export type BookingStatus = "confirmed" | "cancelled" | "completed";
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
        Row: { id: string; name: string; description: string; location: string; manager: string; status: InstrumentStatus; image_url: string | null; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; description?: string; location: string; manager: string; status?: InstrumentStatus; image_url?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { name?: string; description?: string; location?: string; manager?: string; status?: InstrumentStatus; image_url?: string | null; archived_at?: string | null; updated_at?: string };
        Relationships: [];
      };
      bookings: {
        Row: { id: string; instrument_id: string; user_id: string; start_time: string; end_time: string; sample_name: string; purpose: string; notes: string | null; status: BookingStatus; cancelled_at: string | null; cancelled_by: string | null; cancellation_reason: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; instrument_id: string; user_id: string; start_time: string; end_time: string; sample_name: string; purpose: string; notes?: string | null; status?: BookingStatus; cancelled_at?: string | null; cancelled_by?: string | null; cancellation_reason?: string | null; created_at?: string; updated_at?: string };
        Update: { instrument_id?: string; start_time?: string; end_time?: string; sample_name?: string; purpose?: string; notes?: string | null; status?: BookingStatus; cancelled_at?: string | null; cancelled_by?: string | null; cancellation_reason?: string | null; updated_at?: string };
        Relationships: [{ foreignKeyName: "bookings_instrument_id_fkey"; columns: ["instrument_id"]; isOneToOne: false; referencedRelation: "instruments"; referencedColumns: ["id"] }, { foreignKeyName: "bookings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      audit_logs: {
        Row: { id: number; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Json; created_at: string };
        Insert: { id?: never; actor_user_id?: string | null; action: string; entity_type: string; entity_id?: string | null; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [{ foreignKeyName: "audit_logs_actor_user_id_fkey"; columns: ["actor_user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_instrument_availability: { Args: { requested_instrument_id: string; range_start: string; range_end: string }; Returns: { booking_id: string; instrument_id: string; start_time: string; end_time: string; status: BookingStatus }[] };
      admin_instrument_future_counts: { Args: Record<string, never>; Returns: { instrument_id: string; future_booking_count: number }[] };
    };
    Enums: { user_role: UserRole; instrument_status: InstrumentStatus; booking_status: BookingStatus };
    CompositeTypes: Record<string, never>;
  };
}
