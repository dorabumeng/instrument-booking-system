import type { Metadata } from "next";
import "./globals.css";
import { getServerEnvironment } from "@/lib/config/env";
import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";

export const metadata: Metadata = {
  title: { default: "南方科技大学-低维磁性材料实验室预约系统", template: "%s | 南科大低维磁性材料实验室" },
  description: "SUSTech Low-Dimensional Magnetic Materials Laboratory Booking System."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  getServerEnvironment();
  const locale = await getLocale(); return <html lang={locale === "zh" ? "zh-CN" : "en"}><body><I18nProvider locale={locale}>{children}</I18nProvider></body></html>;
}
