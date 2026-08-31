"use client";
import { useCallback, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import luxonPlugin from "@fullcalendar/luxon3";
import type { DateSelectArg, EventClickArg, EventInput, EventSourceFuncArg } from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import { loadAvailability } from "@/lib/bookings/availability";
import { defaultBookingRange } from "@/lib/bookings/rules";
import BookingForm, { type BookingDraft } from "./BookingForm";
import type { CalendarBooking } from "@/types/booking";
import type { Instrument } from "@/types/instrument";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import { useI18n } from "@/lib/i18n/client";

export default function BookingCalendar({ instrument, labTimezone }: { instrument: Instrument; labTimezone: string }) {
  const { locale, t } = useI18n();
  const calendarRef = useRef<FullCalendar>(null); const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft | null>(null); const [editing, setEditing] = useState<CalendarBooking>();
  const [occupiedBy, setOccupiedBy] = useState<string>(); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [calendarLoading, setCalendarLoading] = useState(true);
  const bookable = instrument.status === "available";
  // Keep the visual grid readable even when the instrument can only be booked
  // in half-day or full-day increments. Selection still follows the real rule.
  const visualSlotMinutes = Math.min(60, Math.max(30, instrument.booking_slot_minutes));
  const availabilityError = t("calendar.loadError");
  const events = useCallback((info: EventSourceFuncArg, successCallback: (events: EventInput[]) => void, failureCallback: (error: Error) => void) => { setError(""); loadAvailability(instrument.id, info.start, info.end).then(result => { if (result.error) { setError(availabilityError); failureCallback(new Error(availabilityError)); } else successCallback(result.events); }).catch(() => { setError(availabilityError); failureCallback(new Error(availabilityError)); }); }, [availabilityError, instrument.id]);
  function openRange(start: Date, end: Date) { if (!bookable) return; setSuccess(""); setEditing(undefined); setDraft({ start, end }); }
  function openDefault(value: Date) { const range = defaultBookingRange(value, instrument, labTimezone); openRange(range.start, range.end); }
  function eventClick(info: EventClickArg) { if (info.event.extendedProps.kind === "own") { const booking = info.event.extendedProps.booking as CalendarBooking; setEditing(booking); setDraft({ start: new Date(booking.start_time), end: new Date(booking.end_time) }); } else setOccupiedBy(String(info.event.extendedProps.reserverName)); }
  function saved(message: string) { setDraft(null); setEditing(undefined); setSuccess(message); calendarRef.current?.getApi().refetchEvents(); router.refresh(); }
  return <section className="card overflow-hidden" data-locale={locale}>
    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center"><div><h2 className="font-bold">{t("calendar.title")}</h2><p className="mt-1 text-xs text-slate-500">{labTimezone} · {t("booking.interval")}: {instrument.booking_slot_minutes} {t("calendar.timeUnit")}</p></div><button disabled={!bookable} onClick={() => openDefault(new Date())} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300">{bookable ? `+ ${t("calendar.new")}` : t("calendar.unavailable")}</button></div>
    {error && <div className="m-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error} <button onClick={() => calendarRef.current?.getApi().refetchEvents()} className="underline">{t("calendar.retry")}</button></div>}{success && <div className="m-4 rounded-xl bg-teal-50 p-3 text-sm font-semibold text-teal-800" role="status">{success}</div>}
    <div className="calendar-wrap relative p-2 sm:p-4">{calendarLoading && <div className="absolute inset-0 z-10 grid place-items-center bg-white/75" role="status"><span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow">{t("common.loading")}</span></div>}<FullCalendar ref={calendarRef} plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, luxonPlugin]} locales={[zhCnLocale]} locale={locale === "zh" ? "zh-cn" : "en"} initialView="timeGridWeek" headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }} timeZone={labTimezone} nowIndicator selectable={bookable} selectMirror selectOverlap={false} slotEventOverlap={false} height={720} stickyHeaderDates slotMinTime="00:00:00" slotMaxTime="24:00:00" scrollTime="08:00:00" scrollTimeReset={false} slotDuration={{ minutes: visualSlotMinutes }} slotLabelInterval="01:00" slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }} snapDuration={{ minutes: instrument.booking_slot_minutes }} eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }} displayEventEnd events={events} loading={setCalendarLoading} select={(info: DateSelectArg) => openRange(info.start, info.end)} dateClick={(info: DateClickArg) => openDefault(info.date)} eventClick={eventClick} /></div>
    {draft && <BookingForm instrument={instrument} draft={draft} booking={editing} labTimezone={labTimezone} onClose={() => { setDraft(null); setEditing(undefined); }} onSaved={saved} onAvailabilityChanged={() => calendarRef.current?.getApi().refetchEvents()} />}
    {occupiedBy && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-6" onClick={() => setOccupiedBy(undefined)}><section role="dialog" aria-modal="true" aria-labelledby="occupied-title" className="card max-w-sm p-6" onClick={event => event.stopPropagation()}><p className="eyebrow">{t("calendar.availability")}</p><h2 id="occupied-title" className="mt-2 text-xl font-bold">{t("calendar.occupied")}：{occupiedBy}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{t("calendar.private")}</p><button autoFocus onClick={() => setOccupiedBy(undefined)} className="btn-primary mt-5 w-full">{t("calendar.chooseAnother")}</button></section></div>}
  </section>;
}
