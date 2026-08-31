"use client";
import type { EventInput } from "@fullcalendar/core";
import { createClient } from "@/lib/supabase/client";
import type { CalendarBooking } from "@/types/booking";

export type AvailabilityLoad = { events: EventInput[]; error: string | null };
export async function loadAvailability(instrumentId: string, rangeStart: Date, rangeEnd: Date): Promise<AvailabilityLoad> {
  if (rangeEnd.getTime() - rangeStart.getTime() > 93 * 24 * 60 * 60 * 1000) return { events: [], error: "The selected calendar range is too large." };
  const supabase = createClient();
  const [availability, own] = await Promise.all([
    supabase.rpc("get_instrument_availability", { requested_instrument_id: instrumentId, range_start: rangeStart.toISOString(), range_end: rangeEnd.toISOString() }),
    supabase.from("bookings").select("id,instrument_id,start_time,end_time,sample_name,sample_count,purpose,notes,status").eq("instrument_id", instrumentId).lt("start_time", rangeEnd.toISOString()).gt("end_time", rangeStart.toISOString()),
  ]);
  if (availability.error || own.error) { console.error("Availability load failed", { rpcCode: availability.error?.code, ownCode: own.error?.code }); return { events: [], error: "Calendar availability could not be loaded." }; }
  const ownById = new Map((own.data as CalendarBooking[]).map(booking => [booking.id, booking]));
  const events: EventInput[] = availability.data.map(slot => { const booking = ownById.get(slot.booking_id); if (booking) { ownById.delete(slot.booking_id); return { id: booking.id, title: `${slot.reserver_name} · ${booking.sample_name}`, start: booking.start_time, end: booking.end_time, backgroundColor: "#087f75", borderColor: "#06665e", extendedProps: { kind: "own", booking } }; } return { id: `occupied-${slot.booking_id}`, title: slot.reserver_name, start: slot.start_time, end: slot.end_time, backgroundColor: "#64748b", borderColor: "#475569", extendedProps: { kind: "occupied", reserverName: slot.reserver_name } }; });
  ownById.forEach(booking => { if (booking.status === "confirmed") events.push({ id: booking.id, title: booking.sample_name, start: booking.start_time, end: booking.end_time, backgroundColor: "#087f75", borderColor: "#06665e", extendedProps: { kind: "own", booking } }); });
  return { events, error: null };
}
