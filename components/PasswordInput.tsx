"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
};

/** Password input with a show/hide eye toggle. Purely presentational — no effect on validation, Supabase auth, or how the password is transmitted/stored. */
export function PasswordInput({ value, onChange, placeholder, autoComplete }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          lineHeight: 0,
          color: "var(--muted)",
          fontSize: 16,
        }}
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
