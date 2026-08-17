"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AppNav } from "../../../../components/AppNav";
import { campaigns } from "../../../../lib/mock";
import { Claim, getClaim, submitClaim } from "../../../../lib/claims";

export default function Submit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const c = campaigns.find((x) => x.id === id) ?? campaigns[0];
  const router = useRouter();

  const [claim, setClaim] = useState<Claim | null | undefined>(undefined);
  const [platform, setPlatform] = useState("TikTok");
  const [postUrl, setPostUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setClaim(getClaim(c.id));
  }, [c.id]);

  function handleSubmit() {
    if (!postUrl.trim()) {
      setError("Paste the public link to your post before submitting.");
      return;
    }
    const updated = submitClaim(c.id, { platform, url: postUrl.trim() });
    if (!updated) {
      setError("This task has expired or was never claimed, so it can no longer be submitted.");
      setClaim(getClaim(c.id));
      return;
    }
    setError("");
    router.push(`/creator/submission/${c.id}`);
  }

  if (claim === undefined) {
    return (
      <>
        <AppNav role="creator" />
        <main className="center"><p className="muted">Checking your claim status…</p></main>
      </>
    );
  }

  if (!claim || claim.status === "EXPIRED") {
    return (
      <>
        <AppNav role="creator" />
        <main className="center">
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <h1>{!claim ? "Claim this task first" : "This task expired"}</h1>
            <p className="muted">
              {!claim
                ? "You need to claim this campaign before you can submit content."
                : "You didn't submit within the 48-hour window, so this task can no longer be submitted. An administrator would need to reopen it."}
            </p>
            <Link className="btn" href={`/creator/campaigns/${c.id}`}>Back to campaign</Link>
          </div>
        </main>
      </>
    );
  }

  if (claim.status !== "CLAIMED") {
    return (
      <>
        <AppNav role="creator" />
        <main className="center">
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <h1>Already submitted</h1>
            <p className="muted">This task's current status is {claim.status}.</p>
            <Link className="btn" href={`/creator/submission/${c.id}`}>View submission status</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav role="creator" />
      <main className="center">
        <div className="form">
          <div className="card card-pad">
            <span className="badge">STEP 2 OF 2</span>
            <h1>Submit your content</h1>
            <p className="muted">
              {c.title} · reward ₦{c.reward.toLocaleString()}
            </p>

            <div className="field">
              <label>Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option>TikTok</option>
                <option>Instagram</option>
              </select>
            </div>

            <div className="field">
              <label>Public post URL</label>
              <input
                placeholder="https://www.tiktok.com/@you/video/..."
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
              />
              {error && <span className="field-error">{error}</span>}
            </div>

            <div className="field">
              <label>Optional note</label>
              <textarea
                placeholder="Tell the artist anything useful about your post."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="notice">
              AI verification is not active in this MVP. Your submission will enter a human/admin review queue.
            </div>

            <div className="form-actions">
              <button className="btn" type="button" onClick={handleSubmit}>
                Submit for review
              </button>
              <Link className="btn secondary" href="/creator/campaigns">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
