"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppNav } from "../../../../components/AppNav";
import { campaigns, rewardLabel } from "../../../../lib/mock";
import { Claim, getClaim, setClaimStatus, ClaimStatus } from "../../../../lib/claims";

function statusBadgeClass(status: Claim["status"]) {
  if (status === "APPROVED") return "badge";
  if (status === "SUBMITTED") return "badge warning";
  if (status === "REJECTED" || status === "EXPIRED") return "badge danger";
  return "badge purple";
}

const STATUS_COPY: Record<ClaimStatus, string> = {
  CLAIMED: "You've claimed this task but haven't submitted yet.",
  SUBMITTED: "Your content is in the human review queue. No AI verification is used in this MVP.",
  APPROVED: "Your submission was approved. The reward has been added to your wallet.",
  REJECTED: "Your submission was rejected. Check the campaign requirements and any admin notes.",
  EXPIRED: "This task expired before you submitted, so it can no longer be actioned.",
};

export default function SubmissionStatus({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const c = campaigns.find((x) => x.id === id) ?? campaigns[0];
  const [claim, setClaim] = useState<Claim | null | undefined>(undefined);

  useEffect(() => {
    setClaim(getClaim(c.id));
  }, [c.id]);

  function simulate(status: ClaimStatus) {
    const updated = setClaimStatus(c.id, status);
    setClaim(updated);
  }

  return (
    <>
      <AppNav role="creator" />
      <main className="page">
        <div className="container">
          <Link href="/creator/campaigns" className="muted">← Back to campaigns</Link>
          <div className="card card-pad" style={{ marginTop: 18 }}>
            <h1>Submission status</h1>
            <p className="muted">{c.title} · {c.advertiser} · reward {rewardLabel(c)}</p>

            {claim === undefined && <p className="muted">Checking status…</p>}

            {claim === null && (
              <div className="warning-box">You haven't claimed or submitted this task yet.</div>
            )}

            {claim && (
              <>
                <div style={{ margin: "16px 0" }}>
                  <span className={statusBadgeClass(claim.status)} style={{ fontSize: 14 }}>{claim.status}</span>
                </div>
                <p className="muted">{STATUS_COPY[claim.status]}</p>

                {claim.status === "APPROVED" && (
                  <div className="notice">✅ Reward: {rewardLabel(c)} — reflected in your wallet's pending/available earnings.</div>
                )}
              </>
            )}

            {claim && claim.status === "SUBMITTED" && (
              <div className="card card-pad" style={{ marginTop: 20, borderStyle: "dashed" }}>
                <span className="eyebrow">🧪 TESTING CONTROLS — prototype QA only, remove before production</span>
                <p className="muted" style={{ marginTop: 6 }}>
                  There's no admin review backend yet — use these to simulate a reviewer's decision.
                </p>
                <div className="form-actions" style={{ marginTop: 10 }}>
                  <button className="btn" type="button" onClick={() => simulate("APPROVED")}>Simulate: Approve</button>
                  <button className="btn secondary" type="button" onClick={() => simulate("REJECTED")}>Simulate: Reject</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
