import "server-only";
import { createClient } from "@/lib/supabase/server";
export async function getAdminContext() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null; const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(); return profile?.role === "admin" ? { supabase, user, profile } : null; }
