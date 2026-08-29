import test from "node:test";
import assert from "node:assert/strict";
import { validateSupabaseUrl } from "../lib/supabase/env.ts";

test("accepts Supabase project root URLs", () => {
  assert.equal(validateSupabaseUrl("https://example.supabase.co"), "https://example.supabase.co");
  assert.equal(validateSupabaseUrl("http://127.0.0.1:54321/"), "http://127.0.0.1:54321");
});

test("rejects REST endpoints and other non-root URLs", () => {
  assert.throws(() => validateSupabaseUrl("https://example.supabase.co/rest/v1/"), /project root URL/);
  assert.throws(() => validateSupabaseUrl("https://example.supabase.co?debug=true"), /project root URL/);
  assert.throws(() => validateSupabaseUrl("not-a-url"), /valid URL/);
});
