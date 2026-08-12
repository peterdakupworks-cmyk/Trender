// ===================== CREATOR TIERS & PRICING =====================
// These rates are placeholders for the MVP prototype. In Phase 3+, this will
// move to an admin-editable settings table in Supabase so pricing can change
// without a code deploy.
export const CREATOR_TIERS = [
  { id: "starter", name: "Starter", followerRange: "500–1,000 followers", ratePerCreator: 500 },
  { id: "midtier", name: "Mid-tier", followerRange: "1,000–5,000 followers", ratePerCreator: 1000 },
  { id: "pro", name: "Pro", followerRange: "5,000–10,000 followers", ratePerCreator: 1500 },
] as const;

export type CreatorTierId = (typeof CREATOR_TIERS)[number]["id"];

export type CreatorMixItem = { tierId: CreatorTierId; count: number };

// Trender's cut, charged to the ADVERTISER on top of the creator allocation.
// Kept separate from CREATOR_PAYOUT_FEE_RATE below — these are two different fees.
export const PLATFORM_FEE_RATE = 0.075;

export function tierRate(tierId: CreatorTierId) {
  return CREATOR_TIERS.find((t) => t.id === tierId)!.ratePerCreator;
}

export function totalCreatorsInMix(mix: CreatorMixItem[]) {
  return mix.reduce((sum, m) => sum + m.count, 0);
}

export function creatorAllocation(mix: CreatorMixItem[]) {
  return mix.reduce((sum, m) => sum + m.count * tierRate(m.tierId), 0);
}

export type CampaignPricing = {
  creatorAllocation: number;
  platformFee: number;
  totalPayable: number;
};

/** Creator Allocation → 7.5% Platform Fee → Total Amount Payable. Recompute this any time the mix changes. */
export function computeCampaignPricing(mix: CreatorMixItem[]): CampaignPricing {
  const allocation = creatorAllocation(mix);
  const platformFee = Math.round(allocation * PLATFORM_FEE_RATE);
  return { creatorAllocation: allocation, platformFee, totalPayable: allocation + platformFee };
}

function rewardRange(mix: CreatorMixItem[]) {
  const rates = mix.map((m) => tierRate(m.tierId));
  return { min: Math.min(...rates), max: Math.max(...rates) };
}

// ===================== CAMPAIGNS =====================
export type CampaignType = "music" | "business";

export type BusinessAssets = {
  imageUrl?: string; // product/food/location/flyer/offer photo — one image
  videoUrl?: string; // one promotional video, max 24 seconds
  videoDurationSeconds?: number;
};

// Campaign-level execution status. In this frontend prototype these are set
// once in mock data. In Phase 3+, LIVE/IN PROGRESS/SUBMISSION_REVIEW/COMPLETED
// will be derived server-side from real claims and submissions across all creators.
export type CampaignStatus = "LIVE" | "IN PROGRESS" | "SUBMISSION/REVIEW" | "COMPLETED" | "CLOSED";

// DEMO DATA ONLY — these numbers are static mock figures for the campaign
// progress dashboard. They are NOT derived from real creator activity because
// there is no backend yet. Do not present these as live numbers to advertisers.
export type CampaignDemoProgress = {
  claimed: number;
  submitted: number;
  approved: number;
  rejected: number;
};

export type Campaign = {
  id: string;
  title: string;
  advertiser: string; // artist name OR business/brand name
  campaignType: CampaignType;
  reward: number; // lowest per-creator rate among selected tiers, for card display
  rewardMax?: number; // highest per-creator rate among selected tiers
  location: string;
  targetScope: "city" | "nigeria";
  targetCity: string | null;
  targetState: string | null;
  category: string;
  creatorMix: CreatorMixItem[];
  budget: number; // advertiser-entered budget cap, checked against creator allocation
  status: CampaignStatus;
  joined: number;
  remaining: number;
  spotify?: string; // music campaigns only
  offer?: string; // business campaigns only — product/service/offer description
  assets?: BusinessAssets; // business campaigns only
  requirements: string;
  demoProgress: CampaignDemoProgress;
};

