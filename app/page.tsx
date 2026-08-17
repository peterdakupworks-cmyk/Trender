import Link from "next/link";
import { Brand } from "../components/Brand";

export default function Home() {
  return (
    <main className="shell">
      <div className="container">
        <section className="hero">
          <Brand />
          <h1>Connect. <span>Create.</span> Earn.</h1>
          <p>Trender connects artists and brands with creators who can turn campaigns into authentic content and measurable results.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            <Link className="btn" href="/onboarding">Get started</Link>
            <Link className="btn secondary" href="/choose-role">Explore Trender</Link>
          </div>
        </section>

        <section className="grid grid-3" style={{paddingBottom:70}}>
          <div className="card card-pad"><h3>For creators</h3><p className="muted">Discover paid campaigns that fit your niche and build your creator career.</p></div>
          <div className="card card-pad"><h3>For artists</h3><p className="muted">Reach the right creators without needing celebrity-level influencer budgets.</p></div>
          <div className="card card-pad"><h3>Transparent rewards</h3><p className="muted">Track tasks, pending earnings and completed campaign history in one place.</p></div>
        </section>
      </div>
    </main>
  );
}
