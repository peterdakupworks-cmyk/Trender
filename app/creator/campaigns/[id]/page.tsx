"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppNav } from "../../../../components/AppNav";
import { campaigns, CREATOR_TIERS, rewardLabel, CURRENT_CREATOR_TIER_ID } from "../../../../lib/mock";
import { Claim, claimTask, getClaim, forceExpireClaim, remainingMs, formatCountdown } from "../../../../lib/claims";

function statusBadgeClass(status: Claim["status"]) {
  if (status === "APPROVED") return "badge";
  if (status === "SUBMITTED") return "badge warning";
  if (status === "REJECTED" || status === "EXPIRED") return "badge danger";
  return "badge purple"; // CLAIMED
}

export default function CampaignDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const c = campaigns.find((x) => x.id === id) ?? campaigns[0];
  const isMusic = c.campaignType === "music";
  const nextStepHref = isMusic ? `/creator/spotify/${c.id}` : `/creator/assets/${c.id}`;

  const [claim, setClaim] = useState<Claim | null | undefined>(undefined);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    setClaim(getClaim(c.id));
  }, [c.id]);

  useEffect(() => {
    if (!claim || claim.status !== "CLAIMED") return;
    const tick = () => setCountdown(formatCountdown(remainingMs(claim)));
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [claim]);

  const eligibleTier = c.creatorMix.some((m) => m.tierId === CURRENT_CREATOR_TIER_ID) ? CURRENT_CREATOR_TIER_ID : c.creatorMix[0]?.tierId;
  const hasSlots = c.remaining > 0;

  function handleClaim() {
    if (!eligibleTier) return;
    const newClaim = claimTask(c.id, eligibleTier);
    setClaim(newClaim);
  }

  function handleForceExpire() {
    const updated = forceExpireClaim(c.id);
    setClaim(updated);
  }

  return (
    <>
      <AppNav role="creator" />
      <main className="page">
        <div className="container">
          <Link href="/creator/campaigns" className="muted">← Back to campaigns</Link>
          <div className="card card-pad" style={{ marginTop: 18 }}>
            <span className="badge purple">{isMusic ? "🎵 Music campaign" : "🏢 Business campaign"}</span>
            <span className="badge" style={{ marginLeft: 8 }}>{c.status}</span>
            <h1>{c.title}</h1>
            <p className="muted">{c.advertiser} · {c.category}</p>

            <div className="notice" style={{ marginTop: 14 }}>
              📍 <strong>Target:</strong> {c.targetScope === "city" ? `Creators in ${c.targetCity}, ${c.targetState}` : "Eligible creators across Nigeria"}
            </div>

            {!isMusic && c.offer && (
              <div className="notice" style={{ marginTop: 14 }}>🎁 <strong>Offer:</strong> {c.offer}</div>
            )}

            <div className="grid grid-3" style={{ margin: "24px 0" }}>
              <div className="card stat"><small>Reward</small><strong>{rewardLabel(c)}</strong></div>
              <div className="card stat"><small>Joined</small><strong>{c.joined}</strong></div>
              <div className="card stat"><small>Remaining</small><strong>{c.remaining}</strong></div>
            </div>

            <h3>Creator mix for this campaign</h3>
            <div className="grid">
              {c.creatorMix.map((m) => {
                const tier = CREATOR_TIERS.find((t) => t.id === m.tierId)!;
                return (
                  <div className="campaign" key={m.tierId}>
                    <div>
                      <strong>{tier.name}</strong>
                      <p className="muted">{tier.followerRange}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>{m.count} creators</strong>
                      <p className="muted">₦{tier.ratePerCreator.toLocaleString()} each</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <h3>Requirements</h3>
            <p className="muted" style={{ lineHeight: 1.7 }}>{c.requirements}</p>

            <div className="notice" style={{ margin: "16px 0" }}>
              ⏱️ Creators have <strong>48 hours</strong> after claiming this campaign to create and submit their content.
            </div>

            {/* ---- Claim / status area ---- */}
            {claim === undefined && <p className="muted">Checking your claim status…</p>}

            {claim === null && (
              hasSlots ? (
                <button className="btn" type="button" onClick={handleClaim}>
                  Claim this task
                </button>
              ) : (
                <div className="warning-box">No slots remaining for this campaign right now.</div>
              )
            )}

            {claim && claim.status === "CLAIMED" && (
              <div className="distribution-preview">
                <span>TIME REMAINING</span>
                <strong style={{ display: "block", fontSize: 28, marginTop: 6 }}>{countdown || "…"}</strong>
                <div className="form-actions" style={{ marginTop: 14 }}>
                  <Link className="btn" href={nextStepHref}>
                    {isMusic ? "Listen on Spotify & continue" : "Review campaign assets & continue"}
                  </Link>
                </div>
              </div>
            )}

            {claim && claim.status === "EXPIRED" && (
              <div className="warning-box">
                This task <strong>expired</strong> — you claimed it but didn't submit within 48 hours, so it can no
                longer be submitted. An administrator would need to reopen it. The slot is now available to other
                eligible creators.
              </div>
            )}

            {claim && (claim.status === "SUBMITTED" || claim.status === "APPROVED" || claim.status === "REJECTED") && (
              <div className="notice">
                Task status: <span className={statusBadgeClass(claim.status)}>{claim.status}</span>{" "}
                <Link href={`/creator/submission/${c.id}`} className="muted">View submission status →</Link>
              </div>
            )}

            {claim && claim.status === "CLAIMED" && (
              <div className="card card-pad" style={{ marginTop: 20, borderStyle: "dashed" }}>
                <span className="eyebrow">🧪 TESTING CONTROLS — prototype QA only, remove before production</span>
                <p className="muted" style={{ marginTop: 6 }}>
                  Waiting 48 real hours isn't practical for testing. Use this to simulate a missed deadline.
                </p>
                <button className="btn secondary" type="button" onClick={handleForceExpire} style={{ marginTop: 10 }}>
                  Simulate: force this task to EXPIRE
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
