import Link from "next/link";
import { AppNav } from "../../../../components/AppNav";
import { campaigns, totalCreatorsRequested, rewardLabel, computeCampaignPricing } from "../../../../lib/mock";

export default async function CampaignProgress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = campaigns.find((x) => x.id === id) ?? campaigns[0];
  const allocation = totalCreatorsRequested(c);
  const remainingSlots = allocation - c.demoProgress.claimed;
  const pricing = computeCampaignPricing(c.creatorMix);

  return (
    <>
      <AppNav role="artist" />
      <main className="page">
        <div className="container">
          <Link href="/artist" className="muted">← Back to dashboard</Link>
          <div className="card card-pad" style={{ marginTop: 18 }}>
            <span className="badge purple">{c.campaignType === "music" ? "🎵 Music campaign" : "🏢 Business campaign"}</span>
            <span className="badge" style={{ marginLeft: 8 }}>{c.status}</span>
            <h1>{c.title}</h1>
            <p className="muted">{c.advertiser} · {c.category} · {rewardLabel(c)} reward</p>

            <div className="notice" style={{ marginTop: 14 }}>
              🧪 <strong>DEMO DATA:</strong> These execution numbers are static mock figures for this prototype. Real
              numbers will be computed from live creator claims and submissions once Supabase is connected in Phase 3.
            </div>

            <h3 style={{ marginTop: 22 }}>Campaign progress</h3>
            <div className="grid grid-3">
              <div className="card stat"><small>Creator allocation</small><strong>{allocation}</strong></div>
              <div className="card stat"><small>Creators claimed</small><strong>{c.demoProgress.claimed}</strong></div>
              <div className="card stat"><small>Content submitted</small><strong>{c.demoProgress.submitted}</strong></div>
              <div className="card stat"><small>Content approved</small><strong>{c.demoProgress.approved}</strong></div>
              <div className="card stat"><small>Content rejected</small><strong>{c.demoProgress.rejected}</strong></div>
              <div className="card stat"><small>Remaining slots</small><strong>{remainingSlots}</strong></div>
            </div>

            <h3 style={{ marginTop: 22 }}>Budget</h3>
            <div className="distribution-preview">
              <div className="grid" style={{ marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Creator Allocation</span>
                  <strong>₦{pricing.creatorAllocation.toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Trender Platform Fee (7.5%)</span>
                  <strong>₦{pricing.platformFee.toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
                  <span>Total Amount Payable</span>
                  <strong style={{ fontSize: 20 }}>₦{pricing.totalPayable.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: 22 }}>Location</h3>
            <p className="muted">
              {c.targetScope === "city" ? `📍 ${c.targetCity}, ${c.targetState}` : "🇳🇬 All Nigeria"}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
