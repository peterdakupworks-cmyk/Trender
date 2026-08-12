import type { CreatorProfileRow } from "./types";
import type { SupabaseBrowserClient } from "./client";
import { getPendingCreatorRegistration, clearPendingCreatorRegistration } from "../pendingCreatorRegistration";
import { hasCreatorProfile } from "./capabilities";

export type CompleteCreatorRegistrationInput = {
  fullName: string;
  username: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  instagramUrl: string;
  tiktokUrl: string;
  submittedFollowerCount: number;
};

/**
 * Creates/updates the creator's profile fields, both required social
 * accounts, and their creator_profiles row — all in ONE atomic database
 * transaction (see migration 0004_atomic_creator_registration.sql for why
 * this has to be atomic, not three separate calls). Safe to call again for
 * a creator who already has a profile — it updates rather than duplicating.
 */
export async function completeCreatorRegistration(
  supabase: SupabaseBrowserClient,
  input: CompleteCreatorRegistrationInput
): Promise<{ data: CreatorProfileRow | null; error: string | null }> {
  const { data, error } = await supabase.rpc("complete_creator_registration", {
    p_full_name: input.fullName,
    p_username: input.username,
    p_phone: input.phone,
    p_country: input.country,
    p_state: input.state,
    p_city: input.city,
    p_instagram_url: input.instagramUrl,
    p_tiktok_url: input.tiktokUrl,
    p_submitted_follower_count: input.submittedFollowerCount,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { data: null, error: "That Instagram or TikTok account is already registered to another Trender creator." };
    }
    if (msg.includes("signed in")) {
      return { data: null, error: "Your session expired. Please log in again to finish registration." };
    }
    // Don't hide the real cause behind a generic message — surface exactly
    // what Postgres said. This is what previously made "Couldn't complete
    // your creator registration" a dead end with no way to diagnose it.
    return { data: null, error: `Couldn't complete your creator registration: ${error.message}` };
  }

  // Postgres RPC calls that return a single row come back as an object OR
  // (depending on client version) a one-element array — handle both.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { data: null, error: "Registration didn't save correctly. Please try again." };
  }
  return { data: row as CreatorProfileRow, error: null };
}

/**
 * Single source of truth for "does this authenticated user have Creator
 * capability, and if there's an unfinished registration, finish it now."
 * Used by both AuthProvider (background resume on session load) and the
 * Creator login page (needs the same resolution awaited before routing).
 * Previously this exact logic was duplicated in both places — consolidated
 * here so there's one place to fix if the underlying RPC ever changes.
 */
export async function resolveAndCheckCreatorCapability(
  supabase: SupabaseBrowserClient,
  userId: string
): Promise<{ hasProfile: boolean; error: string | null }> {
  const pending = getPendingCreatorRegistration();
  if (pending) {
    const { error } = await completeCreatorRegistration(supabase, {
      fullName: pending.fullName,
      username: pending.username,
      phone: pending.phone,
      country: "Nigeria",
      state: pending.state,
      city: pending.city,
      instagramUrl: pending.instagramUrl,
      tiktokUrl: pending.tiktokUrl,
      submittedFollowerCount: pending.submittedFollowerCount,
    });
    if (error) {
      // Leave the pending data in place so it can be retried later instead
      // of silently losing what the creator typed — but don't pretend the
      // capability check passed when we know registration didn't complete.
      return { hasProfile: false, error };
    }
    clearPendingCreatorRegistration();
  }

  return hasCreatorProfile(supabase, userId);
}