function rewardRangeToFields(mix: CreatorMixItem[]) {
  const { min, max } = rewardRange(mix);
  return { reward: min, rewardMax: max };
}

const afroVibeMix: CreatorMixItem[] = [
  { tierId: "pro", count: 40 },
  { tierId: "midtier", count: 30 },
];
const weekendSoundMix: CreatorMixItem[] = [{ tierId: "starter", count: 200 }];
const streetPopMix: CreatorMixItem[] = [{ tierId: "pro", count: 100 }];
const suyaSpotMix: CreatorMixItem[] = [
  { tierId: "starter", count: 20 },
  { tierId: "midtier", count: 10 },
  { tierId: "pro", count: 3 },
];

export const campaigns: Campaign[] = [
  {
    id: "afro-vibe",
    title: "Afro Vibe — New Single",
    advertiser: "Kola Waves",
    campaignType: "music",
    ...rewardRangeToFields(afroVibeMix),
    location: "Abuja, FCT",
    targetScope: "city",
    targetCity: "Abuja",
    targetState: "FCT",
    category: "Music",
    creatorMix: afroVibeMix,
    budget: 100000,
    status: "LIVE",
    joined: 50,
    remaining: totalCreatorsInMix(afroVibeMix) - 50,
    spotify: "https://open.spotify.com/",
    requirements: "Create one authentic short-form video using the song. Keep the post public and include the campaign hashtag.",
    demoProgress: { claimed: 50, submitted: 40, approved: 34, rejected: 4 },
  },
  {
    id: "weekend-sound",
    title: "Weekend Sound Challenge",
    advertiser: "Melo House",
    campaignType: "music",
    ...rewardRangeToFields(weekendSoundMix),
    location: "Nigeria (nationwide)",
    targetScope: "nigeria",
    targetCity: null,
    targetState: null,
    category: "Music",
    creatorMix: weekendSoundMix,
    budget: 100000,
    status: "IN PROGRESS",
    joined: 165,
    remaining: totalCreatorsInMix(weekendSoundMix) - 165,
    spotify: "https://open.spotify.com/",
    requirements: "Use the selected sound in a TikTok or Instagram Reel. Make the content original and relevant to your niche.",
    demoProgress: { claimed: 165, submitted: 142, approved: 130, rejected: 12 },
  },
  {
    id: "street-pop",
    title: "Street Pop Promo",
    advertiser: "Nova Records",
    campaignType: "music",
    ...rewardRangeToFields(streetPopMix),
    location: "Lagos, Lagos State",
    targetScope: "city",
    targetCity: "Lagos",
    targetState: "Lagos",
    category: "Music",
    creatorMix: streetPopMix,
    budget: 150000,
    status: "SUBMISSION/REVIEW",
    joined: 100,
    remaining: totalCreatorsInMix(streetPopMix) - 100,
    spotify: "https://open.spotify.com/",
    requirements: "Create a short video that introduces the song naturally to your audience.",
    demoProgress: { claimed: 100, submitted: 85, approved: 70, rejected: 8 },
  },
  {
    id: "suya-spot-launch",
    title: "Suya Spot — Grand Opening",
    advertiser: "Suya Spot Abuja",
    campaignType: "business",
    ...rewardRangeToFields(suyaSpotMix),
    location: "Abuja, FCT",
    targetScope: "city",
    targetCity: "Abuja",
    targetState: "FCT",
    category: "Restaurant",
    creatorMix: suyaSpotMix,
    budget: 40000,
    status: "LIVE",
    joined: 9,
    remaining: totalCreatorsInMix(suyaSpotMix) - 9,
    offer: "Free meal for two in exchange for an honest video review of the new outlet.",
    assets: {
      imageUrl: "https://example.com/assets/suya-spot-storefront.jpg",
      videoUrl: "https://example.com/assets/suya-spot-promo.mp4",
      videoDurationSeconds: 18,
    },
    requirements: "Visit the location, order from the menu, and post a short-form video review. Tag the business location.",
    demoProgress: { claimed: 9, submitted: 5, approved: 3, rejected: 1 },
  }
];

