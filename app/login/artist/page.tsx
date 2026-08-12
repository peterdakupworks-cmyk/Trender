"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "../../../components/Brand";
import { useAuth } from "../../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { getAdvertiserProfile } from "../../../lib/supabase/capabilities";
import { completeAdvertiserRegistration } from "../../../lib/supabase/advertiserRegistration";
import { getPendingAdvertiserRegistration, clearPendingAdvertiserRegistration } from "../../../lib/pendingAdvertiserRegistration";
import { PasswordInput } from "../../../components/PasswordInput";

export default function ArtistLogin() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setError("Something went wrong signing you in. Please try again.");
      setSubmitting(false);
      return;
    }

    // Resolve any pending advertiser registration inline (awaited) before
    // routing — same fix as Creator login, closing the same race against
    // AuthProvider's background resume.
    const pending = getPendingAdvertiserRegistration();
    if (pending) {
      const { error: completeError } = await completeAdvertiserRegistration(supabase, {
        userId,
        advertiserType: pending.accountType,
        name: pending.name,
        country: "Nigeria",
        state: pending.state,
        city: pending.city,
        category: pending.category,
        description: pending.description,
        websiteUrl: pending.websiteUrl,
        logoUrl: pending.logoUrl,
        contactInfo: pending.contact,
        spotifyUrl: pending.spotifyUrl,
      });
      if (!completeError) clearPendingAdvertiserRegistration();
    }

    const advertiser = await getAdvertiserProfile(supabase, userId);
    if (advertiser?.advertiser_type === "music") {
      router.push("/artist");
    } else if (advertiser) {
      // They authenticated fine — this is the same Trender account — but its
      // one advertiser slot is already a Business/Brand profile, not Artist.
      // The live schema allows only one advertiser_profiles row per user.
      setError("This account already has a Business/Brand profile. Artist and Business profiles can't both be active on one account yet.");
      setSubmitting(false);
      return;
    } else {
      router.push("/artist/register?type=music");
    }
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <span className="badge purple">🎵 ARTIST LOGIN</span>
          <h1 style={{ marginTop: 10 }}>Log in as an Artist</h1>
          <p className="muted">Promote your music and launch campaigns. Use the same email and password as your existing Trender account, if you have one.</p>

          {error && <div className="warning-box" style={{ marginBottom: 14 }}>{error}</div>}

          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
          </div>

          <div className="form-actions">
            <button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Logging in…" : "Continue as Artist"}
            </button>
            <Link className="btn secondary" href="/login">Back</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
