"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "../../components/Brand";
import { PasswordInput } from "../../components/PasswordInput";
import { useAuth } from "../../contexts/AuthProvider";

export default function Signup() {
  const { signUp } = useAuth();
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const { error: signUpError } = await signUp(email.trim(), password);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    router.push("/choose-role");
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h1>Create an account</h1>
          <p className="muted">Create one universal Trender account. You can advertise or apply to become a Creator after signing in.</p>
          {error && <div className="warning-box" style={{ marginBottom: 14 }}>{error}</div>}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          </div>
          <div className="form-actions">
            <button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating account…" : "Create an Account"}
            </button>
            <Link className="btn secondary" href="/login">Log In</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
