export function validateSupabaseUrl(value: string) {
  let parsed: URL;
  try { parsed = new URL(value); }
  catch { throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL."); }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be the project root URL without /rest/v1, a query, or a fragment.");
  }
  return parsed.origin;
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing required Supabase environment configuration.");
  return { url: validateSupabaseUrl(url), anonKey };
}
