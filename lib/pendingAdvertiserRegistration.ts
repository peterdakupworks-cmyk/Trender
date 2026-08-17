const KEY = "trender_pending_advertiser_registration_v1";

export type PendingAdvertiserRegistration = {
  accountType: "music" | "business";
  name: string;
  state: string;
  city: string;
  category: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  contact: string;
  genre: string;
  spotifyUrl: string;
};

export function savePendingAdvertiserRegistration(data: PendingAdvertiserRegistration) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function getPendingAdvertiserRegistration(): PendingAdvertiserRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingAdvertiserRegistration) : null;
  } catch {
    return null;
  }
}

export function clearPendingAdvertiserRegistration() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
