import { redirect } from "next/navigation";

/**
 * Business / Brand is the advertiser area. Artist/Music and Business/Brand
 * remain campaign types inside the same advertiser account. The existing
 * campaign builder already exposes both types, so route here without creating
 * a separate Artist account or registration flow.
 */
export default async function BusinessCampaignCreate({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const type = params.type === "business" ? "business" : "music";
  redirect(`/artist/campaigns/new?type=${type}&from=business`);
}
