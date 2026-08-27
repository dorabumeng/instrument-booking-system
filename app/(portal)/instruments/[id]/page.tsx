import { notFound } from "next/navigation";
import BookingCalendar from "@/components/BookingCalendar";
import { getLabTimezone } from "@/lib/config/env";
import { getInstrument } from "@/lib/instruments/queries";
import { getDictionary } from "@/lib/i18n/server";

export default async function InstrumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, { t }] = await Promise.all([getInstrument(id), getDictionary()]);
  if (result.error) return <div role="alert" className="card p-8 text-center"><h1 className="text-2xl font-bold">{t("instrument.loadError")}</h1><p className="mt-3 text-slate-600">{t("instruments.tryAgain")}</p></div>;
  if (!result.data) notFound();
  const instrument = result.data;
  const statusKey = `instrument.${instrument.status}` as "instrument.available" | "instrument.maintenance" | "instrument.unavailable";
  return <><div className="mb-7"><p className="eyebrow">{instrument.location}</p><div className="mt-2 flex flex-wrap items-center gap-4"><h1 className="page-title">{instrument.name}</h1><span className={`status status-${instrument.status}`}>{t(statusKey)}</span></div><p className="mt-4 max-w-3xl leading-7 text-slate-600">{instrument.description}</p><p className="mt-3 text-sm font-semibold">{t("instrument.managedBy")}：{instrument.manager}</p>{instrument.status !== "available" && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{t("instrument.bookingDisabled")}</p>}</div><BookingCalendar instrument={instrument} labTimezone={getLabTimezone()} /></>;
}
