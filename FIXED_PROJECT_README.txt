TRENDER FIXED PROJECT

This archive is a corrected working copy of the uploaded Trender project.

Important:
1. Keep your old project folder as a backup.
2. Extract this archive into a NEW folder, e.g. C:\\Users\\HOP\\Desktop\\trender-mvp-fixed.
3. Copy your existing .env.local from the old project into the new folder.
4. Open PowerShell in the new folder.
5. Run: npm install
6. Run: npx tsc --noEmit --pretty false
7. Run: npm run dev
8. Open http://localhost:3000

Key fixes included:
- Supabase client generic typing corrected.
- Supabase Database types include advertiser capability fields, creator presence and RPCs.
- campaignsForAdvertiserType added to mock data.
- Advertiser registration accepts isArtist/isBusiness.
- Capability screen and universal login routing corrected so login goes to /choose-role instead of forcing /creator.
- Business capability routes to /business.

Do NOT delete the old project until the new copy has been tested locally.
