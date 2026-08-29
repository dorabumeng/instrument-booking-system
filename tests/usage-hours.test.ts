import assert from "node:assert/strict";
import test from "node:test";
import { overlapHours, summarizeUsageHours } from "../lib/admin/usage-hours.ts";

test("usage overlap counts a booking fully inside the query range", () => {
  assert.equal(overlapHours("2026-08-01T09:00:00Z", "2026-08-01T12:00:00Z", "2026-08-01T00:00:00Z", "2026-08-02T00:00:00Z"), 3);
});

test("usage overlap clips a booking crossing the range start", () => {
  assert.equal(overlapHours("2026-07-31T22:00:00Z", "2026-08-01T02:00:00Z", "2026-08-01T00:00:00Z", "2026-09-01T00:00:00Z"), 2);
});

test("usage overlap clips a booking crossing the range end", () => {
  assert.equal(overlapHours("2026-08-31T22:00:00Z", "2026-09-01T03:00:00Z", "2026-08-01T00:00:00Z", "2026-09-01T00:00:00Z"), 2);
});

test("usage overlap returns zero outside the query range", () => {
  assert.equal(overlapHours("2026-07-01T09:00:00Z", "2026-07-01T12:00:00Z", "2026-08-01T00:00:00Z", "2026-09-01T00:00:00Z"), 0);
});

test("usage summary excludes cancelled bookings", () => {
  const result = summarizeUsageHours([{ start_time: "2026-08-01T09:00:00Z", end_time: "2026-08-01T12:00:00Z", status: "cancelled" }], "2026-08-01T00:00:00Z", "2026-08-02T00:00:00Z");
  assert.deepEqual(result, { bookingCount: 0, totalHours: 0 });
});

test("usage summary adds confirmed and completed overlaps", () => {
  const result = summarizeUsageHours([
    { start_time: "2026-07-31T22:00:00Z", end_time: "2026-08-01T02:00:00Z", status: "confirmed" },
    { start_time: "2026-08-03T14:00:00Z", end_time: "2026-08-03T18:00:00Z", status: "completed" },
    { start_time: "2026-08-04T09:00:00Z", end_time: "2026-08-04T10:00:00Z", status: "cancelled" },
  ], "2026-08-01T00:00:00Z", "2026-09-01T00:00:00Z");
  assert.deepEqual(result, { bookingCount: 2, totalHours: 6 });
});
