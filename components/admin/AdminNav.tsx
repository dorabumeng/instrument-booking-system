import Link from "next/link";
const links = [["Overview", "/admin"], ["Instruments", "/admin/instruments"], ["Bookings", "/admin/bookings"], ["Users", "/admin/users"], ["Audit Log", "/admin/audit"]] as const;
export default function AdminNav() { return <nav aria-label="Administration" className="mb-8 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">{links.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-800">{label}</Link>)}</nav>; }
