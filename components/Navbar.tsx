import Link from "next/link";
import { LabMark } from "./icons";
import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/types/database";

const links = [["Dashboard", "/dashboard"], ["Instruments", "/instruments"], ["My bookings", "/bookings"]] as const;

export default function Navbar({ profile }: { profile: Profile }) {
  return <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="flex items-center gap-3 font-bold tracking-tight"><LabMark /><span>CoreLab <span className="text-teal-700">Scheduler</span></span></Link>
      <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
        {links.map(([label, href]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-800">{label}</Link>)}
        {profile.role === "admin" && <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Admin</Link>}
      </nav>
      <div className="flex items-center gap-3"><Link href="/profile" className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-50"><div className="hidden text-right sm:block"><p className="max-w-40 truncate text-sm font-bold">{profile.full_name}</p><p className="text-xs capitalize text-slate-500">{profile.role}</p></div><span className="grid size-9 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">{profile.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span></Link><form action={signOut}><button className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 sm:block">Logout</button></form></div>
    </div>
    <nav aria-label="Mobile navigation" className="flex justify-around border-t border-slate-100 px-2 py-1 md:hidden">{links.map(([label, href]) => <Link key={href} href={href} className="px-2 py-2 text-xs font-semibold text-slate-600">{label}</Link>)}{profile.role === "admin" && <Link href="/admin" className="px-2 py-2 text-xs font-semibold text-slate-600">Admin</Link>}<form action={signOut}><button className="px-2 py-2 text-xs font-semibold text-slate-600">Logout</button></form></nav>
  </header>;
}
