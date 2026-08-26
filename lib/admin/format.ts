import type { Json } from "@/types/database";
export function formatDuration(start: string, end: string) { const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)); const hours = Math.floor(minutes / 60); const rest = minutes % 60; return [hours ? `${hours} h` : "", rest ? `${rest} min` : ""].filter(Boolean).join(" ") || "0 min"; }
export function auditSummary(action: string, metadata: Json) { const data = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}; const label = action.split("_").map(word => word[0]?.toUpperCase() + word.slice(1)).join(" "); const name = typeof data.name === "string" ? data.name : null; const status = typeof data.status === "string" ? data.status : null; return [label, name, status ? `Status: ${status}` : null].filter(Boolean).join(" · "); }
export function sanitizeCsvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  // A leading apostrophe makes spreadsheet programs treat potentially executable
  // formula-like input as text. Preserve whitespace and quote it normally below.
  return /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
}
export function escapeCsv(value: string | number | null | undefined) { const text = sanitizeCsvCell(value); return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
