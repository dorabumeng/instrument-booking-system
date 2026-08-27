"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";
import { archiveInstrument, changeInstrumentStatus, createInstrument, updateInstrument } from "@/lib/admin/mutations";
import { useI18n } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { AdminInstrument, InstrumentAdminInput } from "@/types/admin";
import type { InstrumentStatus } from "@/types/instrument";

type Confirmation = { kind: "status" | "archive"; instrument: AdminInstrument; status?: InstrumentStatus };
type Translate = (key: TranslationKey) => string;

const empty: InstrumentAdminInput = { name: "", description: "", location: "", manager: "", status: "available", imageUrl: "", assetNumber: "", bookingSlotMinutes: 30, minBookingMinutes: 30, maxBookingMinutes: null };
const timeOptions = [
  [15, "duration.15m"], [30, "duration.30m"], [45, "duration.45m"], [60, "duration.1h"], [120, "duration.2h"], [180, "duration.3h"], [240, "duration.4h"], [360, "duration.6h"], [480, "duration.8h"], [720, "duration.halfDay"], [1440, "duration.1d"], [2880, "duration.2d"], [4320, "duration.3d"], [10080, "duration.1w"], [20160, "duration.2w"], [43200, "duration.30d"],
] as const satisfies ReadonlyArray<readonly [number, TranslationKey]>;

function statusKey(status: InstrumentStatus): TranslationKey { return `instrument.${status}`; }
function markKey(status: InstrumentStatus): TranslationKey { return `admin.instrument.mark${status[0].toUpperCase()}${status.slice(1)}` as TranslationKey; }
function durationText(minutes: number, t: Translate, locale: "zh" | "en") { const preset = timeOptions.find(([value]) => value === minutes); if (preset) return t(preset[1]); return locale === "zh" ? `${minutes} 分钟（${t("duration.custom")}）` : `${minutes} minutes (${t("duration.custom")})`; }
function futureText(count: number, t: Translate, locale: "zh" | "en") { if (count === 0) return t("admin.instrument.futureNone"); if (count === 1) return t("admin.instrument.futureOne"); return locale === "zh" ? `${count} ${t("admin.instrument.futureMany")}` : `${count} ${t("admin.instrument.futureMany")}`; }

