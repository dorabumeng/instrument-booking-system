import { DateTime } from "luxon";
import type { Instrument } from "@/types/instrument";
import type { FieldErrors } from "@/types/action-result";

export type BookingRules = Pick<Instrument, "booking_slot_minutes" | "min_booking_minutes" | "max_booking_minutes">;
export function durationLabel(minutes: number) { if (minutes === 1440) return "1 day"; if (minutes === 720) return "Half day"; if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`; return `${minutes} minutes`; }
export function alignToSlot(value: Date, rules: BookingRules, zone: string) { const local = DateTime.fromJSDate(value).setZone(zone); const minute = local.hour * 60 + local.minute; const aligned = Math.ceil(minute / rules.booking_slot_minutes) * rules.booking_slot_minutes; return local.startOf("day").plus({ minutes: aligned }).toJSDate(); }
export function defaultBookingRange(value: Date, rules: BookingRules, zone: string) { const start = alignToSlot(value, rules, zone); return { start, end: DateTime.fromJSDate(start).setZone(zone).plus({ minutes: rules.min_booking_minutes }).toJSDate() }; }
export function validateBookingRules(startIso: string, endIso: string, rules: BookingRules, zone: string): FieldErrors {
  const errors: FieldErrors = {}; const start = DateTime.fromISO(startIso).setZone(zone); const end = DateTime.fromISO(endIso).setZone(zone); const duration = end.diff(start, "minutes").minutes;
  const aligned = (value: DateTime) => value.second === 0 && value.millisecond === 0 && (value.hour * 60 + value.minute) % rules.booking_slot_minutes === 0;
  if (!aligned(start)) errors.startTime = `Start time must align to ${durationLabel(rules.booking_slot_minutes)} intervals.`;
  if (!aligned(end)) errors.endTime = `End time must align to ${durationLabel(rules.booking_slot_minutes)} intervals.`;
  if (duration < rules.min_booking_minutes) errors.endTime = `Minimum booking duration is ${durationLabel(rules.min_booking_minutes)}.`;
  if (rules.max_booking_minutes != null && duration > rules.max_booking_minutes) errors.endTime = `Maximum booking duration is ${durationLabel(rules.max_booking_minutes)}.`;
  return errors;
}
