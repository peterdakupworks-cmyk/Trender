"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppNav } from "../../../../components/AppNav";
import { campaigns } from "../../../../lib/mock";
import { Claim, getClaim, remainingMs, formatCountdown } from "../../../../lib/claims";

export default function AssetsStep({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const c = campaigns.find((x) => x.id === id) ?? campaigns[0];
  const assets = c.assets ?? {};
  const hasAssets = assets.imageUrl || assets.videoUrl;

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
            <h1>Review campaign assets</h1>
            <p className="muted">
              Get familiar with <strong>{c.advertiser}</strong> before you create your content. There's no song to listen to for business campaigns — use these assets instead.
            </p>

            {c.offer && (
              <div className="notice" style={{ textAlign: "left", marginTop: 16 }}>
                🎁 <strong>Offer:</strong> {c.offer}
              </div>
            )}

            <div className="grid" style={{ marginTop: 16, textAlign: "left" }}>
              {assets.imageUrl && (
                <div className="card stat">
                  <small>Promotional image</small>
                  <a className="btn secondary" href={assets.imageUrl} target="_blank" rel="noreferrer" style={{ marginTop: 8, display: "inline-block" }}>
                    Open image ↗
                  </a>
                </div>
              )}
              {assets.videoUrl && (
                <div className="card stat">
                  <small>Promotional video{assets.videoDurationSeconds ? ` · ${assets.videoDurationSeconds}s` : ""}</small>
                  <a className="btn secondary" href={assets.videoUrl} target="_blank" rel="noreferrer" style={{ marginTop: 8, display: "inline-block" }}>
                    Open video ↗
                  </a>
                </div>
              )}
              {!hasAssets && <p className="muted">No promotional assets were provided for this campaign. Refer to the requirements on the campaign details page.</p>}
            </div>

            <div className="notice" style={{ marginTop: 16 }}>⏱️ Time remaining to submit: <strong>{countdown || "…"}</strong></div>
            <div style={{ height: 10 }} />
            <Link className="btn" href={`/creator/submit/${c.id}`}>
              I've reviewed the assets — continue
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
