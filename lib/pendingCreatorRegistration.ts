const KEY = "trender_pending_creator_registration_v1";

export type PendingCreatorRegistration = {
  fullName: string;
  username: string;
  phone: string;
  state: string;
  city: string;
  instagramUrl: string;
  tiktokUrl: string;
  submittedFollowerCount: number;
};

export function savePendingCreatorRegistration(data: PendingCreatorRegistration) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function getPendingCreatorRegistration(): PendingCreatorRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingCreatorRegistration) : null;
  } catch {
    return null;
  }
}

export function clearPendingCreatorRegistration() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
