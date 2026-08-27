import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
export default async function InstrumentNotFound() { const { t } = await getDictionary(); return <div className="card mx-auto max-w-lg p-10 text-center"><p className="eyebrow">{t("instrument.notFoundEyebrow")}</p><h1 className="mt-3 text-2xl font-bold">{t("instrument.notFound")}</h1><p className="mt-3 text-slate-600">{t("instrument.notFoundHelp")}</p><Link href="/instruments" className="btn-primary mt-6">{t("instrument.browse")}</Link></div>; }
