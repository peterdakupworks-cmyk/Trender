"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppNav } from "../../../../components/AppNav";
import { campaigns } from "../../../../lib/mock";
import { Claim, getClaim, remainingMs, formatCountdown } from "../../../../lib/claims";

export default function SpotifyStep({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const c = campaigns.find((x) => x.id === id) ?? campaigns[0];

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

  if (claim === undefined) {
    return (
      <>
        <AppNav role="creator" />
        <main className="center"><p className="muted">Checking your claim status…</p></main>
      </>
    );
  }

  if (!claim || claim.status !== "CLAIMED") {
    return (
      <>
        <AppNav role="creator" />
        <main className="center">
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <h1>Claim this task first</h1>
            <p className="muted">You need to claim this campaign before you can start creating content.</p>
            <Link className="btn" href={`/creator/campaigns/${c.id}`}>Go to campaign details</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav role="creator" />
      <main className="center">
        <div style={{ width: "min(640px,100%)" }}>
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <span className="badge">STEP 1 OF 2</span>
            <h1>Listen to the song</h1>
            <p className="muted">Open Spotify, listen to <strong>{c.title}</strong>, understand the song and then return here to create your content.</p>
            <a className="btn mint" href={c.spotify} target="_blank" rel="noreferrer">Open Spotify ↗</a>
            <div className="notice" style={{ marginTop: 16 }}>⏱️ Time remaining to submit: <strong>{countdown || "…"}</strong></div>
            <div style={{ height: 10 }} />
            <Link className="btn" href={`/creator/submit/${c.id}`}>I listened — continue</Link>
          </div>
        </div>
      </main>
    </>
  );
}
