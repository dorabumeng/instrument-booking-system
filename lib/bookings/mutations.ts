"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateBookingInput } from "./validation";
import { mapBookingError } from "./errors";
import type { ActionResult } from "@/types/action-result";
import type { Booking, BookingInput } from "@/types/booking";

async function authenticatedContext(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | null> { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return user ? { supabase, userId: user.id } : null; }
function refreshBookingPaths(instrumentId: string) { revalidatePath("/dashboard"); revalidatePath("/bookings"); revalidatePath(`/instruments/${instrumentId}`); }

export async function createBooking(instrumentId: string, input: BookingInput): Promise<ActionResult<Booking>> {
  const auth = await authenticatedContext(); if (!auth) return { success: false, code: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." };
  const validated = validateBookingInput(input); if (!validated.value) return { success: false, code: "VALIDATION_ERROR", message: "Check the highlighted fields.", fieldErrors: validated.fieldErrors };
  const instrument = await auth.supabase.from("instruments").select("id,status").eq("id", instrumentId).maybeSingle();
  if (instrument.error) return mapBookingError(instrument.error); if (!instrument.data) return { success: false, code: "NOT_FOUND", message: "This instrument no longer exists." }; if (instrument.data.status !== "available") return { success: false, code: "INSTRUMENT_UNAVAILABLE", message: "This instrument is not currently available for booking." };
  const value = validated.value; const { data, error } = await auth.supabase.from("bookings").insert({ instrument_id: instrumentId, user_id: auth.userId, start_time: value.startTime, end_time: value.endTime, sample_name: value.sampleName, purpose: value.purpose, notes: value.notes, status: "confirmed" }).select().single();
  if (error) return mapBookingError(error); refreshBookingPaths(instrumentId); return { success: true, data, message: "Booking confirmed." };
}

export async function updateBooking(bookingId: string, input: BookingInput): Promise<ActionResult<Booking>> {
  const auth = await authenticatedContext(); if (!auth) return { success: false, code: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." };
  const validated = validateBookingInput(input); if (!validated.value) return { success: false, code: "VALIDATION_ERROR", message: "Check the highlighted fields.", fieldErrors: validated.fieldErrors };
  const existing = await auth.supabase.from("bookings").select("*").eq("id", bookingId).eq("user_id", auth.userId).maybeSingle();
  if (existing.error) return mapBookingError(existing.error); if (!existing.data) return { success: false, code: "NOT_FOUND", message: "The booking could not be found." }; if (existing.data.status !== "confirmed" || new Date(existing.data.start_time) <= new Date()) return { success: false, code: "FORBIDDEN", message: "Only future confirmed bookings can be edited." };
  const value = validated.value; const { data, error } = await auth.supabase.from("bookings").update({ start_time: value.startTime, end_time: value.endTime, sample_name: value.sampleName, purpose: value.purpose, notes: value.notes }).eq("id", bookingId).eq("user_id", auth.userId).select().single();
  if (error) return mapBookingError(error); refreshBookingPaths(existing.data.instrument_id); return { success: true, data, message: "Booking updated." };
}

export async function cancelBooking(bookingId: string): Promise<ActionResult<Booking>> {
  const auth = await authenticatedContext(); if (!auth) return { success: false, code: "UNAUTHENTICATED", message: "Your session has expired. Please sign in again." };
  const existing = await auth.supabase.from("bookings").select("*").eq("id", bookingId).eq("user_id", auth.userId).maybeSingle();
  if (existing.error) return mapBookingError(existing.error); if (!existing.data) return { success: false, code: "NOT_FOUND", message: "The booking could not be found." }; if (existing.data.status !== "confirmed" || new Date(existing.data.start_time) <= new Date()) return { success: false, code: "FORBIDDEN", message: "Only future confirmed bookings can be cancelled." };
  const { data, error } = await auth.supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId).eq("user_id", auth.userId).select().single();
  if (error) return mapBookingError(error); refreshBookingPaths(existing.data.instrument_id); return { success: true, data, message: "Booking cancelled." };
}
