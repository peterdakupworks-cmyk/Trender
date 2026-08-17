import { redirect } from "next/navigation";

export default async function BusinessCampaignProgress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/artist/campaigns/${id}`);
}
