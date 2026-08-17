"use client";

import { useState } from "react";
import { AppNav } from "../../../components/AppNav";
import {
  creatorWallet,
  payoutHistory as initialPayoutHistory,
  computePayout,
  isWithinPayoutWindow,
  nextPayoutWindowLabel,
  MINIMUM_PAYOUT,
  CREATOR_PAYOUT_FEE_RATE,
  PayoutHistoryEntry,
} from "../../../lib/mock";

type WindowOverride = "auto" | "in" | "out";

function statusClass(status: PayoutHistoryEntry["status"]) {
  if (status === "Paid") return "badge";
  if (status === "Processing") return "badge warning";
  if (status === "Failed") return "badge danger";
  return "badge";
}

export default function Wallet() {
  const now = new Date();

  // ---- Testing controls state (prototype QA only) ----
  const [windowOverride, setWindowOverride] = useState<WindowOverride>("auto");
  const [balanceOverride, setBalanceOverride] = useState<number | null>(null);

  const [history, setHistory] = useState<PayoutHistoryEntry[]>(initialPayoutHistory);
  const [confirming, setConfirming] = useState(false);
  const [justPaid, setJustPaid] = useState<PayoutHistoryEntry | null>(null);

  const inWindow = windowOverride === "auto" ? isWithinPayoutWindow(now) : windowOverride === "in";
  const available = balanceOverride ?? creatorWallet.availableEarnings;
  const meetsMinimum = available >= MINIMUM_PAYOUT;
  const canRequestPayout = inWindow && meetsMinimum && available > 0;
  const { fee, netPayout } = computePayout(available);

  function handleConfirmPayout() {
    const entry: PayoutHistoryEntry = {
      id: `payout-${Date.now()}`,
      label: `${now.toLocaleString(undefined, { month: "long" })} Payout`,
      grossEarnings: available,
      fee,
      amountPaid: netPayout,
      status: "Processing",
      date: now.toLocaleDateString(undefined, { day: "numeric", month: "long" }),
    };
    setHistory((prev) => [entry, ...prev]);
    setJustPaid(entry);
    setConfirming(false);
  }

  return (
    <>
      <AppNav role="creator" />
      <main className="page">
        <div className="container">
          <div className="page-head">
            <div>
              <h1>Wallet</h1>
              <p className="muted">Track your available and pending campaign earnings.</p>
            </div>
          </div>

          <div className="grid grid-3">
            <div className="card stat">
              <small>Available Earnings</small>
              <strong>₦{available.toLocaleString()}</strong>
            </div>
            <div className="card stat">
              <small>Pending Earnings</small>
              <strong>₦{creatorWallet.pendingEarnings.toLocaleString()}</strong>
            </div>
            <div className="card stat">
              <small>Next Payout</small>
              <strong>{inWindow ? "Window is open" : nextPayoutWindowLabel(now)}</strong>
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 20 }}>
            <h2>Payout</h2>
            <p className="muted">
              Trender pays creators once a month, during the 28th–30th payout window. A 7.5% Creator Payout Fee is
              applied only when a payout is processed — never when you earn.
            </p>

            {!inWindow && (
              <div className="notice" style={{ marginTop: 12 }}>
                The payout window is currently closed. Next payout: <strong>{nextPayoutWindowLabel(now)}</strong>.
              </div>
            )}

            {inWindow && !meetsMinimum && (
              <div className="warning-box" style={{ marginTop: 12 }}>
                Minimum payout is ₦5,000. Your balance will roll over to the next payout cycle.
              </div>
            )}

            {canRequestPayout && !confirming && !justPaid && (
              <button className="btn" style={{ marginTop: 12 }} onClick={() => setConfirming(true)}>
                Request Payout
              </button>
            )}

            {confirming && (
              <div className="distribution-preview" style={{ marginTop: 16 }}>
                <span>Payout breakdown</span>
                <div className="grid grid-2" style={{ marginTop: 10 }}>
                  <div>
                    <span className="muted" style={{ fontSize: 12 }}>GROSS PAYOUT</span>
                    <strong style={{ display: "block", fontSize: 20 }}>₦{available.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="muted" style={{ fontSize: 12 }}>
                      CREATOR PAYOUT FEE ({(CREATOR_PAYOUT_FEE_RATE * 100).toFixed(1)}%)
                    </span>
                    <strong style={{ display: "block", fontSize: 20 }}>₦{fee.toLocaleString()}</strong>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="muted" style={{ fontSize: 12 }}>NET PAYOUT</span>
                  <strong style={{ display: "block", fontSize: 24 }}>₦{netPayout.toLocaleString()}</strong>
                </div>
                <div className="form-actions" style={{ marginTop: 14 }}>
                  <button className="btn" onClick={handleConfirmPayout}>Confirm payout</button>
                  <button className="btn secondary" onClick={() => setConfirming(false)}>Cancel</button>
                </div>
              </div>
            )}

            {justPaid && (
              <div className="notice" style={{ marginTop: 14 }} role="status">
                ✅ Payout of ₦{justPaid.amountPaid.toLocaleString()} requested and marked Processing. (Simulated —
                no real transfer happens until Paystack payout processing is connected in a later phase.)
              </div>
            )}
          </div>

          <div className="card card-pad" style={{ marginTop: 20 }}>
            <h2>Payout History</h2>
            <div className="grid" style={{ marginTop: 10 }}>
              {history.map((p) => (
                <div className="campaign" key={p.id}>
                  <div>
                    <strong>{p.label}</strong>
                    <p className="muted">
                      Gross ₦{p.grossEarnings.toLocaleString()} · Fee ₦{p.fee.toLocaleString()} · {p.date}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>₦{p.amountPaid.toLocaleString()}</strong>
                    <p><span className={statusClass(p.status)}>{p.status}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 20, borderStyle: "dashed" }}>
            <span className="eyebrow">🧪 TESTING CONTROLS — prototype QA only, remove before production</span>
            <p className="muted" style={{ marginTop: 6 }}>
              The real app uses today's date and your real balance. Use these controls to preview the payout-window
              and minimum-payout behavior without waiting for the 28th.
            </p>
            <div className="grid grid-2" style={{ marginTop: 12 }}>
              <div className="field">
                <label>Simulate payout window</label>
                <select value={windowOverride} onChange={(e) => setWindowOverride(e.target.value as WindowOverride)}>
                  <option value="auto">Auto (use today's date)</option>
                  <option value="in">Force: inside window (28th–30th)</option>
                  <option value="out">Force: outside window</option>
                </select>
              </div>
              <div className="field">
                <label>Simulate available balance</label>
                <select
                  value={balanceOverride === null ? "default" : String(balanceOverride)}
                  onChange={(e) => setBalanceOverride(e.target.value === "default" ? null : Number(e.target.value))}
                >
                  <option value="default">Default (₦{creatorWallet.availableEarnings.toLocaleString()})</option>
                  <option value="4000">₦4,000 (below minimum)</option>
                  <option value="5000">₦5,000 (exact minimum)</option>
                  <option value="20000">₦20,000</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
