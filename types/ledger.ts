import type { Database } from "./database";
export type LedgerDetail = Database["public"]["Tables"]["booking_ledger_details"]["Row"];
export type LedgerInput = Omit<Database["public"]["Tables"]["booking_ledger_details"]["Insert"], "booking_id" | "created_at" | "updated_at" | "updated_by">;
