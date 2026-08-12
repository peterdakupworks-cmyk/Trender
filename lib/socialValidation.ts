const PATTERNS: Record<"instagram" | "tiktok", RegExp> = {
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?$/,
  tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._]{1,30}\/?$/,
};

/** Accepts a full profile URL or a bare @handle and normalizes it to a full URL for storage. */
export function normalizeSocialInput(platform: "instagram" | "tiktok", raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  return platform === "instagram" ? `https://instagram.com/${handle}` : `https://tiktok.com/@${handle}`;
}

/** Looks-valid check only — NOT verification. A valid-looking URL doesn't mean the account is confirmed to exist or belong to this person. */
export function isValidSocialUrl(platform: "instagram" | "tiktok", raw: string): boolean {
  const url = normalizeSocialInput(platform, raw);
  if (!url) return false;
  return PATTERNS[platform].test(url);
}
