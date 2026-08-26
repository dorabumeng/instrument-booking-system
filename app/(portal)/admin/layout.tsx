import { getCurrentProfile } from "@/lib/auth/user";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const profile = await getCurrentProfile(); if (profile?.role !== "admin") redirect("/dashboard?notice=unauthorized"); return <><AdminNav />{children}</>; }
