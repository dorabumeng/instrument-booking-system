"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";
let browserClient: SupabaseClient<Database> | undefined;
export function createClient() { if (!browserClient) { const { url, anonKey } = getSupabaseEnv(); browserClient = createBrowserClient<Database>(url, anonKey); } return browserClient; }
