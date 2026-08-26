export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing required Supabase environment configuration.");
  try { new URL(url); } catch { throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL."); }
  return { url, anonKey };
}
