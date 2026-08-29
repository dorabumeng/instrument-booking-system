import PageIntro from "@/components/PageIntro";
import BookingAdmin from "@/components/admin/BookingAdmin";
import LedgerAdmin from "@/components/admin/LedgerAdmin";
import Pagination from "@/components/admin/Pagination";
import UsageStatistics from "@/components/admin/UsageStatistics";
import { getAdminBookings, getBookingFilterOptions, type AdminBookingFilters } from "@/lib/admin/bookings";
import { getInstrumentUsageStatistics, type UsageStatisticsFilters } from "@/lib/admin/usage-statistics";
import { getLabTimezone } from "@/lib/config/env";
import { getDictionary } from "@/lib/i18n/server";

type AdminBookingsSearchParams = AdminBookingFilters & UsageStatisticsFilters;

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<AdminBookingsSearchParams> }) {
  const filters = await searchParams;
  const [result, options, usageResult, { locale }] = await Promise.all([
    getAdminBookings(filters), getBookingFilterOptions(), getInstrumentUsageStatistics(filters), getDictionary(),
  ]);
  const exportQuery = new URLSearchParams();
  if (filters.from) exportQuery.set("from", filters.from);
  if (filters.to) exportQuery.set("to", filters.to);
  if (filters.instrument) exportQuery.set("instrument", filters.instrument);
  if (filters.status) exportQuery.set("status", filters.status);
  const exportReady = Boolean(filters.from && filters.to);

  return <>
    <PageIntro eyebrow="Administration" title="Booking administration" description="Inspect reservations and complete university usage-ledger records." action={exportReady ? <a href={`/admin/bookings/export?${exportQuery}`} className="btn-secondary">Export university Excel ledger</a> : <span className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Select start and end dates to export</span>} />
    <UsageStatistics filters={filters} result={usageResult} instruments={options.instruments} locale={locale} labTimezone={getLabTimezone()} preservedParams={{ instrument: filters.instrument, user: filters.user, status: filters.status, from: filters.from, to: filters.to, page: filters.page }} />
    <form method="get" className="card mb-5 grid gap-3 p-4 md:grid-cols-5">
      <input type="hidden" name="usageInstrument" value={filters.usageInstrument ?? ""} /><input type="hidden" name="usageStart" value={filters.usageStart ?? ""} /><input type="hidden" name="usageEnd" value={filters.usageEnd ?? ""} />
      <FilterSelect label="Instrument" name="instrument" value={filters.instrument} options={options.instruments.map((item) => [item.id, item.name])} />
      <FilterSelect label="User" name="user" value={filters.user} options={options.users.map((item) => [item.id, `${item.full_name} (${item.email})`])} />
      <FilterSelect label="Status" name="status" value={filters.status} options={[["confirmed", "Confirmed"], ["cancelled", "Cancelled"], ["completed", "Completed"]]} />
      <label className="text-sm font-bold">Start date<input name="from" required type="date" defaultValue={filters.from} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
      <label className="text-sm font-bold">End date<input name="to" required type="date" defaultValue={filters.to} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
      <button className="btn-primary md:col-start-5">Apply filters</button>
    </form>
    {!result.data ? <div className="card p-6 text-red-700" role="alert">{result.error}</div> : <><div className="card p-4 sm:p-6">{result.data.items.length ? <BookingAdmin bookings={result.data.items} /> : <div className="py-10 text-center"><h2 className="font-bold">No bookings match these filters</h2></div>}<Pagination page={result.data.page} pageCount={result.data.pageCount} total={result.data.total} params={{ page: filters.page, instrument: filters.instrument, user: filters.user, status: filters.status, from: filters.from, to: filters.to }} /></div>{result.data.items.length > 0 && <LedgerAdmin bookings={result.data.items} />}</>}
  </>;
}

function FilterSelect({ label, name, value, options }: { label: string; name: string; value?: string; options: string[][] }) {
  return <label className="text-sm font-bold">{label}<select name={name} defaultValue={value ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"><option value="">All</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
