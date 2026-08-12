"use client";

import { NIGERIA_STATES, citiesForState } from "../lib/locations";

export type TargetScope = "city" | "nigeria";

type Props = {
  scope: TargetScope;
  state: string;
  city: string;
  onScopeChange: (scope: TargetScope) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  /** Shown when the person tries to publish a city campaign without picking both fields. */
  showLocationError?: boolean;
};

/**
 * The core "where should this campaign run?" picker.
 * This is the ONLY location-targeting UI — do not render a second copy of this
 * alongside it. Earlier versions of this screen showed two separate pickers.
 */
export function LocationTargeting({
  scope,
  state,
  city,
  onScopeChange,
  onStateChange,
  onCityChange,
  showLocationError = false,
}: Props) {
  const cities = citiesForState(state);
  const summary =
    scope === "nigeria"
      ? "Eligible creators across Nigeria"
      : city && state
      ? `Eligible creators in ${city}, ${state}`
      : "Select a state and city to see eligible creators";

  return (
    <section className="location-targeting card" aria-label="Campaign location targeting">
      <div className="location-heading">
        <div>
          <span className="eyebrow">CORE TARGETING</span>
          <h3>Where should this campaign run?</h3>
          <p className="muted">
            Choose a city for local reach or Nigeria for nationwide distribution.
          </p>
        </div>
        <span className="location-icon" aria-hidden>⌖</span>
      </div>

      <div className="target-options">
        <button
          type="button"
          className={`target-option ${scope === "city" ? "selected" : ""}`}
          onClick={() => onScopeChange("city")}
        >
          <span className="radio-dot">{scope === "city" ? "✓" : ""}</span>
          <div>
            <strong>Specific City</strong>
            <span>Show the task to eligible creators in one city/state.</span>
          </div>
        </button>

        <button
          type="button"
          className={`target-option ${scope === "nigeria" ? "selected" : ""}`}
          onClick={() => onScopeChange("nigeria")}
        >
          <span className="radio-dot">{scope === "nigeria" ? "✓" : ""}</span>
          <div>
            <strong>All Nigeria</strong>
            <span>Open the campaign to eligible creators nationwide.</span>
          </div>
        </button>
      </div>

      {scope === "city" ? (
        <div className="grid grid-2 target-fields">
          <div className="field">
            <label>State</label>
            <select
              value={state}
              onChange={(e) => {
                const nextState = e.target.value;
                onStateChange(nextState);
                // Reset city whenever state changes so we never show a
                // city that doesn't belong to the newly selected state.
                onCityChange("");
              }}
            >
              <option value="">Select state</option>
              {NIGERIA_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>City</label>
            <select
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              disabled={!state}
            >
              <option value="">{state ? "Select city" : "Select state first"}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="nationwide">
          <strong>🇳🇬 Nigeria-wide campaign</strong>
          <span>Eligible creators from Abuja, Lagos, Port Harcourt, Jos and other Nigerian cities can receive this task.</span>
        </div>
      )}

      {showLocationError && (
        <div className="warning-box" role="alert">
          Please select both a state and a city before publishing a city-targeted campaign.
        </div>
      )}

      <div className="distribution-preview">
        <span>Distribution preview</span>
        <strong>{scope === "nigeria" ? "🇳🇬" : "📍"} {summary}</strong>
      </div>
    </section>
  );
}
