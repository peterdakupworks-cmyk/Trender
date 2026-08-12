"use client";

import Link from "next/link";
import { useState } from "react";
import { Brand } from "../../../components/Brand";
import { NIGERIA_STATES, citiesForState } from "../../../lib/locations";
import { isValidSocialUrl, normalizeSocialInput } from "../../../lib/socialValidation";
import { useAuth } from "../../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { completeCreatorRegistration } from "../../../lib/supabase/creatorRegistration";
import { savePendingCreatorRegistration } from "../../../lib/pendingCreatorRegistration";
import type { CreatorProfileRow } from "../../../lib/supabase/types";
import { PasswordInput } from "../../../components/PasswordInput";

const NICHES = ["Music", "Fashion", "Comedy", "Lifestyle", "Fitness", "Other"];
const MIN_FOLLOWERS = 500;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

type Errors = Partial<Record<
  "fullName" | "username" | "email" | "password" | "phone" | "state" | "city" |
  "instagram" | "tiktok" | "followers" | "avatar" | "form", string
>>;

export default function CreatorRegister() {
  const { session, signUp } = useAuth();
  const isActivating = !!session?.user;

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [followers, setFollowers] = useState("");
  const [niche, setNiche] = useState(NICHES[0]);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);
  const [savedProfile, setSavedProfile] = useState<CreatorProfileRow | null>(null);

  const cities = citiesForState(state);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatar: "Please choose an image file." }));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setErrors((prev) => ({ ...prev, avatar: "Image must be 5MB or smaller." }));
      return;
    }
    setErrors((prev) => ({ ...prev, avatar: undefined }));
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!username.trim()) next.username = "Choose a username.";
    if (!isActivating) {
      if (!email.trim()) next.email = "Enter your email.";
      if (!password || password.length < 6) next.password = "Password must be at least 6 characters.";
    }
    if (!phone.trim()) next.phone = "Enter your phone number.";
    if (!state) next.state = "Select your state.";
    if (!city) next.city = "Select your city.";
    if (!instagram.trim()) next.instagram = "Instagram is required.";
    else if (!isValidSocialUrl("instagram", instagram)) next.instagram = "Enter a valid Instagram profile link, e.g. instagram.com/yourname.";
    if (!tiktok.trim()) next.tiktok = "TikTok is required.";
    else if (!isValidSocialUrl("tiktok", tiktok)) next.tiktok = "Enter a valid TikTok profile link, e.g. tiktok.com/@yourname.";
    if (!followers || Number(followers) < 0) next.followers = "Enter your follower count.";
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
        // Adding Creator capability to an already-authenticated account —
        // same Supabase Auth identity, no new signup, no new password.
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
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        country: "Nigeria",
        state,
        city,
        instagramUrl: normalizeSocialInput("instagram", instagram),
        tiktokUrl: normalizeSocialInput("tiktok", tiktok),
        submittedFollowerCount: Number(followers),
      };

      if (!hasSession) {
        // This Supabase project requires email confirmation before a
        // session exists — writing the creator profile now would fail RLS
        // (there's no authenticated user yet). Save the (non-secret) form
        // data so AuthProvider finishes registration automatically the
        // moment the user confirms their email and logs in.
        savePendingCreatorRegistration(registrationData);
        setAwaitingEmailConfirm(true);
        return;
      }

      const supabase = getSupabaseBrowserClient();

      // Avatar upload is independent of the atomic registration RPC below —
      // if it fails, we still want the rest of registration to succeed.
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (uploadError) {
          setErrors({ form: "Your profile picture failed to upload — you can add one later from your profile. Continuing with the rest of registration." });
        } else {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = data.publicUrl;
          await supabase.from("profiles").update({ profile_image_url: avatarUrl }).eq("id", userId);
        }
      }

      // Everything else — profile fields, both required social accounts, and
      // the creator_profiles row — happens in ONE atomic database call. See
      // supabase/migrations/0004_atomic_creator_registration.sql for why
      // this has to be atomic rather than three separate insert calls.
      const { data: creatorProfile, error: completeError } = await completeCreatorRegistration(supabase, registrationData);

      if (completeError || !creatorProfile) {
        setErrors({ form: completeError ?? "Couldn't complete your creator registration. Please try again." });
        return; // Do NOT show the success screen — nothing was confirmed saved.
      }

      // Success is shown ONLY from the row Postgres actually returned —
      // never a hardcoded string — so the UI can't claim "pending" if the
      // database didn't really save it.
      setSavedProfile(creatorProfile);
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
            setting up your creator profile automatically as soon as you do.
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
          <span className="badge warning">{savedProfile.identity_status}</span>
          <h1>Account submitted</h1>
          <p className="muted">
            Your creator account has been submitted for verification. You will be notified when your account is
            approved. You can explore Trender in the meantime, but campaigns that require a verified creator won't
            be available yet.
          </p>
          <Link className="btn" href="/creator">Continue to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="center">
      <div className="form">
        <Brand />
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h1>{isActivating ? "Set up your Creator profile" : "Create creator account"}</h1>
          <p className="muted">
            {isActivating
              ? `Continuing as ${session!.user.email}. This adds Creator access to your existing Trender account — no new login needed.`
              : "Connected to real Supabase authentication. Your account starts as Pending Verification."}
          </p>

          {errors.form && <div className="warning-box" style={{ marginBottom: 14 }}>{errors.form}</div>}

          <h3>Basic information</h3>
          <div className="field">
            <label>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
            <div className="field">
              <label>Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
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

          <h3 style={{ marginTop: 18 }}>Profile picture</h3>
          <div className="field">
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            {errors.avatar && <span className="field-error">{errors.avatar}</span>}
            {avatarPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Avatar preview" style={{ marginTop: 10, width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
            )}
          </div>

          <h3 style={{ marginTop: 18 }}>Location</h3>
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

          <h3 style={{ marginTop: 18 }}>Social accounts (both required)</h3>
          <div className="field">
            <label>Instagram — enter your profile link</label>
            <input placeholder="instagram.com/yourname" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            {errors.instagram && <span className="field-error">{errors.instagram}</span>}
          </div>
          <div className="field">
            <label>TikTok — enter your profile link</label>
            <input placeholder="tiktok.com/@yourname" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
            {errors.tiktok && <span className="field-error">{errors.tiktok}</span>}
          </div>

          <h3 style={{ marginTop: 18 }}>Follower information</h3>
          <div className="field">
            <label>Follower count (your most-followed platform)</label>
            <input type="number" min={0} value={followers} onChange={(e) => setFollowers(e.target.value)} />
            {errors.followers && <span className="field-error">{errors.followers}</span>}
            <span className="muted" style={{ fontSize: 12 }}>
              This is stored as your submitted count, not a verified one, until Trender reviews your account.
            </span>
          </div>

          <div className="field">
            <label>Niche</label>
            <select value={niche} onChange={(e) => setNiche(e.target.value)}>
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>

          <div className="notice">
            Creators must have at least {MIN_FOLLOWERS} followers to participate in Trender campaigns.
          </div>

          <div className="form-actions">
            <button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : isActivating ? "Activate Creator profile" : "Create account"}
            </button>
            <Link className="btn secondary" href={isActivating ? "/login" : "/choose-role"}>Back</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
