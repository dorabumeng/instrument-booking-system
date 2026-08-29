import { DateTime } from "luxon";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { UsageStatisticsFilters, UsageStatisticsResult } from "@/lib/admin/usage-statistics";

type Props = {
  filters: UsageStatisticsFilters;
  result: UsageStatisticsResult;
  instruments: Array<{ id: string; name: string }>;
  locale: Locale;
  labTimezone: string;
  preservedParams: Record<string, string | undefined>;
};

export default function UsageStatistics({ filters, result, instruments, locale, labTimezone, preservedParams }: Props) {
  const t = dictionaries[locale];
  const errors = {
    MISSING_INSTRUMENT: t["admin.usage.errorInstrument"], MISSING_START: t["admin.usage.errorStart"], MISSING_END: t["admin.usage.errorEnd"],
    INVALID_RANGE: t["admin.usage.errorRange"], DATABASE_ERROR: t["admin.usage.errorDatabase"],
  };
  const formatDateTime = (value: string) => DateTime.fromISO(value, { setZone: true }).setZone(labTimezone).toFormat("yyyy-LL-dd HH:mm");

  return <section className="card mb-6 p-4 sm:p-6" aria-labelledby="usage-statistics-title">
    <h2 id="usage-statistics-title" className="text-xl font-black">{t["admin.usage.title"]}</h2>
    <p className="mt-1 text-sm text-slate-500">{t["admin.usage.description"]} · {labTimezone}</p>
    <form method="get" className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
      {Object.entries(preservedParams).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
      <label className="text-sm font-bold">{t["admin.usage.instrument"]}<select required name="usageInstrument" defaultValue={filters.usageInstrument ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"><option value="">{t["admin.usage.chooseInstrument"]}</option>{instruments.map((instrument) => <option key={instrument.id} value={instrument.id}>{instrument.name}</option>)}</select></label>
      <label className="text-sm font-bold">{t["admin.usage.start"]}<input required type="datetime-local" name="usageStart" defaultValue={filters.usageStart} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
      <label className="text-sm font-bold">{t["admin.usage.end"]}<input required type="datetime-local" name="usageEnd" defaultValue={filters.usageEnd} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
      <button className="btn-primary self-end">{t["admin.usage.query"]}</button>
    </form>
    {result.state === "error" && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{errors[result.code]}</p>}
    {result.state === "idle" && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{t["admin.usage.idle"]}</p>}
    {result.state === "success" && <div className="mt-6 border-t border-slate-200 pt-5">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-sm font-semibold text-slate-500">{t["admin.usage.instrument"]}</dt><dd className="mt-1 font-bold">{result.data.instrumentName}</dd></div>
        <div><dt className="text-sm font-semibold text-slate-500">{t["admin.usage.range"]}</dt><dd className="mt-1 text-sm font-bold">{formatDateTime(result.data.queryStart)}<br />{formatDateTime(result.data.queryEnd)}</dd></div>
        <div><dt className="text-sm font-semibold text-slate-500">{t["admin.usage.bookingCount"]}</dt><dd className="mt-1 text-2xl font-black">{result.data.bookingCount}</dd></div>
        <div><dt className="text-sm font-semibold text-slate-500">{t["admin.usage.totalHours"]}</dt><dd className="mt-1 text-2xl font-black text-teal-700">{result.data.totalHours.toFixed(2)} h</dd></div>
      </dl>
      <h3 className="mt-7 font-black">{t["admin.usage.details"]}</h3>
      {result.data.details.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-5 text-center text-slate-600">{t["admin.usage.empty"]}</p> : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="p-3">{t["admin.usage.user"]}</th><th className="p-3">{t["admin.usage.start"]}</th><th className="p-3">{t["admin.usage.end"]}</th><th className="p-3 text-right">{t["admin.usage.countedHours"]}</th></tr></thead><tbody>{result.data.details.map((row) => <tr key={row.id} className="border-b border-slate-100"><td className="p-3 font-semibold">{row.user.full_name}</td><td className="p-3">{formatDateTime(row.start_time)}</td><td className="p-3">{formatDateTime(row.end_time)}</td><td className="p-3 text-right font-bold">{row.countedHours.toFixed(2)} h</td></tr>)}</tbody></table></div>}
    </div>}
  </section>;
}
