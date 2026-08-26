import Link from "next/link";
import type { Instrument } from "@/types/instrument";
import { Arrow } from "./icons";

export default function InstrumentCard({ instrument }: { instrument: Instrument }) {
  return <article className="card flex h-full flex-col overflow-hidden"><div className="relative h-36 bg-gradient-to-br from-slate-200 via-teal-50 to-teal-200"><div className="absolute bottom-4 left-5 grid size-12 place-items-center rounded-xl border border-white/80 bg-white/80 text-xl font-black text-teal-800">{instrument.name.slice(0, 2).toUpperCase()}</div></div><div className="flex flex-1 flex-col p-5"><div className="mb-3 flex items-start justify-between gap-3"><h2 className="text-lg font-bold leading-6">{instrument.name}</h2><span className={`status status-${instrument.status}`}>{instrument.status}</span></div><p className="text-sm font-semibold text-slate-500">{instrument.location}</p><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{instrument.description}</p><Link href={`/instruments/${instrument.id}`} className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-teal-700">View calendar <Arrow className="text-lg" /></Link></div></article>;
}
