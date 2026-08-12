// Hand-written types for Phase 3A (auth/profile/registration tables only).
// TODO once a real Supabase project exists: run
//   supabase gen types typescript --project-id <id> > lib/supabase/types.ts
// to get fully accurate, complete generated types for every table.
//
// IMPORTANT: these types match migration 0001_phase3a_foundation.sql only.
// Migration 0002_creator_registration_foundation.sql (which renames
// follower_count -> submitted_follower_count, handle -> profile_url, and
// adds verification_status/account_status enums) has NOT been applied to
// the live database as of this revision. If you later apply 0002, these
// types — and the frontend code that reads creator_profiles.identity_status
// / creator_social_accounts.handle — will need updating to match.

export type UserRole = "creator" | "advertiser" | "admin";
export type AdvertiserType = "music" | "business";
export type CreatorTierDb = "starter" | "midtier" | "pro";
export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "youtube" | "x";

export type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
  bio: string | null;
  country: string;
  state: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatorProfileRow = {
  user_id: string;
  follower_count: number;
  tier: CreatorTierDb;
  account_status: string; // plain text in the live schema, e.g. 'active'
  identity_status: string; // plain text, defaults to 'pending' — see migration 0004
  trender_score: number;
  created_at: string;
  updated_at: string;
};

export type CreatorSocialAccountRow = {
  id: string;
  creator_id: string;
  platform: SocialPlatform;
  handle: string;
  created_at: string;
};

export type AdvertiserProfileRow = {
  user_id: string;
  advertiser_type: AdvertiserType;
  brand_name: string;
  logo_url: string | null;
  description: string | null;
  category: string | null;
  website_url: string | null;
  contact_info: string | null;
  spotify_url: string | null;
  created_at: string;
  updated_at: string;
};

// Minimal Database shape covering the tables used by Phase 3A app code.
// Other tables from the migration exist in Postgres but aren't typed here yet.
//
// NOTE ON `Relationships` AND `Views` BELOW:
// @supabase/postgrest-js requires every table entry to structurally match its
// internal `GenericTable` type, which includes a required `Relationships`
// array, and requires the schema to have a `Views` key. Real
// `supabase gen types` output always includes these (usually `Relationships: []`
// for tables with no FK relationships modeled, and `Views: { [_ in never]: never }`
// when there are no views). This hand-written file was missing both, which is
// exactly why .update()/.insert() calls were resolving to `never` — not a
// bug in the calling code, a gap in this type definition.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      creator_profiles: {
        Row: CreatorProfileRow;
        Insert: Partial<CreatorProfileRow> & { user_id: string };
        Update: Partial<CreatorProfileRow>;
        Relationships: [];
      };
      creator_social_accounts: {
        Row: CreatorSocialAccountRow;
        Insert: Partial<CreatorSocialAccountRow> & { creator_id: string; platform: SocialPlatform; handle: string };
        Update: Partial<CreatorSocialAccountRow>;
        Relationships: [];
      };
      advertiser_profiles: {
        Row: AdvertiserProfileRow;
        Insert: Partial<AdvertiserProfileRow> & { user_id: string; advertiser_type: AdvertiserType; brand_name: string };
        Update: Partial<AdvertiserProfileRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      complete_creator_registration: {
        Args: {
          p_full_name: string;
          p_username: string;
          p_phone: string;
          p_country: string;
          p_state: string;
          p_city: string;
          p_instagram_url: string;
          p_tiktok_url: string;
          p_submitted_follower_count: number;
        };
        Returns: CreatorProfileRow;
      };
      debug_my_creator_registration_status: {
        Args: Record<string, never>;
        Returns: {
          has_profile: boolean;
          has_creator_profile: boolean;
          has_instagram: boolean;
          has_tiktok: boolean;
          identity_status: string | null;
          account_status: string | null;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
