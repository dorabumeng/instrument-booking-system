import { notFound } from "next/navigation";
import BookingCalendar from "@/components/BookingCalendar";
import { getLabTimezone } from "@/lib/config/env";
import { getInstrument } from "@/lib/instruments/queries";

export default async function InstrumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getInstrument(id);
  if (result.error) return <div role="alert" className="card p-8 text-center"><h1 className="text-2xl font-bold">Instrument unavailable</h1><p className="mt-3 text-slate-600">{result.error} Please try again shortly.</p></div>;
  if (!result.data) notFound();
  const instrument = result.data;
  return <><div className="mb-7"><p className="eyebrow">{instrument.location}</p><div className="mt-2 flex flex-wrap items-center gap-4"><h1 className="page-title">{instrument.name}</h1><span className={`status status-${instrument.status}`}>{instrument.status}</span></div><p className="mt-4 max-w-3xl leading-7 text-slate-600">{instrument.description}</p><p className="mt-3 text-sm font-semibold">Managed by {instrument.manager}</p>{instrument.status !== "available" && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">New reservations are disabled while this instrument is {instrument.status}.</p>}</div><BookingCalendar instrument={instrument} labTimezone={getLabTimezone()} /></>;
}
