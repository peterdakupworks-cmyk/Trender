# TRENDER PRODUCT SPEC — MVP

## Brand
- Name: Trender
- Tagline: Connect. Create. Earn.
- Primary visual direction: dark theme with vibrant purple and mint accents.
- Supplied assets live in `public/brand/`.

## UX principles
Simple. Fast. Transparent. Rewarding.

## User roles
1. Creator
2. Artist/Brand
3. Admin

## Creator journey
Splash → onboarding → choose Creator → registration → home → campaigns → campaign details → **claim task** → Spotify listening / asset review → submission → submission status → wallet/career/profile → my campaigns (history).

### Creator registration
Collect:
- Profile photo
- Name/details
- TikTok username
- Instagram username
- Niche
- **City**
- **State**
- Identity verification status

### Creator home
Show:
- Available Earnings, Pending Earnings
- Trender Score
- **Campaigns Completed, Total Earned** (dashboard summary — see below)
- Recommended campaigns
- Bottom navigation: Home, Campaigns, History, Wallet, Career, Profile

### Campaign details
Show:
- Campaign title
- Artist/brand
- Reward
- Location
- Category
- Requirements
- Spotify link (music) or promotional assets (business)
- **Claim this task** button (see Campaign Execution Window below)

### Campaign Execution Window (48-hour claim system)
When a campaign is LIVE, an eligible creator can **claim** an open slot in their tier. Claiming starts a **48-hour countdown** ("TIME REMAINING — 31h 42m") during which the creator must create and submit their content.

Flow: Campaign LIVE → creator claims task → 48-hour timer starts → creator creates content → creator submits content/post link → submission enters human review → approved or rejected → approved reward becomes available earnings.

**Task expiration:** if a creator claims a task and does not submit within 48 hours, the task status becomes **EXPIRED**. An expired task cannot be submitted by that creator unless an admin explicitly reopens it. The slot becomes available again for another eligible creator.

**Creator task statuses:** AVAILABLE (no claim yet) · CLAIMED · SUBMITTED · APPROVED · REJECTED · EXPIRED.

**Campaign statuses:** LIVE · IN PROGRESS · SUBMISSION/REVIEW · COMPLETED · CLOSED.

This is currently simulated entirely client-side (a single demo creator, browser `localStorage`, no real multi-creator slot contention). Real, server-enforced slot contention across many creators moves to Supabase in Phase 3+. The prototype includes a QA-only control to force a claim to expire without waiting 48 real hours — clearly labeled and removed before production.

### Spotify step
Creator must have a Spotify account and listen to the song to understand it before creating content. Only reachable once the creator has an active (non-expired) claim; shows the live 48-hour countdown.
Current MVP behavior: open the supplied Spotify link and return to continue.
Future: optional Spotify OAuth/API integration.

### Business/Brand asset review step
For Business/Brand campaigns, creators review the advertiser's promotional image/video (instead of Spotify) before creating content. Same claim guard and countdown as the Spotify step.

### Submission
Creator pastes TikTok/Instagram post URL. Requires an active (non-expired) claim — the deadline is re-checked at submit time, not just when the page loads.
Current MVP behavior: submission becomes `SUBMITTED` and the creator is taken to a **Submission Status** screen.
**No AI verification in MVP** — human/admin review only. The prototype includes a QA-only panel to simulate an admin Approve/Reject decision.

### My Campaigns (Campaign History)
Creators can view every campaign they've claimed, grouped into tabs: **ACTIVE** (claimed) · **PENDING REVIEW** (submitted) · **COMPLETED** (approved/rejected) · **EXPIRED**.

Each record shows: campaign name, artist/brand name, campaign type, creator tier, creator reward, campaign location, date claimed, date submitted, submission/approval status, payment status, and a **View Submitted Content** button that opens the originally submitted post URL.

Historical records are **read-only** — a creator cannot edit a record after it's been submitted.

### Creator Earnings History
Conceptually: Campaign → Content → Approval → Earnings. For each approved campaign, the creator can see the submitted content, the reward, approval status, wallet status (Credited once approved), and the date earned. This is currently presented as part of My Campaigns rather than a separate screen.

### Wallet
Show:
- **Available Earnings** — approved campaign earnings eligible for the next payout cycle
- **Pending Earnings** — earnings from campaigns awaiting approval
- **Next Payout** — date range of the next payout window
- **Payout History** — past payouts with status (Pending / Processing / Paid / Failed)

#### Monthly payout system
Trender does **not** support anytime withdrawals. Creators are paid once per month, during the **28th–30th payout window**.
- Outside the window: the payout action is unavailable; show "Next payout: 28–30 [Month]".
- Inside the window: show "Request Payout".

