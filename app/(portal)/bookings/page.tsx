import MyBookings from "@/components/MyBookings";
import PageIntro from "@/components/PageIntro";
import { getMyBookings } from "@/lib/bookings/queries";

export default async function BookingsPage() {
  const result = await getMyBookings();
  return <><PageIntro eyebrow="Personal schedule" title="My bookings" description="Review upcoming reservations, manage eligible sessions, or browse past and cancelled bookings." />{!result.data ? <div role="alert" className="card p-8 text-center"><h2 className="text-lg font-bold">Bookings are unavailable</h2><p className="mt-2 text-slate-500">{result.error} Please try again shortly.</p></div> : <MyBookings bookings={result.data} />}</>;
}
