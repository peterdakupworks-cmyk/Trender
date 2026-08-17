"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "../../components/AppNav";
import { campaigns, creatorStats, creatorWallet, tierSummaryLabel, rewardLabel, CREATOR_TIERS } from "../../lib/mock";
import { getAllClaims } from "../../lib/claims";

export default function CreatorHome() {
  const [completed, setCompleted] = useState<number | null>(null);
  const [totalEarned, setTotalEarned] = useState<number | null>(null);

  useEffect(() => {
    const claims = getAllClaims();
    const approved = claims.filter((c) => c.status === "APPROVED");
    setCompleted(approved.length);
    setTotalEarned(approved.reduce((sum, c) => sum + CREATOR_TIERS.find((t) => t.id === c.tierId)!.ratePerCreator, 0));
  }, []);

  // Prototype has no backend yet — if this browser has no claim history, fall back to demo stats rather than showing 0.
  const showingDemoFallback = completed === 0;
  const completedDisplay = completed === null ? "…" : completed === 0 ? creatorStats.completed : completed;
  const totalEarnedDisplay = totalEarned === null ? "…" : completed === 0 ? creatorStats.totalEarned : totalEarned;

  return (
    <>
      <AppNav role="creator" />
      <main className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1>Good evening, Creator 👋</h1>
              <p className="muted">Here are campaigns you can work on today.</p>
            </div>
            <span className="badge">Pro Creator</span>
          </div>

          <div className="grid grid-3">
            <div className="card stat"><small>Available earnings</small><strong>₦{creatorWallet.availableEarnings.toLocaleString()}</strong></div>
            <div className="card stat"><small>Pending earnings</small><strong>₦{creatorWallet.pendingEarnings.toLocaleString()}</strong></div>
            <div className="card stat"><small>Trender Score</small><strong>{creatorStats.score}/100</strong></div>
            <div className="card stat"><small>Campaigns completed</small><strong>{completedDisplay}</strong></div>
            <div className="card stat"><small>Total earned</small><strong>₦{Number(totalEarnedDisplay).toLocaleString()}</strong></div>
            <Link className="card stat" href="/creator/campaigns/history"><small>My Campaigns</small><strong>View history →</strong></Link>
          </div>
          {showingDemoFallback && (
            <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              🧪 Showing prototype demo figures until you've completed a campaign in this browser session.
            </p>
          )}

          <div style={{ marginTop: 28 }}>
            <div className="page-head">
              <div>
                <h2>Recommended campaigns</h2>
                <p className="muted">Based on your profile and location.</p>
              </div>
              <Link className="btn secondary" href="/creator/campaigns">View all</Link>
            </div>
            <div className="grid">
              {campaigns.slice(0, 2).map((c) => (
                <Link className="card campaign" href={`/creator/campaigns/${c.id}`} key={c.id}>
                  <div>
                    <span className="badge purple">{tierSummaryLabel(c.creatorMix)}</span>
                    <span className="badge" style={{ marginLeft: 8 }}>{c.campaignType === "music" ? "🎵 Music" : "🏢 Business"}</span>
                    <h3 style={{ margin: "10px 0 5px" }}>{c.title}</h3>
                    <p className="muted">{c.advertiser} · {c.location} · {c.category}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: 22 }}>{rewardLabel(c)}</strong>
                    <p className="muted">reward</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
