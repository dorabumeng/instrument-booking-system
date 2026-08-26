import Navbar from "./Navbar";
import type { Profile } from "@/types/database";
export default function AppShell({ children, profile }: { children: React.ReactNode; profile: Profile }) { return <><Navbar profile={profile} /><main className="mx-auto min-h-[calc(100vh-70px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main></>; }
