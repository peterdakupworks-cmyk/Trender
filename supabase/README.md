# Connecting Trender to Supabase (Phase 3A)

This is a step-by-step guide for setting up the real backend. You'll need about
15 minutes. Nothing here costs money on Supabase's free tier for an MVP.

## What is Supabase?
Supabase is a hosted database + login system. It's what actually stores
creators, campaigns, and accounts once you connect it — up to now, Trender has
only been using fake, in-browser data.

## Step 1 — Create a Supabase project
1. Go to https://supabase.com and sign up / log in.
2. Click **New Project**.
3. Give it a name (e.g. "trender-mvp"), choose a database password (save this
   somewhere safe — you likely won't need it day-to-day, but don't lose it),
   and pick a region close to Nigeria (e.g. `eu-west` or similar).
4. Wait 1–2 minutes for the project to finish setting up.

## Step 2 — Run the database migrations
1. In your Supabase project, open the left sidebar and click **SQL Editor**.
2. Click **New query**.
3. Open `supabase/migrations/0001_phase3a_foundation.sql` in this project,
   copy its entire contents, paste into the SQL editor, and click **Run**.
   Confirm it says "Success" with no red error before continuing.
4. Repeat for `0003_storage_foundation.sql`.
5. Repeat for `0004_atomic_creator_registration.sql`.
6. Repeat for `0005_add_profiles_phone.sql`.

That's the required baseline — `0001` → `0003` → `0004` → `0005`, in that order.

**If you saw "Bucket not found" on profile picture upload, or "column phone
does not exist" from creator registration:** these both mean `0003` and/or
`0005` haven't actually been applied to this project yet. Run them (in the
order above) and both should resolve — no code change needed for either.

**`0002_creator_registration_foundation.sql` is optional and separate.** It
adds stronger duplicate Instagram/TikTok-account prevention and richer
verification/risk fields, but it was written assuming certain columns exist
a certain way, and in this project it was never fully applied. Only run it
if you specifically want those extra protections, and only after reading it
fully — don't run it "just in case." `0004` does **not** depend on it.

**If a migration errors partway through, nothing from that script gets
saved** — Postgres rolls back the whole thing, even the parts that looked
fine. That's exactly how this project ended up with `0004` (an earlier
version) assuming columns/types from `0002` that were never actually
created. If you ever see an error, stop, don't run anything else, and check
what's actually in the database before proceeding:
```sql
select * from information_schema.columns where table_name = 'creator_profiles';
```

If any step shows a red error, stop and send me the exact error message
rather than continuing — don't run the next file if an earlier one failed.

## Step 3 — Get your project's API keys
1. In Supabase, go to **Project Settings → API**.
2. You'll see:
   - **Project URL** — copy this.
   - **anon / public key** — copy this. This one is safe to use in the app.
   - **service_role key** — copy this too, but treat it like a password.
     **Never** put this one in the app's frontend code or commit it anywhere.

## Step 4 — Set your environment variables
1. In this project's folder, copy `.env.example` to a new file named
   `.env.local` (same folder).
2. Open `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon/public key>
   SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
   ```
3. `.env.local` is already excluded from version control (see `.gitignore`),
   so it will never accidentally get committed or shared.

## Step 5 — Install the new dependency and run
```
npm install
npm run dev
```
Then open http://localhost:3000.

## Step 6 — Test it yourself
Try creating a real creator account through the app (`/creator/register`).
Then in Supabase, go to **Table Editor → profiles** and **creator_profiles**
— you should see your new row appear there. That confirms the connection is
working end to end.

## What this connects (Phase 3A)
- Sign up / log in / log out / session persistence
- Creator registration (with required Instagram + TikTok, profile picture
  upload, follower count submission)
- Advertiser registration (Music or Business/Brand)
- Creator profile editing + avatar replace

## What still uses fake/local data (by design, until later phases)
- Campaigns, campaign creation, creator mix/budget, claims/48h countdown,
  submissions, wallet balances, and payouts are still running on the mock
  data from `lib/mock.ts` / `lib/claims.ts`. This is intentional — the
  campaign engine is Phase 3B+, not this phase.

## If something goes wrong
- **"Missing NEXT_PUBLIC_SUPABASE_URL..." error in the browser** — you
  haven't created `.env.local` yet, or forgot to restart `npm run dev` after
  creating it (env files are only read when the dev server starts).
- **Signup succeeds but no row appears in `profiles`** — check the SQL
  Editor logs; the `on_auth_user_created` trigger from migration 0001 should
  have created it automatically.
- **"row-level security policy" error** — this usually means a required
  field wasn't sent, or you're trying to set a field (like `role: admin`)
  that's intentionally blocked from the browser. That's expected behavior,
  not a bug.
