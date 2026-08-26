export type InstrumentStatus = "available" | "maintenance" | "unavailable";
export interface Instrument { id: string; name: string; description: string; location: string; manager: string; status: InstrumentStatus; image_url: string | null; archived_at: string | null; created_at: string; updated_at: string; }