#### Minimum payout
Minimum creator payout is **₦5,000 gross** — a creator must have **at least** ₦5,000 available to request payout (₦5,000 itself qualifies). If available balance is below ₦5,000, payout is blocked and the balance rolls over to the next cycle — show: "Minimum payout is ₦5,000. Your balance will roll over to the next payout cycle."

#### Creator Payout Fee
Trender charges a **7.5% Creator Payout Fee**, applied **only at payout time** — never when the creator earns. Before confirming, show Gross Payout → Creator Payout Fee → Net Payout.

Worked examples (source of truth — do not use other numbers):
| Gross | Fee (7.5%) | Net |
|---|---|---|
| ₦5,000 (minimum) | ₦375 | ₦4,625 |
| ₦20,000 | ₦1,500 | ₦18,500 |

### Career
Show:
- Creator tier
- Trender Score
- National ranking
- Badges
- Completed campaigns
- Approval rate
- Average views
- Total earnings

## Artist journey
Splash → onboarding → choose Artist/Brand → registration → dashboard → create campaign → analytics.

### Artist dashboard
Show:
- Wallet
- Active campaigns
- Completed campaigns
- Analytics
- Create Campaign

### Advertiser types
Trender is not only for music artists. When registering, an advertiser chooses:
- **Music Artist** — genre, Spotify link.
- **Business/Brand** — category, description, location, website/social link, logo, and campaign-level promotional assets.

### Create campaign
Final recommended flow (12 steps):
1. Choose campaign type (Music or Business/Brand)
2. Campaign details (advertiser/brand name, title, category)
3. Upload media / Spotify (conditional on type)
4. Creator requirements
5. Select creator tiers
6. Select creator quantities per tier
7. Select location (City or All Nigeria)
8. Campaign budget
9. Platform fee (auto-calculated)
10. Total amount payable (auto-calculated)
11. Review campaign
12. Launch campaign (Publish)

The screen also clearly states: "Creators have 48 hours after claiming this campaign to create and submit their content."

Collect:
- **Campaign type: Music or Business/Brand** (chosen first; changes the fields below)
- Campaign title, advertiser/brand name, category
- **Music campaigns:** Spotify link (required). Keeps the existing Spotify listening workflow for creators. Not connected to production Spotify credentials yet.
- **Business/Brand campaigns:** no Spotify requirement. Product/service/offer description (required). One promotional image and one promotional video (both optional, but only one of each) representing the product, food, business location, service, offer, or flyer being promoted.
  - **Promotional video limit: 24 seconds maximum.** The frontend validates duration client-side and rejects longer videos with: "Video must be 24 seconds or less."
  - The advertiser can preview the uploaded image/video before continuing.
- Requirements (what creators should post)
- **Creator tier mix:** the advertiser selects one or more tiers (Starter/Mid-tier/Pro) and enters how many creators are needed from each. Total creators and creator allocation are calculated automatically — the advertiser is never assumed to want to spend the whole budget on one tier.
- **Target location scope** (City or All Nigeria) and **target city/state when City targeting is selected**
- **Campaign budget** (advertiser-entered ₦ cap)
- Publish

#### Creator tiers & rates (source of truth — do not use older/other numbers)
| Tier | Follower range | Reward per creator |
|---|---|---|
| Starter | 500–1,000 | ₦500 |
| Mid-tier | 1,000–5,000 | ₦1,000 |
| Pro | 5,000–10,000 | ₦1,500 |

Rates are configurable and will move to an admin-editable settings table in a later phase — they are not permanently hard-coded into the business logic.

#### Platform fee & pricing (must always be shown, never hidden)
Trender charges advertisers a **7.5% Platform Fee** on the creator campaign allocation, added on top:

```
Creator Allocation           ₦95,000
Trender Platform Fee (7.5%)   ₦7,125
──────────────────────────────────────
Total Amount Payable        ₦102,125
```

This recalculates automatically whenever the creator tier mix changes. If the creator allocation exceeds the advertiser's entered campaign budget, the campaign cannot proceed — a clear error is shown and the advertiser can reduce creator quantities or increase the budget.

### Campaign Progress dashboard (advertiser-facing)
Each active campaign has a progress view showing execution numbers — **not** social-media analytics:
- Total creator allocation
- Creators claimed
- Content submitted
- Content approved
- Content rejected
- Remaining creator slots
- Campaign status

This is explicitly **not** automatic social-media performance tracking (views/likes/comments/shares/engagement) — see Future Features below. In this prototype these numbers are **static DEMO DATA**, clearly labeled as such on-screen, since there is no backend yet to compute them from real multi-creator activity.

### Location targeting
Location targeting is a core Trender feature.

The artist/brand chooses where the campaign should be distributed:
- **City** — target creators in one selected Nigerian city (for example Abuja).
- **Nigeria** — target creators across Nigeria.

