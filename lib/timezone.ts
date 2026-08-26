import { DateTime } from "luxon";

export function labDateTimeToIso(date: string, time: string, zone: string) {
  const value = DateTime.fromISO(`${date}T${time}`, { zone, setZone: true });
  if (!value.isValid) throw new Error("The selected laboratory date or time is invalid.");
  return value.toUTC().toISO({ suppressMilliseconds: true });
}

export function datePartsInZone(value: Date | string, zone: string) {
  const date = typeof value === "string" ? DateTime.fromISO(value, { setZone: true }) : DateTime.fromJSDate(value);
  const zoned = date.setZone(zone);
  if (!zoned.isValid) throw new Error("The timestamp could not be represented in the laboratory timezone.");
  return { date: zoned.toFormat("yyyy-LL-dd"), time: zoned.toFormat("HH:mm") };
}

export function labDayBounds(reference: Date, zone: string) {
  const start = DateTime.fromJSDate(reference).setZone(zone).startOf("day");
  return { start: start.toUTC().toISO()!, end: start.plus({ days: 1 }).toUTC().toISO()! };
}
