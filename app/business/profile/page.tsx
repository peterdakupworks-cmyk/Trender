"use client";

import { useEffect, useState } from "react";
import { AppNav } from "../../../components/AppNav";
import { useAuth } from "../../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

export default function BusinessProfile() {
  const { user, profile, loading, refreshProfile } = useAuth();

  const [brandName, setBrandName] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState("Pending");
  const [accountStatus, setAccountStatus] = useState("Active");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setAvatarUrl(profile.profile_image_url ?? null);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseBrowserClient();
    supabase
      .from("advertiser_profiles")
      .select("brand_name, description, contact_info, logo_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const advertiserProfile = data as {
          brand_name?: string | null;
          description?: string | null;
          contact_info?: string | null;
          logo_url?: string | null;
        } | null;

        if (advertiserProfile) {
          setBrandName(advertiserProfile.brand_name ?? "");
          setBio(advertiserProfile.description ?? "");
          setContactInfo(advertiserProfile.contact_info ?? "");
          setAvatarUrl(advertiserProfile.logo_url ?? profile?.profile_image_url ?? null);
        }
      });

    // Keep verification/account status visible but read-only.
    setVerificationStatus("Pending");
    setAccountStatus("Active");
  }, [user, profile]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }

    setAvatarError("");
    setUploadingAvatar(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/business-avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) {
        setAvatarError(`Upload failed: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("advertiser_profiles").upsert({
        user_id: user.id,
        advertiser_type: "business",
        brand_name: brandName || "Business / Brand",
        logo_url: data.publicUrl,
        description: bio || null,
        contact_info: contactInfo || null,
      }, { onConflict: "user_id" });
      await refreshProfile();
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName || profile?.full_name, profile_image_url: avatarUrl })
        .eq("id", user.id);

      if (profileError) {
        setSaveError(`Couldn't save your profile: ${profileError.message}`);
        return;
      }

      const { error: advertiserError } = await supabase
        .from("advertiser_profiles")
        .upsert(
          {
            user_id: user.id,
            advertiser_type: "business",
            brand_name: brandName || profile?.full_name || "Business / Brand",
            logo_url: avatarUrl || null,
            description: bio || null,
            contact_info: contactInfo || null,
          },
          { onConflict: "user_id" }
        );

      if (advertiserError) {
        setSaveError(`Couldn't save your business profile: ${advertiserError.message}`);
        return;
      }

      setSaved(true);
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <AppNav role="business" />
        <main className="page"><div className="container"><p className="muted">Loading your business profile…</p></div></main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppNav role="business" />
        <main className="page"><div className="container"><p className="muted">Log in to view your business profile.</p></div></main>
      </>
    );
  }

  return (
    <>
      <AppNav role="business" />
      <main className="page">
        <div className="container">
          <div className="form">
            <div className="card card-pad">
              <h1>Business / Brand Profile</h1>
              <p className="muted">Update the public-facing business profile shown to creators.</p>

              <div className="field">
                <label>Profile picture / business logo</label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Business logo" style={{ width: 72, height: 72, borderRadius: "12px", objectFit: "cover", border: "1px solid var(--border)" }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 12, background: "rgba(255,255,255,.06)" }} />
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </div>
                {uploadingAvatar && <span className="muted" style={{ fontSize: 12 }}>Uploading…</span>}
                {avatarError && <span className="field-error">{avatarError}</span>}
              </div>

              <div className="field">
                <label>Business / Brand name</label>
                <input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              </div>

              <div className="field">
                <label>Full name of account owner</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className="field">
                <label>Bio / business description</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>

              <div className="field">
                <label>Contact information</label>
                <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
              </div>

              <div className="notice">
                Verification status: <strong>{verificationStatus}</strong> · Account status: <strong>{accountStatus}</strong>
              </div>

              {saveError && <div className="warning-box">{saveError}</div>}
              {saved && <div className="notice">✅ Business profile saved.</div>}

              <button className="btn" type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
