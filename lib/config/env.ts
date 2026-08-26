import "server-only";

let validated: { supabaseUrl: string; supabaseAnonKey: string; labTimezone: string } | undefined;

export function getServerEnvironment() {
  if (validated) return validated;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const labTimezone = process.env.LAB_TIMEZONE;
  const publicLabTimezone = process.env.NEXT_PUBLIC_LAB_TIMEZONE;
  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseAnonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !labTimezone && "LAB_TIMEZONE",
    !publicLabTimezone && "NEXT_PUBLIC_LAB_TIMEZONE",
  ].filter(Boolean);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  try { new Intl.DateTimeFormat("en-US", { timeZone: labTimezone }).format(); }
  catch { throw new Error("LAB_TIMEZONE must be a valid IANA timezone identifier."); }
  if (labTimezone !== publicLabTimezone) throw new Error("LAB_TIMEZONE and NEXT_PUBLIC_LAB_TIMEZONE must match.");
  validated = { supabaseUrl: supabaseUrl!, supabaseAnonKey: supabaseAnonKey!, labTimezone: labTimezone! };
  return validated;
}

export function getLabTimezone() { return getServerEnvironment().labTimezone; }
