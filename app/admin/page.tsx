import { AppNav } from "../../components/AppNav";

export default function Admin() {
  return <><AppNav role="admin"/><main className="page"><div className="container"><div className="page-head"><div><h1>Admin Dashboard</h1><p className="muted">Operations control center for the Trender MVP.</p></div></div>
    <div className="grid grid-3"><div className="card stat"><small>Users</small><strong>1,248</strong></div><div className="card stat"><small>Campaign revenue</small><strong>₦2.4m</strong></div><div className="card stat"><small>Pending reviews</small><strong>37</strong></div></div>
    <div className="grid grid-2" style={{marginTop:20}}><div className="card card-pad"><h2>Manual review queue</h2><p className="muted">Human review only. AI verification is not active.</p><button className="btn">Open submissions</button></div><div className="card card-pad"><h2>Withdrawals</h2><p className="muted">Review creator withdrawal requests before automated payouts are enabled.</p><button className="btn secondary">Open withdrawals</button></div></div>
  </div></main></>;
}
