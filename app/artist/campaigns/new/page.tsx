"use client";

import Link from "next/link";
import { useState } from "react";
import { AppNav } from "../../../../components/AppNav";
import { LocationTargeting, TargetScope } from "../../../../components/LocationTargeting";
import { CREATOR_TIERS, CreatorTierId, CampaignType, computeCampaignPricing, CreatorMixItem } from "../../../../lib/mock";

const MAX_VIDEO_SECONDS = 24;

type MixState = Record<CreatorTierId, { included: boolean; count: number }>;

const initialMix: MixState = CREATOR_TIERS.reduce((acc, t) => {
  acc[t.id] = { included: false, count: 0 };
  return acc;
}, {} as MixState);

type FormErrors = Partial<
  Record<
    "advertiser" | "title" | "spotify" | "offer" | "category" | "requirements" | "location" | "mix" | "budget" | "video",
    string
  >
>;

export default function NewCampaign() {
  const [campaignType, setCampaignType] = useState<CampaignType>("music");

  const [advertiser, setAdvertiser] = useState("");
  const [title, setTitle] = useState("");
  const [spotify, setSpotify] = useState("");
  const [offer, setOffer] = useState("");
  const [category, setCategory] = useState("");
  const [requirements, setRequirements] = useState("");
  const [budget, setBudget] = useState("");

  // Business campaign media
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoError, setVideoError] = useState("");

  const [scope, setScope] = useState<TargetScope>("city");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [mix, setMix] = useState<MixState>(initialMix);

  const [errors, setErrors] = useState<FormErrors>({});
  const [published, setPublished] = useState(false);

  const includedTiers = CREATOR_TIERS.filter((t) => mix[t.id].included && mix[t.id].count > 0);
  const mixItems: CreatorMixItem[] = includedTiers.map((t) => ({ tierId: t.id, count: mix[t.id].count }));
  const totalCreators = mixItems.reduce((sum, m) => sum + m.count, 0);
  const pricing = computeCampaignPricing(mixItems);
  const budgetNumber = Number(budget) || 0;
  const remainingBudget = budgetNumber - pricing.creatorAllocation;

  function updateMix(tierId: CreatorTierId, patch: Partial<{ included: boolean; count: number }>) {
    setMix((prev) => ({ ...prev, [tierId]: { ...prev[tierId], ...patch } }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);

    // Probe duration client-side using a detached <video> element before accepting the file.
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = objectUrl;
    probe.onloadedmetadata = () => {
      const duration = probe.duration;
      if (duration > MAX_VIDEO_SECONDS) {
        setVideoError(`Video must be ${MAX_VIDEO_SECONDS} seconds or less. This video is ${Math.round(duration)}s.`);
        setVideoPreview(null);
        setVideoDuration(null);
        URL.revokeObjectURL(objectUrl);
        e.target.value = "";
      } else {
        setVideoError("");
        setVideoDuration(Math.round(duration));
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setVideoPreview(objectUrl);
      }
    };
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!advertiser.trim()) next.advertiser = campaignType === "music" ? "Enter the artist name." : "Enter the business/brand name.";
    if (!title.trim()) next.title = "Campaign title is required.";
    if (campaignType === "music" && !spotify.trim()) next.spotify = "Add a Spotify link so creators know what to listen to.";
    if (campaignType === "business" && !offer.trim()) next.offer = "Describe the product, service, or offer.";
    if (!category.trim()) next.category = "Category is required.";
    if (!requirements.trim()) next.requirements = "Tell creators what to post.";
    if (!budget || budgetNumber <= 0) next.budget = "Enter a campaign budget greater than 0.";
    if (scope === "city" && (!state || !city)) {
      next.location = "Select both a state and a city, or switch to All Nigeria.";
    }
    if (totalCreators === 0) {
      next.mix = "Select at least one creator tier and enter how many creators you need.";
    }
    if (videoError) next.video = videoError;
    if (budgetNumber > 0 && pricing.creatorAllocation > budgetNumber) {
      next.budget = `Creator allocation (₦${pricing.creatorAllocation.toLocaleString()}) exceeds your campaign budget. Reduce creator quantities or increase your budget.`;
    }
    return next;
  }

  function handleSaveDraft() {
    // Drafts are allowed to be incomplete — no validation required.
    setPublished(false);
    alert("Draft saved locally. (No backend is connected yet — this will save to Supabase in Phase 3.)");
  }

  function handlePublish() {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setPublished(false);
      return;
    }
    setPublished(true);
  }

  return (
    <>
      <AppNav role="artist" />
      <main className="page">
        <div className="container">
          <div className="form">
            <div className="card card-pad">
              <h1>Create Campaign</h1>
              <p className="muted">Set your budget, creator mix, and audience before you publish.</p>

              <div className="field">
                <label>Campaign type</label>
                <div className="grid grid-2">
                  <button
                    type="button"
                    className={`target-option ${campaignType === "music" ? "selected" : ""}`}
                    onClick={() => setCampaignType("music")}
                  >
                    <span className="radio-dot">{campaignType === "music" ? "✓" : ""}</span>
                    <div>
                      <strong>🎵 Music Campaign</strong>
                      <span>Artist promotion, requires a Spotify link.</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`target-option ${campaignType === "business" ? "selected" : ""}`}
                    onClick={() => setCampaignType("business")}
                  >
                    <span className="radio-dot">{campaignType === "business" ? "✓" : ""}</span>
                    <div>
                      <strong>🏢 Business / Brand Campaign</strong>
                      <span>Product, service, or location promotion. No Spotify step.</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="field">
                <label>{campaignType === "music" ? "Artist name" : "Business / brand name"}</label>
                <input
                  placeholder={campaignType === "music" ? "e.g. Kola Waves" : "e.g. Suya Spot Abuja"}
                  value={advertiser}
                  onChange={(e) => setAdvertiser(e.target.value)}
                />
                {errors.advertiser && <span className="field-error">{errors.advertiser}</span>}
              </div>

              <div className="field">
                <label>Campaign title</label>
                <input
                  placeholder={campaignType === "music" ? "e.g. New Single Promo" : "e.g. Grand Opening"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && <span className="field-error">{errors.title}</span>}
              </div>

              <div className="field">
                <label>Category</label>
                <input
                  placeholder="Music, fashion, restaurant, event, etc."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              {campaignType === "music" ? (
                <div className="field">
                  <label>Spotify link</label>
                  <input
                    placeholder="https://open.spotify.com/track/..."
                    value={spotify}
                    onChange={(e) => setSpotify(e.target.value)}
                  />
                  {errors.spotify && <span className="field-error">{errors.spotify}</span>}
                  <span className="muted" style={{ fontSize: 12 }}>
                    Spotify is not connected to real credentials yet — this link is passed through to creators as-is.
                  </span>
                </div>
              ) : (
                <>
                  <div className="field">
                    <label>Product / service / offer</label>
                    <textarea
                      placeholder="What are you promoting, and what does the creator get? (product, food, location, service, offer, etc.)"
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                    />
                    {errors.offer && <span className="field-error">{errors.offer}</span>}
                  </div>

                  <div className="grid grid-2">
                    <div className="field">
                      <label>Promotional image (optional)</label>
                      <input type="file" accept="image/*" onChange={handleImageChange} />
                      {imagePreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview}
                          alt="Promotional preview"
                          style={{ marginTop: 10, maxWidth: "100%", borderRadius: 12, border: "1px solid var(--border)" }}
                        />
                      )}
                    </div>
                    <div className="field">
                      <label>Promotional video, max {MAX_VIDEO_SECONDS}s (optional)</label>
                      <input type="file" accept="video/*" onChange={handleVideoChange} />
                      {videoError && <span className="field-error">{videoError}</span>}
                      {videoPreview && !videoError && (
                        <>
                          <video src={videoPreview} controls style={{ marginTop: 10, maxWidth: "100%", borderRadius: 12, border: "1px solid var(--border)" }} />
                          <span className="muted" style={{ fontSize: 12 }}>Duration: {videoDuration}s — OK</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="notice">
                    Spotify is not required for business/brand campaigns. One image and one video (24 seconds max) can represent your product, food, location, service, offer, or flyer.
                  </div>
                </>
              )}

              <div className="field">
                <label>Creator requirements</label>
                <textarea
                  placeholder="Describe exactly what creators should post."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
                {errors.requirements && <span className="field-error">{errors.requirements}</span>}
              </div>

              <section className="card card-pad" style={{ marginTop: 18 }}>
                <span className="eyebrow">CREATOR TIERS &amp; QUANTITIES</span>
                <h3 style={{ marginTop: 6 }}>How many creators do you want, and from which tiers?</h3>
                <p className="muted">
                  Select one or more tiers and enter how many creators you need from each. The creator allocation
                  updates automatically — you don't need to spend your whole budget on one tier. You'll set your
                  budget and see the Trender Platform Fee after choosing your location.
                </p>

                <div className="grid" style={{ marginTop: 14 }}>
                  {CREATOR_TIERS.map((t) => {
                    const row = mix[t.id];
                    const allocation = row.count * t.ratePerCreator;
                    return (
                      <div key={t.id} className="campaign" style={{ alignItems: "center" }}>
                        <label style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={row.included}
                            onChange={(e) => updateMix(t.id, { included: e.target.checked, count: e.target.checked ? row.count : 0 })}
                            style={{ width: 18, height: 18 }}
                          />
                          <span>
                            <strong style={{ display: "block" }}>{t.name}</strong>
                            <span className="muted" style={{ fontSize: 13 }}>
                              {t.followerRange} · ₦{t.ratePerCreator.toLocaleString()} per creator
                            </span>
                          </span>
                        </label>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input
                            type="number"
                            min={0}
                            disabled={!row.included}
                            value={row.count || ""}
                            placeholder="0"
                            onChange={(e) => updateMix(t.id, { count: Math.max(0, Number(e.target.value)) })}
                            style={{
                              width: 80,
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                              background: "#0f0b15",
                              color: "var(--text)",
                            }}
                          />
                          <span className="muted" style={{ minWidth: 90, textAlign: "right" }}>
                            ₦{allocation.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {errors.mix && <span className="field-error">{errors.mix}</span>}

                <div className="distribution-preview" style={{ marginTop: 18 }}>
                  <span>Creator mix summary</span>
                  <strong style={{ display: "block", marginTop: 6 }}>
                    {includedTiers.length === 0
                      ? "No creator tiers selected yet"
                      : includedTiers.map((t) => `${t.name} — ${mix[t.id].count} creators`).join(" · ")}
                  </strong>
                  <div className="grid grid-2" style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted">Total creators</span>
                      <strong>{totalCreators}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted">Creator Allocation</span>
                      <strong>₦{pricing.creatorAllocation.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </section>

              <LocationTargeting
                scope={scope}
                state={state}
                city={city}
                onScopeChange={(s) => {
                  setScope(s);
                  if (s === "nigeria") {
                    setState("");
                    setCity("");
                  }
                }}
                onStateChange={setState}
                onCityChange={setCity}
                showLocationError={!!errors.location}
              />

              <div className="field" style={{ marginTop: 18 }}>
                <label>Campaign budget (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
                {errors.budget && <span className="field-error">{errors.budget}</span>}
              </div>

              <section className="card card-pad" style={{ marginTop: 18 }}>
                <span className="eyebrow">PLATFORM FEE &amp; TOTAL</span>
                <h3 style={{ marginTop: 6 }}>What you'll pay</h3>
                <div className="grid" style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">Creator Allocation</span>
                    <strong>₦{pricing.creatorAllocation.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">Trender Platform Fee (7.5%)</span>
                    <strong>₦{pricing.platformFee.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
                    <span>Total Amount Payable</span>
                    <strong style={{ fontSize: 20 }}>₦{pricing.totalPayable.toLocaleString()}</strong>
                  </div>
                  {budgetNumber > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted">Remaining vs. budget</span>
                      <strong style={{ color: remainingBudget < 0 ? "var(--danger)" : "inherit" }}>
                        ₦{remainingBudget.toLocaleString()}
                      </strong>
                    </div>
                  )}
                </div>
              </section>

              <div className="notice" style={{ marginTop: 18 }}>
                ⏱️ Creators have 48 hours after claiming this campaign to create and submit their content.
              </div>

              <div className="notice">
                Location matching will be enforced server-side when Supabase is connected. Creators must have a verified city/state on their profile.
              </div>
              <div className="warning-box">
                Payment is intentionally not connected in this MVP. Do not enter real payment credentials.
              </div>

              {published && (
                <div className="notice" role="status">
                  ✅ Campaign is valid and ready to publish: {totalCreators} creators across {includedTiers.length} tier{includedTiers.length === 1 ? "" : "s"}.
                  Creator allocation ₦{pricing.creatorAllocation.toLocaleString()} + Platform Fee ₦{pricing.platformFee.toLocaleString()} = Total ₦{pricing.totalPayable.toLocaleString()}.
                  (Not yet saved anywhere — this will write to Supabase once Phase 3 is connected.)
                </div>
              )}

              <div className="form-actions">
                <button className="btn" onClick={handlePublish} type="button">
                  Publish campaign
                </button>
                <button className="btn secondary" onClick={handleSaveDraft} type="button">
                  Save draft
                </button>
                <Link className="btn secondary" href="/artist">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
