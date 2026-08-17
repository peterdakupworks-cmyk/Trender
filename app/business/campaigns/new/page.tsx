"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import NewCampaign from "../../../artist/campaigns/new/page";

function BusinessCampaignPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") === "business" ? "business" : "music";

  return <NewCampaign initialCampaignType={type} advertiserRole="business" />;
}

export default function BusinessCampaignCreate() {
  return (
    <Suspense fallback={<main className="center"><p className="muted">Loading…</p></main>}>
      <BusinessCampaignPage />
    </Suspense>
  );
}
