"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "../../components/Brand";
import { useAuth } from "../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { getAdvertiserProfile } from "../../lib/supabase/capabilities";

type CreatorStatus = { exists: boolean; identityStatus: string | null };
type AdvertiserStatus = { exists: boolean };

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
      setAdvertiser({ exists: !!advertiserRow });
      setChecking(false);
    })();
  }, [user, loading]);

  if (loading || checking) {
    return <main className="center"><p className="muted">Loading your account…</p></main>;
  }

  if (!user) {
    return (
      <main className="center">
        <div style={{ width: "min(560px,100%)" }}>
          <Brand />
          <div className="card card-pad" style={{ marginTop: 30, textAlign: "center" }}>
            <h1>Welcome to Trender</h1>
            <p className="muted">Create one universal Trender account, or log in if you already have one.</p>
            <div className="form-actions" style={{ justifyContent: "center", marginTop: 22 }}>
              <Link className="btn" href="/signup">Create an Account</Link>
              <Link className="btn secondary" href="/login">Log In</Link>
            </div>
          </div>
        </div>
      </main>
    );
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
            <h1>What do you want to do?</h1>
            <p className="muted">One Trender account. Advertise or apply to become a Creator.</p>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginTop: 10 }}>
          <div className="card card-pad">
            <span className="badge purple">📢 ADVERTISE / PROMOTE</span>
            <h3 style={{ marginTop: 10 }}>Business / Brand</h3>
            <p className="muted">Set up the basic information needed to promote your business or brand.</p>
            {advertiser?.exists ? (
              <Link className="btn" href="/business">Open Business / Brand</Link>
            ) : (
              <Link className="btn" href="/business/register">Continue</Link>
            )}
          </div>

          <div className="card card-pad">
            <span className="badge purple">🎥 CREATOR</span>
            <h3 style={{ marginTop: 10 }}>Become a Creator</h3>
            <p className="muted">Apply with your full name, follower count, social profiles, location and content category.</p>
            {creator?.exists ? (
              <>
                <p className="muted" style={{ fontSize: 13 }}>Creator application: <strong>{creator.identityStatus ?? "pending"}</strong></p>
                <Link className="btn" href="/creator">Open Creator</Link>
              </>
            ) : (
              <Link className="btn secondary" href="/creator/register">Apply as Creator</Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
