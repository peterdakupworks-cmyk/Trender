import Link from "next/link";
import { AppNav } from "../../../components/AppNav";
import { campaignsForAdvertiserType, totalCreatorsRequested } from "../../../lib/mock";

const ACTIVE_STATUSES = new Set(["LIVE", "IN PROGRESS", "SUBMISSION/REVIEW"]);
const PAST_STATUSES = new Set(["COMPLETED", "CLOSED"]);

export default function BusinessAnalyticsPage() {
  const businessCampaigns = campaignsForAdvertiserType("business");
  const activeCampaigns = businessCampaigns.filter((campaign) => ACTIVE_STATUSES.has(campaign.status));
  const pastCampaigns = businessCampaigns.filter((campaign) => PAST_STATUSES.has(campaign.status));

  const totalCampaigns = businessCampaigns.length;
  const activeCount = activeCampaigns.length;
  const completedCount = pastCampaigns.length;
  const totalCreatorsRequestedCount = businessCampaigns.reduce((sum, campaign) => sum + totalCreatorsRequested(campaign), 0);
  const totalCreatorsJoined = businessCampaigns.reduce((sum, campaign) => sum + campaign.joined, 0);
  const totalContentSubmitted = businessCampaigns.reduce((sum, campaign) => sum + campaign.demoProgress.submitted, 0);

  return (
    <>
      <AppNav role="business" />
      <main className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1>Business Analytics</h1>
              <p className="muted">Performance overview across your Business / Brand campaigns.</p>
            </div>
            <Link className="btn" href="/business">Back to campaigns</Link>
          </div>

          <section style={{ marginBottom: 28 }}>
            <h2>Analytics Overview</h2>
            <div className="grid grid-3">
              <div className="card stat">
                <small>Total campaigns</small>
                <strong>{totalCampaigns}</strong>
              </div>
              <div className="card stat">
                <small>Active campaigns</small>
                <strong>{activeCount}</strong>
              </div>
              <div className="card stat">
                <small>Completed campaigns</small>
                <strong>{completedCount}</strong>
              </div>
              <div className="card stat">
                <small>Total creators requested</small>
                <strong>{totalCreatorsRequestedCount}</strong>
              </div>
              <div className="card stat">
                <small>Total creators joined</small>
                <strong>{totalCreatorsJoined}</strong>
              </div>
              <div className="card stat">
                <small>Total content submitted</small>
                <strong>{totalContentSubmitted}</strong>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 28 }}>
            <h2>Active Campaigns</h2>
            {activeCampaigns.length === 0 ? (
              <div className="card card-pad">
                <p className="muted">No active Business campaigns right now.</p>
              </div>
            ) : (
              <div className="grid">
                {activeCampaigns.map((campaign) => (
                  <div className="card card-pad" key={campaign.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <span className="badge purple">{campaign.status}</span>
                        <h3 style={{ margin: "10px 0 4px" }}>{campaign.advertiser}</h3>
                        <p className="muted" style={{ margin: 0 }}>{campaign.title}</p>
                      </div>
                      <span className="badge">{campaign.campaignType === "business" ? "Business / Brand" : "Music"}</span>
                    </div>

                    <div className="grid grid-3" style={{ marginTop: 16 }}>
                      <div className="card stat">
                        <small>Creator spots requested</small>
                        <strong>{totalCreatorsRequested(campaign)}</strong>
                      </div>
                      <div className="card stat">
                        <small>Creators joined</small>
                        <strong>{campaign.joined}</strong>
                      </div>
                      <div className="card stat">
                        <small>Remaining</small>
                        <strong>{campaign.remaining}</strong>
                      </div>
                    </div>

                    <div className="distribution-preview" style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Budget</span>
                        <strong>₦{campaign.budget.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span>Location</span>
                        <strong>{campaign.location}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span>Progress</span>
                        <strong>{campaign.demoProgress.claimed} claimed / {totalCreatorsRequested(campaign)} requested</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2>Past Campaigns</h2>
            {pastCampaigns.length === 0 ? (
              <div className="card card-pad">
                <p className="muted">No completed or closed Business campaigns yet.</p>
              </div>
            ) : (
              <div className="grid">
                {pastCampaigns.map((campaign) => (
                  <div className="card card-pad" key={campaign.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <span className="badge warning">{campaign.status}</span>
                        <h3 style={{ margin: "10px 0 4px" }}>{campaign.advertiser}</h3>
                        <p className="muted" style={{ margin: 0 }}>{campaign.title}</p>
                      </div>
                      <span className="badge">Business / Brand</span>
                    </div>

                    <div className="grid grid-3" style={{ marginTop: 16 }}>
                      <div className="card stat">
                        <small>Budget</small>
                        <strong>₦{campaign.budget.toLocaleString()}</strong>
                      </div>
                      <div className="card stat">
                        <small>Creators requested</small>
                        <strong>{totalCreatorsRequested(campaign)}</strong>
                      </div>
                      <div className="card stat">
                        <small>Creators joined</small>
                        <strong>{campaign.joined}</strong>
                      </div>
                    </div>

                    <div className="distribution-preview" style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Content submitted</span>
                        <strong>{campaign.demoProgress.submitted}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span>Approved</span>
                        <strong>{campaign.demoProgress.approved}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span>Location</span>
                        <strong>{campaign.location}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span>Dates</span>
                        <strong>Not available in current mock data</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
