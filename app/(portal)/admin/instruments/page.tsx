import PageIntro from "@/components/PageIntro";
import InstrumentAdmin from "@/components/admin/InstrumentAdmin";
import { getAdminInstruments } from "@/lib/admin/instruments";
export default async function AdminInstrumentsPage() { const result = await getAdminInstruments(); return <><PageIntro eyebrow="Administration" title="Instrument management" description="Add equipment, coordinate maintenance, review affected reservations, and archive safely without breaking history." />{!result.data ? <div className="card p-6 text-red-700" role="alert">{result.error}</div> : <InstrumentAdmin instruments={result.data} />}</>; }
