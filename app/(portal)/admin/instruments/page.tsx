import PageIntro from "@/components/PageIntro";
import InstrumentAdmin from "@/components/admin/InstrumentAdmin";
import { getAdminInstruments } from "@/lib/admin/instruments";
import { getDictionary } from "@/lib/i18n/server";

export default async function AdminInstrumentsPage() {
  const [result, { t }] = await Promise.all([getAdminInstruments(), getDictionary()]);
  return <><PageIntro eyebrow={t("admin.instrument.eyebrow")} title={t("admin.instruments")} description={t("admin.instrument.description")} />{!result.data ? <div className="card p-6 text-red-700" role="alert">{t("error.DATABASE_ERROR")}</div> : <InstrumentAdmin instruments={result.data} />}</>;
}
