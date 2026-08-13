"use client";

import { useEffect, useState } from "react";
import { AppNav } from "../../../components/AppNav";
import { useAuth } from "../../../contexts/AuthProvider";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

export default function Profile() {
  const { user, profile, loading, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [creatorStatus, setCreatorStatus] = useState<{
    identity_status: string;
    account_status: string;
    follower_count: number;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name ?? "");
      setUsername(profile.username ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    getSupabaseBrowserClient()
      .from("creator_profiles")
      .select("identity_status, account_status, follower_count")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setCreatorStatus(data);
      });
  }, [user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be 5MB or smaller.");
      return;
    }
    setAvatarError("");
    setUploadingAvatar(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop() || "jpg";
      // Fixed filename per user (not per-upload) so "replace" overwrites in
      // place via upsert, rather than accumulating orphaned old files.
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) {
        setAvatarError(`Upload failed: ${uploadError.message}`);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ profile_image_url: data.publicUrl }).eq("id", user.id);
      await refreshProfile();
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
      const { error } = await supabase.from("profiles").update({ username, bio }).eq("id", user.id);
      if (error) {
        const msg = error.message.toLowerCase();
        setSaveError(msg.includes("unique") ? "That username is already taken." : `Couldn't save your profile: ${error.message}`);
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
        <AppNav role="creator" />
        <main className="page"><div className="container"><p className="muted">Loading your profile…</p></div></main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppNav role="creator" />
        <main className="page"><div className="container"><p className="muted">Log in to view your profile.</p></div></main>
      </>
    );
  }

  return (
    <>
      <AppNav role="creator" />
      <main className="page">
        <div className="container">
          <div className="form">
            <div className="card card-pad">
              <h1>Creator Profile</h1>
              <p className="muted">Keep your creator information current so campaigns can match you correctly.</p>

              <div className="field">
                <label>Profile picture</label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {profile?.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profile_image_url} alt="Profile" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </div>
                {uploadingAvatar && <span className="muted" style={{ fontSize: 12 }}>Uploading…</span>}
                {avatarError && <span className="field-error">{avatarError}</span>}
              </div>

              <div className="field">
                <label>Full name</label>
                <input value={displayName} readOnly />
              </div>

              <div className="field">
                <label>Username</label>
                <input value={username} onChange={(e) => { setUsername(e.target.value); setSaved(false); }} />
              </div>

              <div className="field">
                <label>Bio</label>
                <textarea value={bio} onChange={(e) => { setBio(e.target.value); setSaved(false); }} />
              </div>

              <div className="notice">
                Verification status: <strong>{creatorStatus?.identity_status ?? "…"}</strong> · Account status:{" "}
                <strong>{creatorStatus?.account_status ?? "…"}</strong> · Submitted followers:{" "}
                <strong>{creatorStatus?.follower_count ?? "…"}</strong>
                <br />
                Instagram/TikTok links and follower count are set at registration and can't be edited here yet.
              </div>

              {saveError && <div className="warning-box">{saveError}</div>}
              {saved && <div className="notice">✅ Profile saved.</div>}

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
