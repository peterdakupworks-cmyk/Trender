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
    router.push("/choose-role");
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h1>Log in</h1>
          <p className="muted">Use your universal Trender account to access Creator and Business / Brand features.</p>
          {error && <div className="warning-box" style={{ marginBottom: 14 }}>{error}</div>}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
          </div>
          <div className="form-actions">
            <button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </button>
            <Link className="btn secondary" href="/signup">Create an Account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
