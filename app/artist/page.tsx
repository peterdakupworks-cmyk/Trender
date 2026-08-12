import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { campaigns, totalCreatorsRequested } from "../../lib/mock";

export default function ArtistDashboard() {
  const active = campaigns.filter((c) => c.status === "LIVE" || c.status === "IN PROGRESS" || c.status === "SUBMISSION/REVIEW");

  return (
    <>
      <AppNav role="artist" />
      <main className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1>Artist Dashboard</h1>
              <p className="muted">Manage your campaigns and creator promotion budget.</p>
            </div>
            <Link className="btn" href="/artist/campaigns/new">Create Campaign</Link>
          </div>

          <div className="grid grid-3">
            <div className="card stat"><small>Wallet</small><strong>₦300,000</strong></div>
            <div className="card stat"><small>Active campaigns</small><strong>{active.length}</strong></div>
            <div className="card stat"><small>Completed</small><strong>7</strong></div>
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
                      {totalCreatorsRequested(c)} creator spots · {c.targetScope === "city" ? c.targetCity : "Nigeria"} · {c.campaignType === "music" ? "Music" : "Business"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link className="btn secondary" href={`/artist/campaigns/${c.id}`}>Progress</Link>
                    <Link className="btn secondary" href="/artist/analytics">Analytics</Link>
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
