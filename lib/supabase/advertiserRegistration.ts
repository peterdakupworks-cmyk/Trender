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
 * Saves the shared advertiser profile for the current authenticated user.
 * The product now has only two account types: Creator and Business / Brand.
 * Artist / Music is a campaign type, not a standalone advertiser account.
 *
 * `advertiser_type` is retained for backward compatibility with existing
 * prototype data. New Business / Brand registrations are stored as business
 * accounts; music remains available as a campaign type in the campaign
 * builder and does not create a separate Artist account.
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

  const isLegacyMusicProfile = input.advertiserType === "music";

  const { data, error: advertiserError } = await supabase
    .from("advertiser_profiles")
    .upsert(
      {
        user_id: input.userId,
        advertiser_type: input.advertiserType,
        is_artist: isLegacyMusicProfile ? true : false,
        is_business: true,
        brand_name: input.brandName || input.name,
        category: isLegacyMusicProfile ? "Music" : input.category,
        description: input.description || null,
        website_url: input.websiteUrl || null,
        logo_url: input.logoUrl || null,
        contact_info: input.contactInfo || null,
        spotify_url: isLegacyMusicProfile ? input.spotifyUrl || null : null,
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
