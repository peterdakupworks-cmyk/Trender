# TRENDER MVP

Trender is a creator-to-artist campaign marketplace. This first codebase is a **frontend-first MVP foundation** based on the supplied Trender UI/UX wireframe and logo.

## Important scope decision

**AI verification is intentionally NOT included in this version.**

The submission screen only collects TikTok/Instagram links and marks them as `pending review`. A human/admin review workflow can be added later.

Creators are expected to have a Spotify account. For the MVP, the Spotify screen opens the artist's Spotify link in a new tab and asks the creator to return to Trender. Spotify OAuth/API integration is **not connected yet**.

Payments are also scaffolded but **Paystack is not connected yet**. No live money should be used with this prototype.

## Tech foundation

- Next.js + React + TypeScript
- CSS (no UI framework required)
- Local mock data for the first prototype
- Supabase planned for database/auth/storage
- Paystack planned for artist funding and later creator payouts
- Spotify integration planned
- Vercel planned for hosting

## Run locally

1. Install Node.js 20+.
2. Open this folder in VS Code.
3. Run:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.

## What is already represented

### Public
- Splash
- Onboarding
- Account type selection
- Creator registration
- Artist registration

### Creator
- Home
- Recommended campaigns
- Campaign details
- Spotify listening step
- Submission
- Wallet
- Career
- Profile

### Artist
- Dashboard
- Create campaign
- Analytics

### Admin
- Dashboard structure

## Next build order with Claude Code

1. Audit this codebase before changing it.
2. Add Supabase Auth and database.
3. Replace mock data with real Supabase queries.
4. Add creator/artist/admin roles and RLS.
5. Implement campaign location targeting: City/State or Nigeria-wide. City campaigns must only be eligible for creators whose approved profile location matches the selected city/state.
5. Add Spotify OAuth only if the final product requires it.
6. Add Paystack test-mode campaign funding.
7. Add secure webhook verification.
8. Add creator wallet ledger and admin-approved withdrawals.
9. Add notifications.
10. Add production security tests.
11. Deploy to Vercel.
12. Have a human developer audit security/payment logic before real-money launch.

## Handoff prompt for Claude

Paste this when you open the project in Claude Code:

> You are taking over an existing Trender MVP codebase. Read README.md, TRENDER_SPEC.md, the app routes, components, and supabase/migrations/ before modifying anything. Do not rebuild from scratch. Preserve the supplied Trender logo and the dark purple/mint design language. AI verification is explicitly OUT OF SCOPE for the current MVP. Creators must have/use Spotify to listen to campaign songs, but Spotify OAuth/API integration is not yet required; keep it as a clean integration point. Do not add live Paystack credentials. First audit the architecture and give me a prioritized implementation plan, then wait for approval before making major architectural changes.


## Location targeting (core feature)
Artists/brands can choose **Specific City** or **All Nigeria** when creating a campaign.
- Specific City requires State + City (e.g. Abuja, FCT).
- The creator profile stores City + State.
- City campaigns are eligible only for matching creators.
- Nigeria campaigns are eligible nationwide.
- The UI shows the targeting on campaign cards/details.
- Production matching must be enforced server-side through Supabase/RLS/RPC, not only in the browser.
