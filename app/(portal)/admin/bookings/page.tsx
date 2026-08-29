import PageIntro from "@/components/PageIntro";
import BookingAdmin from "@/components/admin/BookingAdmin";
import LedgerAdmin from "@/components/admin/LedgerAdmin";
import Pagination from "@/components/admin/Pagination";
import UsageStatistics from "@/components/admin/UsageStatistics";
import { getAdminBookings, getBookingFilterOptions, type AdminBookingFilters } from "@/lib/admin/bookings";
import { getInstrumentUsageStatistics, type UsageStatisticsFilters } from "@/lib/admin/usage-statistics";
import { getLabTimezone } from "@/lib/config/env";
import { getDictionary } from "@/lib/i18n/server";

type Params = AdminBookingFilters & UsageStatisticsFilters;

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const filters = await searchParams;
  const [result, options, usageResult, { locale }] = await Promise.all([
    getAdminBookings(filters),
    getBookingFilterOptions(),
    getInstrumentUsageStatistics(filters),
    getDictionary(),
  ]);

  return <>
    <PageIntro eyebrow="管理后台" title="预约管理" description="查看预约、导出预约记录并补充学校仪器使用台账。" />
    <UsageStatistics
      filters={filters}
      result={usageResult}
      instruments={options.instruments}
      locale={locale}
      labTimezone={getLabTimezone()}
      preservedParams={{ instrument: filters.instrument, user: filters.user, status: filters.status, from: filters.from, to: filters.to, page: filters.page }}
    />
    <form method="get" className="card mb-5 grid gap-3 p-4 md:grid-cols-5">
      <input type="hidden" name="usageInstrument" value={filters.usageInstrument ?? ""} />
      <input type="hidden" name="usageStart" value={filters.usageStart ?? ""} />
      <input type="hidden" name="usageEnd" value={filters.usageEnd ?? ""} />
      <FilterSelect label="仪器" name="instrument" value={filters.instrument} options={options.instruments.map(item => [item.id, item.name])} />
      <FilterSelect label="用户" name="user" value={filters.user} options={options.users.map(item => [item.id, `${item.full_name} (${item.email})`])} />
      <FilterSelect label="状态" name="status" value={filters.status} options={[["confirmed", "已确认"], ["cancelled", "已取消"], ["completed", "已完成"]]} />
      <label className="text-sm font-bold">开始日期<input name="from" required type="date" defaultValue={filters.from} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
      <label className="text-sm font-bold">结束日期<input name="to" required type="date" defaultValue={filters.to} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
      <div className="flex flex-wrap justify-end gap-3 md:col-span-5">
        <button className="btn-secondary" type="submit">筛选预约</button>
        <button className="btn-primary" type="submit" formAction="/admin/bookings/export">导出 Excel</button>
      </div>
      <p className="text-xs text-slate-500 md:col-span-5 md:text-right">导出内容将使用当前仪器、用户、状态和日期条件；日期范围最长为三年。</p>
    </form>
    {!result.data
      ? <div className="card p-6 text-red-700" role="alert">预约记录加载失败，请稍后重试。</div>
      : <>
        <div className="card p-4 sm:p-6">
          {result.data.items.length ? <BookingAdmin bookings={result.data.items} /> : <div className="py-10 text-center"><h2 className="font-bold">没有符合筛选条件的预约记录</h2></div>}
          <Pagination page={result.data.page} pageCount={result.data.pageCount} total={result.data.total} params={{ page: filters.page, instrument: filters.instrument, user: filters.user, status: filters.status, from: filters.from, to: filters.to }} />
        </div>
        {result.data.items.length > 0 && <LedgerAdmin bookings={result.data.items} />}
      </>}
  </>;
}

function FilterSelect({ label, name, value, options }: { label: string; name: string; value?: string; options: string[][] }) {
  return <label className="text-sm font-bold">{label}<select name={name} defaultValue={value ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"><option value="">全部</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
