"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "../../components/Brand";
import { useAuth } from "../../contexts/AuthProvider";
import { PasswordInput } from "../../components/PasswordInput";

export default function Login() {
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
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    // Deliberately does NOT look at creator_profiles/advertiser_profiles or
    // decide a destination here. Authentication and capability selection are
    // different concerns — this route only answers "who is logged in?".
    // Where they go next is answered by /choose-role.
    router.push("/choose-role");
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h1>Log in</h1>
          <p className="muted">One Trender account for Creator, Artist, and Business — use the same email and password every time.</p>

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
              {submitting ? "Logging in…" : "Log in"}
            </button>
            <Link className="btn secondary" href="/choose-role">Create an account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