If City is selected, the system should only make the campaign eligible for creators whose approved profile location matches the selected city/state. The creator should see the task automatically in their eligible Campaigns feed; the platform does not need to create duplicate tasks for every creator until they accept/claim the campaign.

If Nigeria is selected, creators across Nigeria can see/claim the campaign, subject to the campaign's other eligibility rules.

The selected location must be visible on the campaign card and campaign details page.

### Analytics
Show:
- Creators joined
- Approved submissions
- Completed videos
- Campaign performance
- Top creators

## Admin
Show:
- Users
- Revenue
- Verification queue
- Withdrawals
- Fraud reports
- Analytics

## Phase 3A — Supabase foundation (backend)
As of Phase 3A, the following run against a real Supabase project (see `supabase/README.md` for setup, `supabase/migrations/` for schema):
- Real authentication: sign up, log in, log out, session persistence.
- `profiles` table (role, name, username, phone, email, location, avatar, bio), auto-created by a DB trigger on signup.
- Creator registration: full name, username, phone, profile picture (Supabase Storage), country/state/city, **required** Instagram + TikTok profile links, submitted follower count. New creators start `identity_status = 'pending'`, `account_status = 'active'` (plain text columns from migration 0001).
- Advertiser registration (Music or Business/Brand): `advertiser_profiles` table.
- Row Level Security throughout: users can only read/write their own rows; `role`, creator `tier`/`identity_status`/`account_status` fields, wallet balances, and payout status/fees can never be set or changed by a normal client — only by a trusted server/service-role process. A user cannot self-promote to `admin`.
- **Known gap — not yet live:** migration `0002_creator_registration_foundation.sql` (normalized-URL duplicate Instagram/TikTok-account prevention, and the richer `verification_status`/`account_status`/risk enum fields) is written but **has not been successfully applied** to the live database. Do not assume its columns/types exist until you've confirmed it actually ran — see the note at the top of `supabase/migrations/0004_atomic_creator_registration.sql`, which was revised specifically because 0002 wasn't there.

**Still running on mock/local data (unchanged, by design — this is Phase 3B+ work):** campaign creation, the creator-tier budget builder, campaign browsing/eligibility, the 48-hour claim system, submissions, campaign history, wallet balances, and payouts. None of this reads from or writes to Supabase yet.


- Music campaigns
- Business/Brand campaigns
- Spotify workflow for Music
- No Spotify requirement for Business
- Promotional images
- Promotional videos
- 24-second video maximum
- Creator tier allocation (Starter/Mid-tier/Pro)
- Location targeting (City / Nigeria-wide)
- 48-hour creator completion window
- Task expiration
- Creator submission
- Campaign progress numbers (DEMO DATA — see Campaign Progress dashboard)
- Human/admin review (no AI verification)
- Advertiser 7.5% Platform Fee
- Creator wallet (Available/Pending Earnings)
- ₦5,000 gross minimum payout
- 28–30 monthly payout window
- 7.5% Creator Payout Fee
- Payout history
- Creator Campaign History ("My Campaigns")
- Previously submitted content links
- Creator earnings history

## FUTURE FEATURES (explicitly not built yet — do not fake in a production-looking dashboard)
- Automatic social-media performance analytics (views, likes, comments, shares, reach, engagement rate)
- Performance by creator / by tier / by location
- Top-performing content
- Performance bonuses (optional advertiser bonus pool)
- Advanced creator ranking
- Production social-media API integrations
- AI content verification
- AI creator matching
- Creator chat
- Referrals
- Leaderboards
- Creator Academy
- Scheduling
- Team accounts
- Advanced streaming integrations

## Business rules to finalize before production
- Refund/cancellation rules
- Manual review SLA
- Fraud rules
- Campaign limits per creator/day
- Creator eligibility requirements
- Real file storage for uploaded campaign media (currently client-side object URLs only, not persisted)

## Decided (as of this pre-Phase-3 update — see sections above for detail)
- Creator reward tiers: Starter ₦500 / Mid-tier ₦1,000 / Pro ₦1,500 per creator
- Advertiser Platform Fee: 7.5% of creator allocation, shown before publish
- Creator Payout Fee: 7.5%, charged only at payout time
- Minimum payout: ₦5,000 gross (inclusive), with rollover below that threshold
- Payout cadence: monthly, 28th–30th window only
- Creator claim window: 48 hours from claim to submission, then EXPIRED
- Expired tasks free the slot for other creators; require admin reopen for the original creator to submit again
- Campaign statuses: LIVE / IN PROGRESS / SUBMISSION-REVIEW / COMPLETED / CLOSED
- Creator task statuses: AVAILABLE / CLAIMED / SUBMITTED / APPROVED / REJECTED / EXPIRED
- Advertiser Campaign Progress dashboard shows execution counts only (claimed/submitted/approved/rejected/remaining), explicitly not social analytics, and is DEMO DATA until Phase 3
