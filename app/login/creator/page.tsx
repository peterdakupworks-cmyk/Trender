"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "../../../components/Brand";
import { useAuth } from "../../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { resolveAndCheckCreatorCapability } from "../../../lib/supabase/creatorRegistration";
import { PasswordInput } from "../../../components/PasswordInput";

export default function CreatorLogin() {
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

    // Finishes any registration that was filled in but never completed
    // (most commonly: email confirmation was required, so no session
    // existed at signup time), then reports whether a Creator profile now
    // exists. Previously, a failed completion here was silently discarded,
    // which then correctly (but confusingly) computed "no profile yet" and
    // sent the user back to the registration form with no explanation —
    // that looked like a routing bug but was actually a swallowed error.
    const { hasProfile, error: resolveError } = await resolveAndCheckCreatorCapability(supabase, userId);
    if (resolveError) {
      setError(resolveError);
      setSubmitting(false);
      return;
    }

    router.push(hasProfile ? "/creator" : "/creator/register");
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <span className="badge purple">🎥 CREATOR LOGIN</span>
          <h1 style={{ marginTop: 10 }}>Log in as a Creator</h1>
          <p className="muted">Find campaigns, create content and earn.</p>

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
              {submitting ? "Logging in…" : "Continue as Creator"}
            </button>
            <Link className="btn secondary" href="/login">Back</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
