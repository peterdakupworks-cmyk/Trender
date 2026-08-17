import { AppNav } from "../../../components/AppNav";
import { creatorStats } from "../../../lib/mock";

export default function Career() {
  const stats = [["Tier",creatorStats.tier],["Trender Score",`${creatorStats.score}/100`],["National rank",`#${creatorStats.rank}`],["Completed campaigns",creatorStats.completed],["Approval rate",`${creatorStats.approval}%`],["Average views",creatorStats.avgViews.toLocaleString()],["Total earnings",`₦${creatorStats.totalEarned.toLocaleString()}`]];
  return <><AppNav role="creator"/><main className="page"><div className="container"><div className="page-head"><div><h1>Creator Career</h1><p className="muted">Your progress, reputation and earnings.</p></div><span className="badge">Keep creating</span></div><div className="grid grid-3">{stats.map(([a,b])=><div className="card stat" key={a}><small>{a}</small><strong>{b}</strong></div>)}</div></div></main></>;
}
