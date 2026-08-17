"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Brand } from "../../../components/Brand";
import { NIGERIA_STATES, citiesForState } from "../../../lib/locations";
import { useAuth } from "../../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { completeAdvertiserRegistration } from "../../../lib/supabase/advertiserRegistration";
import { savePendingAdvertiserRegistration } from "../../../lib/pendingAdvertiserRegistration";
import type { AdvertiserProfileRow } from "../../../lib/supabase/types";
import { PasswordInput } from "../../../components/PasswordInput";

type Errors = Partial<Record<
  "fullName" | "brandName" | "email" | "password" | "phone" | "category" | "description" | "state" | "city" | "form",
  string
>>;

function BusinessRegisterInner() {
  const { session, signUp } = useAuth();
  const isActivating = !!session?.user;
  const searchParams = useSearchParams();
  const presetType = searchParams.get("type");

  const [alsoEnableArtist, setAlsoEnableArtist] = useState(() => {
    const capabilities = searchParams.getAll("capability");
    return capabilities.includes("artist");
  });
  const [fullName, setFullName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);
  const [savedProfile, setSavedProfile] = useState<AdvertiserProfileRow | null>(null);

  const cities = citiesForState(state);

  function validate(): Errors {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter the full name of the person creating this account.";
    if (!brandName.trim()) next.brandName = "Enter the business or brand name.";
    if (!isActivating) {
      if (!email.trim()) next.email = "Enter your email.";
      if (!password || password.length < 6) next.password = "Password must be at least 6 characters.";
    }
    if (!phone.trim()) next.phone = "Enter your phone number.";
    if (!category.trim()) next.category = "Enter a business category.";
    if (!description.trim()) next.description = "Add a short description of your business.";
    if (!state) next.state = "Select your state.";
    if (!city) next.city = "Select your city.";
    return next;
  }

  async function handleSubmit() {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      let userId: string | null;
      let hasSession: boolean;

      if (isActivating) {
        userId = session!.user.id;
        hasSession = true;
      } else {
        const { error: signUpError, userId: newUserId, hasSession: newHasSession } = await signUp(email.trim(), password);
        if (signUpError || !newUserId) {
          setErrors({ form: signUpError ?? "Sign up failed. Please try again." });
          return;
        }
        userId = newUserId;
        hasSession = newHasSession;
      }

      const registrationData = {
        accountType: "business" as const,
        isArtist: alsoEnableArtist,
        isBusiness: true,
        name: fullName.trim(),
        profileName: fullName.trim(),
        brandName: brandName.trim(),
        state,
        city,
        category: category.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        logoUrl: logoUrl.trim(),
        contact: contact.trim(),
        genre: "",
        spotifyUrl: "",
      };

      if (!hasSession) {
        savePendingAdvertiserRegistration(registrationData);
        setAwaitingEmailConfirm(true);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data: advertiserProfile, error: completeError } = await completeAdvertiserRegistration(supabase, {
        userId,
        advertiserType: "business",
        isArtist: alsoEnableArtist,
        isBusiness: true,
        name: fullName.trim(),
        profileName: fullName.trim(),
        brandName: brandName.trim(),
        country: "Nigeria",
        state,
        city,
        category: category.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        logoUrl: logoUrl.trim(),
        contactInfo: contact.trim(),
        spotifyUrl: "",
      });

      if (completeError || !advertiserProfile) {
        setErrors({ form: completeError ?? "Couldn't complete your business registration. Please try again." });
        return;
      }

      setSavedProfile(advertiserProfile);
      setSubmitted(true);
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
            We sent a confirmation link to <strong>{email}</strong>. Click it, then log in — Trender will finish
            setting up your business account automatically as soon as you do.
          </p>
          <Link className="btn" href="/login">Go to login</Link>
        </div>
      </main>
    );
  }

  if (submitted && savedProfile) {
    return (
      <main className="center">
        <div className="card card-pad" style={{ textAlign: "center", maxWidth: 480 }}>
          <h1>{isActivating ? "Profile activated" : "Account created"}</h1>
          <p className="muted">Your Business / Brand advertiser profile is ready.</p>
          <Link className="btn" href="/business">Go to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h1>{isActivating ? "Set up your Business / Brand profile" : "Create Business / Brand account"}</h1>
          <p className="muted">
            {isActivating
              ? `Continuing as ${session!.user.email}. This adds Business / Brand access to your existing Trender account — no new login needed.`
              : "Connected to real Supabase authentication."}
          </p>

          {errors.form && <div className="warning-box" style={{ marginBottom: 14 }}>{errors.form}</div>}

          <div className="field">
            <label>Advertiser capabilities</label>
            <button
              type="button"
              className={`target-option ${alsoEnableArtist ? "selected" : ""}`}
              onClick={() => setAlsoEnableArtist((current) => !current)}
            >
              <span className="radio-dot">{alsoEnableArtist ? "✓" : ""}</span>
              <div><strong>🎵 Artist capability</strong><span>Enable Artist access on the same account.</span></div>
            </button>
          </div>

          <div className="field">
            <label>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className="field">
            <label>Business / Brand name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            {errors.brandName && <span className="field-error">{errors.brandName}</span>}
          </div>

          {!isActivating && (
            <div className="grid grid-2">
              <div className="field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="field">
                <label>Password</label>
                <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
            </div>
          )}

          <div className="grid grid-2">
            <div className="field">
              <label>Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
            <div className="field">
              <label>Business category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} />
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>
          </div>

          <div className="field">
            <label>Business description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label>State</label>
              <select value={state} onChange={(e) => { setState(e.target.value); setCity(""); }}>
                <option value="">Select state</option>
                {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <span className="field-error">{errors.state}</span>}
            </div>
            <div className="field">
              <label>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!state}>
                <option value="">{state ? "Select city" : "Select state first"}</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>
          </div>

          <div className="field">
            <label>Website / social link (optional)</label>
            <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
          </div>

          <div className="field">
            <label>Contact information</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>

          <div className="field">
            <label>Logo / profile image URL (optional)</label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>

          <div className="form-actions">
            <button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : isActivating ? "Activate profile" : "Create account"}
            </button>
            <Link className="btn secondary" href={isActivating ? "/login" : "/choose-role"}>Back</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BusinessRegister() {
  return (
    <Suspense fallback={<main className="center"><p className="muted">Loading…</p></main>}>
      <BusinessRegisterInner />
    </Suspense>
  );
}
