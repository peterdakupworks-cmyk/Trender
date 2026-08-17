"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "../../components/Brand";
import { PasswordInput } from "../../components/PasswordInput";
import { useAuth } from "../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { NIGERIA_STATES } from "../../lib/locations";

type Errors = Partial<Record<"fullName" | "email" | "phone" | "country" | "state" | "password" | "form", string>>;

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  function validate() {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your email.";
    if (!phone.trim()) next.phone = "Enter your phone number.";
    if (!country.trim()) next.country = "Select your country.";
    if (!state.trim()) next.state = "Select your state.";
    if (!password || password.length < 6) next.password = "Password must be at least 6 characters.";
    return next;
  }

  async function handleSubmit() {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const { error: signUpError, userId, hasSession } = await signUp(email.trim(), password);
      if (signUpError || !userId) {
        setErrors({ form: signUpError ?? "Sign up failed. Please try again." });
        return;
      }

      if (!hasSession) {
        setAwaitingEmailConfirm(true);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          country,
          state,
        })
        .eq("id", userId);

      if (updateError) {
        setErrors({ form: "Your account was created, but your profile details could not be saved. Please sign in and update them in your profile." });
        return;
      }

      router.push("/onboarding");
    } finally {
      setSubmitting(false);
    }
  }

  if (awaitingEmailConfirm) {
    return (
      <main className="center">
        <div className="card card-pad" style={{ textAlign: "center", maxWidth: 480 }}>
          <span className="badge warning">CONFIRM YOUR EMAIL</span>
          <h1>Check your inbox</h1>
          <p className="muted">
            We sent a confirmation link to <strong>{email}</strong>. Once you confirm it, log in and continue to your Trender account.
          </p>
          <Link className="btn" href="/login">Go to login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h1>Create your Trender account</h1>
          <p className="muted">One universal account for Creator, Artist, and Business capabilities.</p>

          {errors.form && <div className="warning-box" style={{ marginBottom: 14 }}>{errors.form}</div>}

          <div className="field">
            <label>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field">
              <label>Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label>Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="Nigeria">Nigeria</option>
              </select>
              {errors.country && <span className="field-error">{errors.country}</span>}
            </div>
            <div className="field">
              <label>State</label>
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select state</option>
                {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <span className="field-error">{errors.state}</span>}
            </div>
          </div>

          <div className="field">
            <label>Password</label>
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-actions">
            <button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
            <Link className="btn secondary" href="/login">Back</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
