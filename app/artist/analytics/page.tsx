import { AppNav } from "../../../components/AppNav";

export default function Analytics() {
  return <><AppNav role="artist"/><main className="page"><div className="container"><div className="page-head"><div><h1>Campaign Analytics</h1><p className="muted">Early dashboard structure for campaign performance.</p></div></div>
    <div className="grid grid-3"><div className="card stat"><small>Creators joined</small><strong>162</strong></div><div className="card stat"><small>Approved submissions</small><strong>91</strong></div><div className="card stat"><small>Completed videos</small><strong>74</strong></div></div>
    <div className="card card-pad" style={{marginTop:20}}><h2>Top creators</h2><div className="grid"><p>1. Creator A — 42,000 views</p><p>2. Creator B — 31,500 views</p><p>3. Creator C — 22,100 views</p></div></div>
  </div></main></>;
}
