import { CreatorTierId } from "./mock";

export const CLAIM_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

export type ClaimStatus = "CLAIMED" | "SUBMITTED" | "APPROVED" | "REJECTED" | "EXPIRED";

export type Claim = {
  campaignId: string;
  tierId: CreatorTierId;
  status: ClaimStatus;
  claimedAt: number; // epoch ms
  deadline: number; // epoch ms = claimedAt + 48h
  submittedAt?: number;
  submittedPlatform?: string;
  submittedUrl?: string;
};

const STORAGE_KEY = "trender_demo_claims_v1";

function readAll(): Record<string, Claim> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Claim>) : {};
  } catch {
    return {};
  }
}

function writeAll(claims: Record<string, Claim>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

/** Lazily flips an overdue CLAIMED task to EXPIRED, persists it, and returns the up-to-date claim. */
function withLazyExpiry(claim: Claim | undefined): Claim | null {
  if (!claim) return null;
  if (claim.status === "CLAIMED" && Date.now() > claim.deadline) {
    const expired: Claim = { ...claim, status: "EXPIRED" };
    const all = readAll();
    all[claim.campaignId] = expired;
    writeAll(all);
    return expired;
  }
  return claim;
}

export function getClaim(campaignId: string): Claim | null {
  const all = readAll();
  return withLazyExpiry(all[campaignId]);
}

/** Creates a new 48-hour claim for this campaign. No-ops if an active (non-expired/rejected) claim already exists. */
export function claimTask(campaignId: string, tierId: CreatorTierId): Claim {
  const all = readAll();
  const existing = withLazyExpiry(all[campaignId]);
  if (existing && existing.status !== "EXPIRED" && existing.status !== "REJECTED") {
    return existing;
  }
  const now = Date.now();
  const claim: Claim = { campaignId, tierId, status: "CLAIMED", claimedAt: now, deadline: now + CLAIM_WINDOW_MS };
  all[campaignId] = claim;
  writeAll(all);
  return claim;
}

/** Marks a claimed (non-expired) task as SUBMITTED, storing the submitted content link. Returns null if there's nothing valid to submit. */
export function submitClaim(campaignId: string, content: { platform: string; url: string }): Claim | null {
  const all = readAll();
  const existing = withLazyExpiry(all[campaignId]);
  if (!existing || existing.status !== "CLAIMED") return null;
  const submitted: Claim = {
    ...existing,
    status: "SUBMITTED",
    submittedAt: Date.now(),
    submittedPlatform: content.platform,
    submittedUrl: content.url,
  };
  all[campaignId] = submitted;
  writeAll(all);
  return submitted;
}

/** All claims for the current demo creator, newest first — powers the Campaign History / My Campaigns screen. */
export function getAllClaims(): Claim[] {
  const all = readAll();
  return Object.values(all)
    .map((c) => withLazyExpiry(c)!)
    .sort((a, b) => b.claimedAt - a.claimedAt);
}

/** Testing-only helper (simulates an admin review decision) — see the QA panel on the submission status page. */
export function setClaimStatus(campaignId: string, status: ClaimStatus): Claim | null {
  const all = readAll();
  const existing = all[campaignId];
  if (!existing) return null;
  const updated: Claim = { ...existing, status };
  all[campaignId] = updated;
  writeAll(all);
  return updated;
}

/** Testing-only helper — force an active claim's deadline into the past so EXPIRED can be demonstrated without waiting 48 real hours. */
export function forceExpireClaim(campaignId: string): Claim | null {
  const all = readAll();
  const existing = all[campaignId];
  if (!existing) return null;
  const expired: Claim = { ...existing, deadline: Date.now() - 1000, status: "EXPIRED" };
  all[campaignId] = expired;
  writeAll(all);
  return expired;
}

export function clearClaim(campaignId: string) {
  const all = readAll();
  delete all[campaignId];
  writeAll(all);
}

export function remainingMs(claim: Claim): number {
  return Math.max(0, claim.deadline - Date.now());
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
