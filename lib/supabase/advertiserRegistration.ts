import type { AdvertiserProfileRow, AdvertiserType } from "./types";
import type { SupabaseBrowserClient } from "./client";

export type CompleteAdvertiserRegistrationInput = {
  userId: string;
  advertiserType: AdvertiserType;
  isArtist?: boolean;
  isBusiness?: boolean;
  profileName?: string;
  brandName?: string;
  name: string;
  country: string;
  state: string;
  city: string;
  category: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  contactInfo: string;
  spotifyUrl: string;
};

/**
 * Updates the shared profile fields and upserts the advertiser_profiles row
 * for the CURRENT authenticated user. Deliberately does NOT touch
 * profiles.role — capability (Creator vs. Artist vs. Business) is
 * determined by which of creator_profiles / advertiser_profiles rows exist
 * for this user_id, not by a single role column. This also sidesteps a live
 * bug where the profiles.role-change trigger unconditionally rejects any
 * role change (see the Phase 3A audit) — that trigger is simply never
 * invoked by this flow.
 *
 * Safe to call again for an advertiser who already has a profile — the
 * advertiser_profiles upsert updates rather than duplicates (user_id is the
 * table's primary key).
 */
export async function completeAdvertiserRegistration(
  supabase: SupabaseBrowserClient,
  input: CompleteAdvertiserRegistrationInput
): Promise<{ data: AdvertiserProfileRow | null; error: string | null }> {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.name,
      country: input.country,
      state: input.state || null,
      city: input.city || null,
    })
    .eq("id", input.userId);

  if (profileError) {
    return { data: null, error: "Couldn't save your profile details. Please try again." };
  }

  const { data, error: advertiserError } = await supabase
    .from("advertiser_profiles")
    .upsert(
      {
        user_id: input.userId,
        advertiser_type: input.advertiserType,
        is_artist: input.isArtist ?? input.advertiserType === "music",
        is_business: input.isBusiness ?? input.advertiserType === "business",
        brand_name: input.brandName || input.name,
        category: input.advertiserType === "business" ? input.category : "Music",
        description: input.description || null,
        website_url: input.websiteUrl || null,
        logo_url: input.logoUrl || null,
        contact_info: input.contactInfo || null,
        spotify_url: input.advertiserType === "music" ? input.spotifyUrl || null : null,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (advertiserError || !data) {
    return { data: null, error: "Couldn't save your advertiser profile. Please try again." };
  }

  return { data: data as AdvertiserProfileRow, error: null };
}
