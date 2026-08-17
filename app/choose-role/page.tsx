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

  if (!loading && !user) {
    return (
      <main className="center">
        <div style={{ width: "min(760px,100%)" }}>
          <Brand />
          <div className="card card-pad" style={{ marginTop: 30 }}>
            <h1>Choose your account</h1>
            <p className="muted">Create a Trender account as a Creator or Business / Brand.</p>
            <div className="grid grid-2" style={{ marginTop: 22 }}>
              <Link className="choice" href="/creator/register"><strong>Creator</strong><span>Discover campaigns, create content and earn rewards.</span></Link>
              <Link className="choice" href="/business/register"><strong>Business / Brand</strong><span>Create campaigns for music, products, services, or brands.</span></Link>
            </div>
            <p className="muted" style={{ textAlign: "center", marginTop: 18 }}>Already have an account? <Link href="/login">Log in</Link></p>
          </div>
        </div>
      </main>
    );
  }

  if (loading || checking) {
    return <main className="center"><p className="muted">Loading your account…</p></main>;
  }

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
            <p className="muted">One account, two ways to use Trender. You can create campaigns as a Business / Brand or earn as a Creator.</p>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginTop: 10 }}>
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

          <div className="card card-pad">
            <span className="badge purple">🏢 BUSINESS / BRAND</span>
            <h3 style={{ marginTop: 10 }}>Business / Brand</h3>
            <p className="muted">Create campaigns for music, products, services, events, or brands.</p>
            {advertiser?.exists ? (
              <>
                <p className="muted" style={{ fontSize: 13 }}>Advertiser profile active{advertiser.type === "music" ? " — existing music profile" : ""}.</p>
                <Link className="btn" href="/business">Business / Brand Dashboard</Link>
              </>
            ) : (
              <Link className="btn secondary" href="/business/register">Set up Business / Brand</Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
