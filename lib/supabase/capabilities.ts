import type { AdvertiserType } from "./types";
import type { SupabaseBrowserClient } from "./client";

/** Does this authenticated user already have a creator_profiles row? */
export async function hasCreatorProfile(
  supabase: SupabaseBrowserClient,
  userId: string
): Promise<{ hasProfile: boolean; error: string | null }> {
  const { data, error } = await supabase.from("creator_profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) return { hasProfile: false, error: error.message };
  return { hasProfile: !!data, error: null };
}

/**
 * Does this authenticated user already have an advertiser_profiles row of
 * the given type? Note: advertiser_profiles.user_id is a primary key (one
 * row per user) in the live schema, so a single account can currently hold
 * at most ONE advertiser identity (Music OR Business, not both at once).
 * This is a known schema limitation, not something this helper works around.
 */
export async function getAdvertiserProfile(supabase: SupabaseBrowserClient, userId: string) {
  const { data } = await supabase.from("advertiser_profiles").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

export async function hasAdvertiserProfileOfType(
  supabase: SupabaseBrowserClient,
  userId: string,
  type: AdvertiserType
): Promise<boolean> {
  const profile = await getAdvertiserProfile(supabase, userId);
  return !!profile && profile.advertiser_type === type;
}
