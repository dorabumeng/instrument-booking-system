import AppShell from "@/components/AppShell";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/user";
import { signOut } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function PortalLayout({ children }: { children: React.ReactNode }) { const user = await getCurrentUser(); if (!user) redirect("/login"); const profile = await getCurrentProfile(); if (!profile) return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="card max-w-lg p-8 text-center"><p className="eyebrow">Account setup problem</p><h1 className="mt-3 text-2xl font-bold">Your profile is missing</h1><p className="mt-3 leading-6 text-slate-600">Your sign-in succeeded, but the application profile could not be loaded. Ask a laboratory administrator to verify that the database migrations and profile trigger are installed.</p><form action={signOut}><button className="btn-primary mt-6">Sign out</button></form></section></main>; return <AppShell profile={profile}>{children}</AppShell>; }
