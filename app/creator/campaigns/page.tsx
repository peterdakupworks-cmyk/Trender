"use client";

import Link from "next/link";
import { AppNav } from "../../../components/AppNav";
import { campaigns, tierSummaryLabel, rewardLabel } from "../../../lib/mock";

const creatorLocation = { city: "Abuja", state: "FCT" };

function eligible(c: typeof campaigns[number]) {
  if (c.targetScope === "nigeria") return true;
  return c.targetCity === creatorLocation.city && c.targetState === creatorLocation.state;
}

export default function Campaigns() {
  const eligibleCampaigns = campaigns.filter(eligible);
  return <><AppNav role="creator"/><main className="page"><div className="container">
    <div className="page-head"><div><h1>Campaigns</h1><p className="muted">Showing tasks available for <strong>{creatorLocation.city}, {creatorLocation.state}</strong>.</p></div><span className="badge">{eligibleCampaigns.length} available</span></div>
    <div className="notice" style={{marginBottom:18}}>📍 <strong>Location targeting is active.</strong> City campaigns are matched to your profile location. Nigeria-wide campaigns are available nationwide.</div>
    <div className="grid">
      {eligibleCampaigns.map(c => <Link className="card campaign" href={`/creator/campaigns/${c.id}`} key={c.id}>
        <div>
          <span className="badge purple">{tierSummaryLabel(c.creatorMix)}</span>
          <span className="badge" style={{marginLeft:8}}>{c.campaignType === "music" ? "🎵 Music" : "🏢 Business"}</span>
          <span className="badge" style={{marginLeft:8}}>{c.targetScope === "city" ? `📍 ${c.location}` : "🇳🇬 Nigeria"}</span>
          <h3 style={{margin:"10px 0 5px"}}>{c.title}</h3>
          <p className="muted">{c.advertiser} · {c.category}</p>
          <p className="muted">{c.remaining} spots remaining</p>
        </div>
        <div style={{textAlign:"right"}}>
          <strong style={{fontSize:24}}>{rewardLabel(c)}</strong>
          <p className="muted">reward</p>
          <span className="btn">View</span>
        </div>
      </Link>)}
    </div>
  </div></main></>;
}
