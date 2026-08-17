"use client";

import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { campaigns, totalCreatorsRequested } from "../../lib/mock";
import { useActiveCreatorCount } from "../../lib/supabase/activeCreators";

export default function BusinessDashboard() {
  const active = campaigns.filter((c) => c.status === "LIVE" || c.status === "IN PROGRESS" || c.status === "SUBMISSION/REVIEW");
  const { count, loading, error } = useActiveCreatorCount();

  return (
    <>
      <AppNav role="business" />
      <main className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1>Business / Brand Dashboard</h1>
              <p className="muted">One advertiser account for your business, brand, or artist campaigns.</p>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: 18 }}>
            <div className="card card-pad">
              <span className="badge purple">🎵 ARTIST / MUSIC</span>
              <h2 style={{ marginTop: 10 }}>Promote your music</h2>
              <p className="muted">Create a music campaign, add your Spotify link and artwork, and let eligible creators promote your song.</p>
              <Link className="btn" href="/business/campaigns/new?type=music">Create Artist Campaign</Link>
            </div>

            <div className="card card-pad">
              <span className="badge purple">🏢 BUSINESS / BRAND</span>
              <h2 style={{ marginTop: 10 }}>Promote your business</h2>
              <p className="muted">Upload your artwork and short promotional video, describe your offer, and launch a campaign for eligible creators.</p>
              <Link className="btn" href="/business/campaigns/new?type=business">Create Business Campaign</Link>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginTop: 20 }}>
            <div className="card stat"><small>Wallet</small><strong>₦300,000</strong></div>
            <div className="card stat"><small>Active campaigns</small><strong>{active.length}</strong></div>
            <div className="card stat">
              <small>🟢 {loading ? "..." : error ? "0" : count} Creators Online</small>
              <strong style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: !loading && !error ? "#22c55e" : "#94a3b8", display: "inline-block" }} />
                {loading ? "Loading..." : error ? "0" : count}
              </strong>
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 20 }}>
            <h2>Active campaigns</h2>
            <div className="grid">
              {active.map((c) => (
                <div className="campaign" key={c.id}>
                  <div>
                    <span className="badge">{c.status}</span>
                    <h3>{c.title}</h3>
                    <p className="muted">
                      {totalCreatorsRequested(c)} creator spots · {c.targetScope === "city" ? c.targetCity : "Nigeria"} · {c.campaignType === "music" ? "Artist / Music" : "Business / Brand"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link className="btn secondary" href={`/business/campaigns/${c.id}`}>Progress</Link>
                    <Link className="btn secondary" href="/business/analytics">Analytics</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
