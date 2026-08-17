import { redirect } from "next/navigation";

/**
 * Business / Brand is the advertiser account. Artist / Music and Business /
 * Brand are campaign types inside that account. Keep the existing campaign
 * builder as the implementation for now while exposing it through the new
 * advertiser route.
 */
export default function BusinessCampaignCreateRedirect() {
  redirect("/artist/campaigns/new");
}
