import MyBookings from "@/components/MyBookings";
import PageIntro from "@/components/PageIntro";
import { getMyBookings } from "@/lib/bookings/queries";
import { getDictionary } from "@/lib/i18n/server";

export default async function BookingsPage() {
  const [result, { t }] = await Promise.all([getMyBookings(), getDictionary()]);
  return <><PageIntro eyebrow={t("bookings.eyebrow")} title={t("bookings.title")} description={t("bookings.description")} />{!result.data ? <div role="alert" className="card p-8 text-center"><h2 className="text-lg font-bold">{t("bookings.loadError")}</h2><p className="mt-2 text-slate-500">{t("instruments.tryAgain")}</p></div> : <MyBookings bookings={result.data} />}</>;
}
