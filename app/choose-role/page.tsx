"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "../../components/Brand";
import { useAuth } from "../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { getAdvertiserProfile } from "../../lib/supabase/capabilities";

type CreatorStatus = { exists: boolean; identityStatus: string | null };
type AdvertiserStatus = { exists: boolean; type: "music" | "business" | null };

export default function ChooseRole() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorStatus | null>(null);
  const [advertiser, setAdvertiser] = useState<AdvertiserStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    (async () => {
      const [{ data: creatorRow }, advertiserRow] = await Promise.all([
        supabase.from("creator_profiles").select("identity_status").eq("user_id", user.id).maybeSingle(),
        getAdvertiserProfile(supabase, user.id),
      ]);
      setCreator({ exists: !!creatorRow, identityStatus: creatorRow?.identity_status ?? null });
      setAdvertiser({ exists: !!advertiserRow, type: advertiserRow?.advertiser_type ?? null });
      setChecking(false);
    })();
  }, [user, loading]);

  // ---- Not logged in: original pre-signup chooser, unchanged ----
  if (!loading && !user) {
    return (
      <main className="center">
        <div style={{ width: "min(760px,100%)" }}>
          <Brand />
          <div className="card card-pad" style={{ marginTop: 30 }}>
            <h1>Choose your account</h1>
            <p className="muted">You can create a Trender account as a creator or as an artist/brand.</p>
            <div className="grid grid-2" style={{ marginTop: 22 }}>
              <Link className="choice" href="/creator/register"><strong>Creator</strong><span>Discover campaigns, create content and earn rewards.</span></Link>
              <Link className="choice" href="/artist/register"><strong>Artist / Brand</strong><span>Launch campaigns and reach creators.</span></Link>
            </div>
            <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>Already have an account? <Link href="/login">Log in</Link></p>
          </div>
        </div>
      </main>
    );
  }

  // ---- Logged in: real capability screen ----
  if (loading || checking) {
    return <main className="center"><p className="muted">Loading your account…</p></main>;
  }

  const advertiserIsMusic = advertiser?.exists && advertiser.type === "music";
  const advertiserIsBusiness = advertiser?.exists && advertiser.type === "business";

  return (
    <main className="page">
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="page-head">
          <Brand />
          <button className="btn secondary" type="button" onClick={async () => { await signOut(); router.push("/"); }}>Log out</button>
        </div>

        <div className="page-head" style={{ marginTop: 18 }}>
            <div>
              <h1>Choose your Trender capability</h1>
              <p className="muted">One account, multiple ways to use Trender. Pick where you want to go.</p>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginTop: 10 }}>
            {/* CREATOR */}
            <div className="card card-pad">
              <span className="badge purple">🎥 CREATOR</span>
              <h3 style={{ marginTop: 10 }}>Creator</h3>
              <p className="muted">Discover campaigns, create content and earn.</p>
              {creator?.exists ? (
                <>
                  <p className="muted" style={{ fontSize: 13 }}>Status: <strong>{creator.identityStatus ?? "pending"}</strong></p>
                  <Link className="btn" href="/creator">Creator Dashboard</Link>
                </>
              ) : (
                <Link className="btn secondary" href="/creator/register">Apply as Creator</Link>
              )}
            </div>

            {/* ARTIST */}
            <div className="card card-pad">
              <span className="badge purple">🎵 ARTIST</span>
              <h3 style={{ marginTop: 10 }}>Artist</h3>
              <p className="muted">Promote your music and launch campaigns.</p>
              {advertiserIsMusic ? (
                <Link className="btn" href="/artist">Artist Dashboard</Link>
              ) : advertiserIsBusiness ? (
                <p className="muted" style={{ fontSize: 13 }}>This account's advertiser profile is currently set up as Business/Brand. Artist and Business can't both be active on one account yet.</p>
              ) : (
                <Link className="btn secondary" href="/artist/register?type=music">Set up Artist profile</Link>
              )}
            </div>

            {/* BUSINESS */}
            <div className="card card-pad">
              <span className="badge purple">🏢 BUSINESS</span>
              <h3 style={{ marginTop: 10 }}>Business / Brand</h3>
              <p className="muted">Promote your products, services or business.</p>
              {advertiserIsBusiness ? (
                <Link className="btn" href="/business">Business Dashboard</Link>
              ) : advertiserIsMusic ? (
                <p className="muted" style={{ fontSize: 13 }}>This account's advertiser profile is currently set up as Artist. Artist and Business can't both be active on one account yet.</p>
              ) : (
                <Link className="btn secondary" href="/artist/register?type=business">Set up Business profile</Link>
              )}
            </div>
          </div>
      </div>
    </main>
  );
}