export default function InstrumentAdmin({ instruments }: { instruments: AdminInstrument[] }) {
  const router = useRouter();
  const { locale, t, errorMessage } = useI18n();
  const [editing, setEditing] = useState<AdminInstrument | "new">();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function finish(result: Awaited<ReturnType<typeof changeInstrumentStatus>>, successKey: TranslationKey) {
    if (result.success) { setMessage(t(successKey)); setConfirmation(undefined); setEditing(undefined); router.refresh(); }
    else setError(errorMessage(result.code, result.message));
  }
  function confirmAction() {
    if (!confirmation) return;
    setError("");
    startTransition(async () => {
      if (confirmation.kind === "archive") finish(await archiveInstrument(confirmation.instrument.id, true), "admin.instrument.archivedSuccess");
      else finish(await changeInstrumentStatus(confirmation.instrument.id, confirmation.status ?? "unavailable", true), "admin.instrument.statusChanged");
    });
  }

  const confirmCount = confirmation ? futureText(confirmation.instrument.future_booking_count, t, locale) : "";
  const confirmMessage = confirmation ? `${confirmCount}. ${t("admin.instrument.confirmBase")}${confirmation.kind === "archive" ? ` ${t("admin.instrument.confirmArchive")}` : ""}` : "";

  return <>
    {message && <p className="mb-5 rounded-xl bg-teal-50 p-4 text-sm font-semibold text-teal-800" role="status">{message}</p>}
    {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">{error}</p>}
    <div className="mb-5 flex justify-end"><button onClick={() => setEditing("new")} className="btn-primary">+ {t("admin.instrument.add")}</button></div>
    {instruments.length ? <div className="space-y-4">{instruments.map(item => <article key={item.id} className={`card p-5 ${item.archived_at ? "opacity-65" : ""}`}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{item.name}</h2><span className={`status status-${item.status}`}>{t(statusKey(item.status))}</span>{item.archived_at && <span className="status status-unavailable">{t("instrument.archived")}</span>}</div><p className="mt-1 text-sm text-slate-500">{item.location} · {item.manager}</p><p className="mt-2 text-sm font-semibold text-slate-700">{futureText(item.future_booking_count, t, locale)}</p></div>
      {!item.archived_at && <div className="flex flex-wrap gap-2"><button onClick={() => setEditing(item)} className="btn-secondary">{t("common.edit")}</button>{(["available", "maintenance", "unavailable"] as const).filter(status => status !== item.status).map(status => <button key={status} onClick={() => setConfirmation({ kind: "status", instrument: item, status })} className="btn-secondary">{t(markKey(status))}</button>)}<button onClick={() => setConfirmation({ kind: "archive", instrument: item })} className="rounded-xl px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">{t("admin.instrument.archive")}</button></div>}</div>
    </article>)}</div> : <div className="card p-10 text-center"><h2 className="text-lg font-bold">{t("admin.instrument.emptyTitle")}</h2><p className="mt-2 text-slate-500">{t("admin.instrument.emptyDescription")}</p></div>}
    {editing && <InstrumentForm instrument={editing === "new" ? undefined : editing} pending={pending} onClose={() => setEditing(undefined)} onSubmit={input => { setError(""); startTransition(async () => { const isNew = editing === "new"; const result = isNew ? await createInstrument(input) : await updateInstrument(editing.id, input); if (result.success) { setMessage(t(isNew ? "admin.instrument.created" : "admin.instrument.updated")); setEditing(undefined); router.refresh(); } else setError(errorMessage(result.code, result.message)); }); }} />}
    {confirmation && <ConfirmDialog title={t(confirmation.kind === "archive" ? "admin.instrument.archiveTitle" : "admin.instrument.statusTitle")} message={confirmMessage} confirmLabel={t(confirmation.kind === "archive" ? "admin.instrument.archiveConfirm" : "admin.instrument.statusConfirm")} cancelLabel={t("common.keepUnchanged")} pendingLabel={t("common.working")} dangerous={confirmation.kind === "archive" || confirmation.status === "unavailable"} pending={pending} onClose={() => setConfirmation(undefined)} onConfirm={confirmAction} />}
  </>;
}

function InstrumentForm({ instrument, pending, onClose, onSubmit }: { instrument?: AdminInstrument; pending: boolean; onClose: () => void; onSubmit: (input: InstrumentAdminInput) => void }) {
  const { locale, t } = useI18n();
  const [fields, setFields] = useState<InstrumentAdminInput>(instrument ? { name: instrument.name, description: instrument.description, location: instrument.location, manager: instrument.manager, status: instrument.status, imageUrl: instrument.image_url ?? "", assetNumber: instrument.asset_number ?? "", bookingSlotMinutes: instrument.booking_slot_minutes, minBookingMinutes: instrument.min_booking_minutes, maxBookingMinutes: instrument.max_booking_minutes } : empty);
  const set = <K extends keyof InstrumentAdminInput>(key: K, value: InstrumentAdminInput[K]) => setFields(current => ({ ...current, [key]: value }));
  const setSlot = (slot: number) => setFields(current => { const minimum = current.minBookingMinutes && current.minBookingMinutes >= slot && current.minBookingMinutes % slot === 0 ? current.minBookingMinutes : slot; const maximum = current.maxBookingMinutes && current.maxBookingMinutes >= minimum && current.maxBookingMinutes % slot === 0 ? current.maxBookingMinutes : null; return { ...current, bookingSlotMinutes: slot, minBookingMinutes: minimum, maxBookingMinutes: maximum }; });
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="instrument-form-title" className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"><h2 id="instrument-form-title" className="text-2xl font-bold">{t(instrument ? "admin.instrument.edit" : "admin.instrument.add")}</h2>
    <form onSubmit={event => { event.preventDefault(); onSubmit(fields); }} className="mt-6 space-y-4">
      <Input id="instrument-name" label={t("admin.instrument.name")} value={fields.name} onChange={value => set("name", value)} /><Input id="instrument-asset-number" label={t("admin.instrument.assetNumber")} optional value={fields.assetNumber} onChange={value => set("assetNumber", value)} /><Input id="instrument-location" label={t("admin.instrument.location")} value={fields.location} onChange={value => set("location", value)} /><Input id="instrument-manager" label={t("admin.instrument.manager")} value={fields.manager} onChange={value => set("manager", value)} />
      <label htmlFor="instrument-description" className="block text-sm font-bold">{t("admin.instrument.descriptionField")}<textarea id="instrument-description" rows={4} maxLength={5000} value={fields.description} onChange={event => set("description", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label><Input id="instrument-image-url" label={t("admin.instrument.imageUrl")} optional type="url" value={fields.imageUrl} onChange={value => set("imageUrl", value)} />
      <fieldset className="rounded-2xl border border-slate-200 p-4"><legend className="px-2 font-bold">{t("admin.instrument.rulesHeading")}</legend><p className="mb-4 text-sm text-slate-500">{t("admin.instrument.rulesHelp")}</p><div className="grid gap-3 sm:grid-cols-3"><TimeSelect id="booking-interval" label={t("booking.interval")} value={fields.bookingSlotMinutes ?? 30} allowed={minutes => minutes <= 1440 && 1440 % minutes === 0} t={t} locale={locale} onChange={value => { if (value != null) setSlot(value); }} /><TimeSelect id="minimum-duration" label={t("booking.minimum")} value={fields.minBookingMinutes ?? fields.bookingSlotMinutes ?? 30} allowed={minutes => minutes >= (fields.bookingSlotMinutes ?? 30) && minutes % (fields.bookingSlotMinutes ?? 30) === 0} t={t} locale={locale} onChange={value => { if (value == null) return; set("minBookingMinutes", value); if (fields.maxBookingMinutes != null && fields.maxBookingMinutes < value) set("maxBookingMinutes", null); }} /><TimeSelect id="maximum-duration" label={t("booking.maximum")} value={fields.maxBookingMinutes} optional allowed={minutes => minutes >= (fields.minBookingMinutes ?? 30) && minutes % (fields.bookingSlotMinutes ?? 30) === 0} t={t} locale={locale} onChange={value => set("maxBookingMinutes", value)} /></div></fieldset>
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t("admin.instrument.rulesHistory")}</p>{instrument ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{t("admin.instrument.statusHelp")}</p> : <label htmlFor="instrument-status" className="block text-sm font-bold">{t("admin.instrument.initialStatus")}<select id="instrument-status" value={fields.status} onChange={event => set("status", event.target.value as InstrumentStatus)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"><option value="available">{t("instrument.available")}</option><option value="maintenance">{t("instrument.maintenance")}</option><option value="unavailable">{t("instrument.unavailable")}</option></select></label>}
      <div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={onClose} className="btn-secondary">{t("common.cancel")}</button><button disabled={pending} className="btn-primary disabled:opacity-50">{pending ? t("common.saving") : t("admin.instrument.save")}</button></div>
    </form></section></div>;
}

function TimeSelect({ id, label, value, optional, allowed, t, locale, onChange }: { id: string; label: string; value: number | null; optional?: boolean; allowed: (minutes: number) => boolean; t: Translate; locale: "zh" | "en"; onChange: (value: number | null) => void }) {
  const options = timeOptions.filter(([minutes]) => allowed(minutes));
  const hasCurrent = value == null || options.some(([minutes]) => minutes === value);
  return <label htmlFor={id} className="text-sm font-bold">{label}<select id={id} required={!optional} value={value ?? ""} onChange={event => onChange(event.target.value === "" ? null : Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal">{optional && <option value="">{t("booking.none")}</option>}{!hasCurrent && value != null && <option value={value}>{durationText(value, t, locale)}</option>}{options.map(([minutes, key]) => <option key={minutes} value={minutes}>{t(key)}</option>)}</select></label>;
}

function Input({ id, label, value, onChange, type = "text", optional = false }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: string; optional?: boolean }) { return <label htmlFor={id} className="block text-sm font-bold">{label}<input id={id} required={!optional} type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>; }
