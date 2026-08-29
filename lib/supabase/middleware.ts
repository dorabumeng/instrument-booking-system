import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { validateSupabaseUrl } from "./env";
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!configuredUrl || !anonKey) {
    console.error("Required Supabase environment configuration is missing.");
    return new NextResponse("Application configuration is incomplete.", { status: 503 });
  }
  let url: string;
  try { url = validateSupabaseUrl(configuredUrl); }
  catch (error) {
    console.error("Supabase URL configuration is invalid.", { message: error instanceof Error ? error.message : "Unknown error" });
    return new NextResponse("Application configuration is incomplete.", { status: 503 });
  }
  const supabase = createServerClient<Database>(url, anonKey, { cookies: { getAll: () => request.cookies.getAll(), setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub); const path = request.nextUrl.pathname;
  const protectedRoute = ["/dashboard", "/instruments", "/bookings", "/profile", "/admin"].some(route => path === route || path.startsWith(`${route}/`));
  if (protectedRoute && !isAuthenticated) { const target = request.nextUrl.clone(); target.pathname = "/login"; target.searchParams.set("next", path); return NextResponse.redirect(target); }
  if (path === "/login" && isAuthenticated) { const target = request.nextUrl.clone(); target.pathname = "/dashboard"; target.search = ""; return NextResponse.redirect(target); }
  return response;
}
