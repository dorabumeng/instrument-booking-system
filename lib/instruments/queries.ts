import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Instrument } from "@/types/instrument";

export type QueryResult<T> = { data: T; error: null } | { data: null; error: string };

export async function getInstruments(): Promise<QueryResult<Instrument[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("instruments").select("*").is("archived_at", null).order("name");
  if (error) { console.error("Instrument query failed", { code: error.code }); return { data: null, error: "Instruments could not be loaded." }; }
  return { data, error: null };
}

export async function getInstrument(id: string): Promise<QueryResult<Instrument | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("instruments").select("*").eq("id", id).is("archived_at", null).maybeSingle();
  if (error) { console.error("Instrument detail query failed", { code: error.code }); return { data: null, error: "Instrument details could not be loaded." }; }
  return { data, error: null };
}
