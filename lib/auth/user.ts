import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
export const getCurrentUser = cache(async () => { const supabase = await createClient(); const { data: { user }, error } = await supabase.auth.getUser(); return error ? null : user; });
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load current profile", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId: user.id,
    });
    return null;
  }

  return data;
});
