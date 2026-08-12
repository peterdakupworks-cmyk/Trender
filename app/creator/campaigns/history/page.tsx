"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "../../../../components/AppNav";
import { campaigns, CREATOR_TIERS, Campaign } from "../../../../lib/mock";
import { Claim, getAllClaims, ClaimStatus } from "../../../../lib/claims";

type Tab = "ACTIVE" | "PENDING REVIEW" | "COMPLETED" | "EXPIRED";

const TABS: Tab[] = ["ACTIVE", "PENDING REVIEW", "COMPLETED", "EXPIRED"];

function tabForStatus(status: ClaimStatus): Tab {
  if (status === "CLAIMED") return "ACTIVE";
  if (status === "SUBMITTED") return "PENDING REVIEW";
  if (status === "EXPIRED") return "EXPIRED";
  return "COMPLETED"; // APPROVED or REJECTED
}

function statusBadgeClass(status: ClaimStatus) {
  if (status === "APPROVED") return "badge";
  if (status === "SUBMITTED") return "badge warning";
  if (status === "REJECTED" || status === "EXPIRED") return "badge danger";
  return "badge purple"; // CLAIMED
}

function formatDate(ms?: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function CampaignHistory() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [tab, setTab] = useState<Tab>("ACTIVE");

  useEffect(() => {
    setClaims(getAllClaims());
  }, []);

  const records = useMemo(() => {
    if (!claims) return [];
    return claims
      .map((claim) => ({ claim, campaign: campaigns.find((c) => c.id === claim.campaignId) }))
      .filter((r): r is { claim: Claim; campaign: Campaign } => !!r.campaign);
  }, [claims]);

  const visible = records.filter((r) => tabForStatus(r.claim.status) === tab);

  const totalEarned = records
    .filter((r) => r.claim.status === "APPROVED")
    .reduce((sum, r) => sum + CREATOR_TIERS.find((t) => t.id === r.claim.tierId)!.ratePerCreator, 0);
  const completedCount = records.filter((r) => r.claim.status === "APPROVED").length;

  return (
    <>
      <AppNav role="creator" />
      <main className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1>My Campaigns</h1>
              <p className="muted">Every campaign you've claimed on Trender, and how it turned out.</p>
            </div>
          </div>

          <div className="grid grid-3">
            <div className="card stat"><small>Campaigns completed</small><strong>{completedCount}</strong></div>
            <div className="card stat"><small>Total earned (approved)</small><strong>₦{totalEarned.toLocaleString()}</strong></div>
            <div className="card stat"><small>Total records</small><strong>{records.length}</strong></div>
          </div>

          <div className="notice" style={{ marginTop: 16 }}>
            This history is stored in your browser for the prototype (no backend yet), so it will reset if you clear
            site data. Historical records are read-only — a submitted campaign record can't be edited afterward.
          </div>

          <div className="grid grid-2" style={{ marginTop: 16, gridTemplateColumns: "repeat(4, 1fr)" }}>
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`target-option ${tab === t ? "selected" : ""}`}
                onClick={() => setTab(t)}
                style={{ justifyContent: "center", textAlign: "center" }}
              >
                <strong>{t}</strong>
              </button>
            ))}
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            {claims === null && <p className="muted">Loading…</p>}
            {claims !== null && visible.length === 0 && <p className="muted">Nothing here yet.</p>}

            {visible.map(({ claim, campaign }) => {
              const tier = CREATOR_TIERS.find((t) => t.id === claim.tierId)!;
              return (
                <div className="card card-pad" key={campaign.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <span className={statusBadgeClass(claim.status)}>{claim.status}</span>
                      <h3 style={{ margin: "8px 0 2px" }}>{campaign.title}</h3>
                      <p className="muted">{campaign.advertiser} · {campaign.campaignType === "music" ? "Music" : "Business"} · {tier.name}</p>
                      <p className="muted">📍 {campaign.targetScope === "city" ? `${campaign.targetCity}, ${campaign.targetState}` : "All Nigeria"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: 20 }}>₦{tier.ratePerCreator.toLocaleString()}</strong>
                      <p className="muted">reward</p>
                    </div>
                  </div>

                  <div className="grid grid-3" style={{ marginTop: 14 }}>
                    <div><span className="muted" style={{ fontSize: 12 }}>DATE CLAIMED</span><strong style={{ display: "block" }}>{formatDate(claim.claimedAt)}</strong></div>
                    <div><span className="muted" style={{ fontSize: 12 }}>DATE SUBMITTED</span><strong style={{ display: "block" }}>{formatDate(claim.submittedAt)}</strong></div>
                    <div><span className="muted" style={{ fontSize: 12 }}>PAYMENT STATUS</span><strong style={{ display: "block" }}>{claim.status === "APPROVED" ? "Credited" : "Pending"}</strong></div>
                  </div>

                  {claim.submittedUrl && (
                    <a className="btn secondary" href={claim.submittedUrl} target="_blank" rel="noreferrer" style={{ marginTop: 14, display: "inline-block" }}>
                      View submitted content ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
