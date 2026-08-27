import InstrumentGrid from "@/components/InstrumentGrid";
import PageIntro from "@/components/PageIntro";
import { getInstruments } from "@/lib/instruments/queries";
import { getDictionary } from "@/lib/i18n/server";
export default async function InstrumentsPage() { const [result, { t }] = await Promise.all([getInstruments(), getDictionary()]); return <><PageIntro eyebrow={t("instruments.eyebrow")} title={t("instruments.title")} description={t("instruments.description")} />{!result.data ? <div role="alert" className="card p-8 text-center"><h2 className="text-lg font-bold">{t("instruments.loadError")}</h2><p className="mt-2 text-slate-500">{t("instruments.tryAgain")}</p></div> : result.data.length ? <InstrumentGrid instruments={result.data} /> : <div className="card p-10 text-center"><h2 className="text-lg font-bold">{t("instruments.empty")}</h2><p className="mt-2 text-sm text-slate-500">{t("instruments.emptyHelp")}</p></div>}</>; }
