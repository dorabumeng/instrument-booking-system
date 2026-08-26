import type { Metadata } from "next";
import "./globals.css";
import { getServerEnvironment } from "@/lib/config/env";

export const metadata: Metadata = {
  title: { default: "CoreLab Scheduler", template: "%s | CoreLab" },
  description: "University laboratory instrument booking and availability."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  getServerEnvironment();
  return <html lang="en"><body>{children}</body></html>;
}
