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
import type { AdvertiserProfileRow, AdvertiserType } from "../../../lib/supabase/types";
import { PasswordInput } from "../../../components/PasswordInput";

type Errors = Partial<Record<
  "name" | "email" | "password" | "genre" | "category" | "description" | "state" | "city" | "form", string
>>;

function ArtistRegisterInner() {
  const { session, signUp } = useAuth();
  const isActivating = !!session?.user;
  const searchParams = useSearchParams();
  const presetType = searchParams.get("type");

  const [accountType, setAccountType] = useState<AdvertiserType>(presetType === "business" ? "business" : "music");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");

  const [genre, setGenre] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
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
    if (!name.trim()) next.name = accountType === "music" ? "Enter your artist name." : "Enter your business/brand name.";
    if (!isActivating) {
      if (!email.trim()) next.email = "Enter your email.";
      if (!password || password.length < 6) next.password = "Password must be at least 6 characters.";
    }
    if (accountType === "music" && !genre.trim()) next.genre = "Enter a genre.";
    if (accountType === "business") {
      if (!category.trim()) next.category = "Enter a business category.";
      if (!description.trim()) next.description = "Add a short description of your business.";
      if (!state) next.state = "Select your state.";
      if (!city) next.city = "Select your city.";
    }
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
        // Adding Artist/Business capability to an already-authenticated
        // account — same Supabase Auth identity, no new signup, no new password.
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
        accountType,
        name: name.trim(),
        state,
        city,
        category: category.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        logoUrl: logoUrl.trim(),
        contact: contact.trim(),
        genre: genre.trim(),
        spotifyUrl: spotifyUrl.trim(),
      };

      if (!hasSession) {
        // Email confirmation required before a session exists — writing the
        // advertiser profile now would fail RLS. Save the (non-secret) form
        // data so AuthProvider finishes registration automatically once the
        // user confirms their email and logs in (same pattern as Creator
        // registration).
        savePendingAdvertiserRegistration(registrationData);
        setAwaitingEmailConfirm(true);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data: advertiserProfile, error: completeError } = await completeAdvertiserRegistration(supabase, {
        userId,
        advertiserType: accountType,
        name: registrationData.name,
        country: "Nigeria",
        state: registrationData.state,
        city: registrationData.city,
        category: registrationData.category,
        description: registrationData.description,
        websiteUrl: registrationData.websiteUrl,
        logoUrl: registrationData.logoUrl,
        contactInfo: registrationData.contact,
        spotifyUrl: registrationData.spotifyUrl,
      });

      if (completeError || !advertiserProfile) {
        setErrors({ form: completeError ?? "Couldn't complete your advertiser registration. Please try again." });
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
            setting up your advertiser profile automatically as soon as you do.
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
          <p className="muted">
            Your {savedProfile.advertiser_type === "music" ? "Artist" : "Business/Brand"} advertiser profile is ready.
          </p>
          <Link className="btn" href="/artist">Go to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h1>{isActivating ? "Set up your advertiser profile" : "Create advertiser account"}</h1>
          <p className="muted">
            {isActivating
              ? `Continuing as ${session!.user.email}. This adds Artist/Business access to your existing Trender account — no new login needed.`
              : "Connected to real Supabase authentication."}
          </p>

          {errors.form && <div className="warning-box" style={{ marginBottom: 14 }}>{errors.form}</div>}

          <div className="field">
            <label>Account type</label>
            <div className="grid grid-2">
              <button type="button" className={`target-option ${accountType === "music" ? "selected" : ""}`} onClick={() => setAccountType("music")}>
                <span className="radio-dot">{accountType === "music" ? "✓" : ""}</span>
                <div><strong>🎵 Music Artist</strong><span>Promote songs and connect Spotify.</span></div>
              </button>
              <button type="button" className={`target-option ${accountType === "business" ? "selected" : ""}`} onClick={() => setAccountType("business")}>
                <span className="radio-dot">{accountType === "business" ? "✓" : ""}</span>
                <div><strong>🏢 Business / Brand</strong><span>Promote a product, service, or location.</span></div>
              </button>
            </div>
          </div>

          <div className="field">
            <label>{accountType === "music" ? "Artist name" : "Business / brand name"}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <span className="field-error">{errors.name}</span>}
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

          {accountType === "music" ? (
            <>
              <div className="field">
                <label>Genre</label>
                <input value={genre} onChange={(e) => setGenre(e.target.value)} />
                {errors.genre && <span className="field-error">{errors.genre}</span>}
              </div>
              <div className="field">
                <label>Spotify link</label>
                <input value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label>Category</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} />
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>
              <div className="field">
                <label>Description</label>
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
                <label>Website / social link</label>
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
              </div>
              <div className="field">
                <label>Logo / profile image URL (optional)</label>
                <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
              </div>
            </>
          )}

          <div className="field">
            <label>Contact information</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} />
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

export default function ArtistRegister() {
  return (
    <Suspense fallback={<main className="center"><p className="muted">Loading…</p></main>}>
      <ArtistRegisterInner />
    </Suspense>
  );
}
