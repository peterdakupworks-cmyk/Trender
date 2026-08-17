import { redirect } from "next/navigation";

/**
 * Artist is no longer a standalone account type.
 * Music promotion is a campaign type under the Business / Brand account.
 * Keep this legacy route as a safe redirect for old links/bookmarks.
 */
export default function ArtistRegisterRedirect() {
  redirect("/business/register");
}