export function tierSummaryLabel(mix: CreatorMixItem[]): string {
  if (mix.length === 0) return "—";
  if (mix.length === 1) return CREATOR_TIERS.find((t) => t.id === mix[0].tierId)!.name;
  return "Mixed tiers";
}

export function rewardLabel(c: Campaign): string {
  if (c.rewardMax && c.rewardMax !== c.reward) {
    return `₦${c.reward.toLocaleString()}–₦${c.rewardMax.toLocaleString()}`;
  }
  return `₦${c.reward.toLocaleString()}`;
}

export function totalCreatorsRequested(c: Campaign): number {
  return totalCreatorsInMix(c.creatorMix);
}

// ===================== CREATOR WALLET & PAYOUTS =====================
// Trender pays creators once a month, on the 28th–30th. Charged ONLY at
// payout time (never when the creator earns), unlike the advertiser
// platform fee above which is charged at campaign creation.
export const CREATOR_PAYOUT_FEE_RATE = 0.075;
export const MINIMUM_PAYOUT = 5000;
export const PAYOUT_WINDOW_START_DAY = 28;
export const PAYOUT_WINDOW_END_DAY = 30;

export type PayoutStatus = "Pending" | "Processing" | "Paid" | "Failed";

export type PayoutHistoryEntry = {
  id: string;
  label: string; // e.g. "August Payout"
  grossEarnings: number;
  fee: number;
  amountPaid: number;
  status: PayoutStatus;
  date: string; // display string, e.g. "30 August"
};

export const creatorWallet = {
  availableEarnings: 20000, // eligible for the next payout cycle
  pendingEarnings: 4500, // from campaigns still awaiting approval
};

export const payoutHistory: PayoutHistoryEntry[] = [
  {
    id: "payout-jul",
    label: "July Payout",
    grossEarnings: 16000,
    fee: 1200,
    amountPaid: 14800,
    status: "Paid",
    date: "30 July",
  },
  {
    id: "payout-jun",
    label: "June Payout",
    grossEarnings: 9000,
    fee: 675,
    amountPaid: 8325,
    status: "Paid",
    date: "28 June",
  },
];

/** Gross payout → 7.5% Creator Payout Fee → Net payout. Fee is only ever applied here, at payout time. */
export function computePayout(grossEarnings: number) {
  const fee = Math.round(grossEarnings * CREATOR_PAYOUT_FEE_RATE);
  return { grossEarnings, fee, netPayout: grossEarnings - fee };
}

/** Is `date` within this month's 28th–30th payout window (inclusive)? */
export function isWithinPayoutWindow(date: Date): boolean {
  const day = date.getDate();
  return day >= PAYOUT_WINDOW_START_DAY && day <= PAYOUT_WINDOW_END_DAY;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Human label for the next payout window relative to `date`, e.g. "28–30 August". */
export function nextPayoutWindowLabel(date: Date): string {
  const monthIndex = date.getDate() > PAYOUT_WINDOW_END_DAY ? (date.getMonth() + 1) % 12 : date.getMonth();
  return `${PAYOUT_WINDOW_START_DAY}–${PAYOUT_WINDOW_END_DAY} ${MONTH_NAMES[monthIndex]}`;
}

// This prototype simulates a single logged-in demo creator (no real auth yet).
// Their tier determines which tier-slot they claim from a campaign's creator mix.
export const CURRENT_CREATOR_TIER_ID: CreatorTierId = "pro";

export const creatorStats = {
  score: 82,
  tier: "Pro",
  rank: 247,
  completed: 41,
  approval: 94,
  avgViews: 12600,
  totalEarned: 84500
};
