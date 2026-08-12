"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import type { ProfileRow } from "../lib/supabase/types";
import { resolveAndCheckCreatorCapability } from "../lib/supabase/creatorRegistration";
import { completeAdvertiserRegistration } from "../lib/supabase/advertiserRegistration";
import { getPendingAdvertiserRegistration, clearPendingAdvertiserRegistration } from "../lib/pendingAdvertiserRegistration";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; userId: string | null; hasSession: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists.";
  if (m.includes("password") && m.includes("least")) return "Password is too short — Supabase requires at least 6 characters.";
  if (m.includes("email") && m.includes("invalid")) return "That doesn't look like a valid email address.";
  if (m.includes("network") || m.includes("fetch")) return "Couldn't reach Trender's servers. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (fetchError) {
        setError("Couldn't load your profile. Please refresh the page.");
        return;
      }
      setProfile(data as ProfileRow);

      // If this browser has a registration that was filled in but never
      // completed (most commonly: the Supabase project requires email
      // confirmation, so no session existed yet at signup time), finish it
      // now that we have a real, authenticated session. Safe to call even if
      // registration already completed — completion is idempotent
      // (upsert-based). Gated on which pending data exists, not on
      // profile.role — a single account can hold multiple capabilities, so
      // role alone can't tell us which registration was in flight.
      const { hasProfile: creatorResolved } = await resolveAndCheckCreatorCapability(supabase, userId);
      if (creatorResolved) {
        const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", userId).single();
        if (refreshed) setProfile(refreshed as ProfileRow);
      }
      // If resolution failed, we deliberately leave the pending data in
      // place (handled inside the helper) so it's retried next time a
      // session loads, instead of silently losing what was typed.

      const pendingAdvertiser = getPendingAdvertiserRegistration();
      if (pendingAdvertiser) {
        const { error: completeError } = await completeAdvertiserRegistration(supabase, {
          userId,
          advertiserType: pendingAdvertiser.accountType,
          name: pendingAdvertiser.name,
          country: "Nigeria",
          state: pendingAdvertiser.state,
          city: pendingAdvertiser.city,
          category: pendingAdvertiser.category,
          description: pendingAdvertiser.description,
          websiteUrl: pendingAdvertiser.websiteUrl,
          logoUrl: pendingAdvertiser.logoUrl,
          contactInfo: pendingAdvertiser.contact,
          spotifyUrl: pendingAdvertiser.spotifyUrl,
        });
        if (!completeError) {
          clearPendingAdvertiserRegistration();
        }
      }
    } catch {
      setConfigError("Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
    }
  }, []);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      setConfigError("Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  async function signUp(email: string, password: string) {
    setError(null);
    if (configError) return { error: configError, userId: null, hasSession: false };
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        const friendly = friendlyAuthError(signUpError.message);
        setError(friendly);
        return { error: friendly, userId: null, hasSession: false };
      }
      // A `profiles` row is created automatically by a database trigger
      // (see supabase/migrations/0001_phase3a_foundation.sql) as soon as
      // the auth.users row exists — no manual insert needed here.
      //
      // IMPORTANT: if the Supabase project has "Confirm email" enabled,
      // data.session will be null here even though data.user exists — the
      // browser is NOT authenticated yet, and any RLS-protected insert
      // attempted right now would be rejected. Callers must check
      // hasSession before trying to write creator/advertiser profile data.
      return { error: null, userId: data.user?.id ?? null, hasSession: !!data.session };
    } catch {
      const friendly = "Couldn't reach Trender's servers. Check your connection and try again.";
      setError(friendly);
      return { error: friendly, userId: null, hasSession: false };
    }
  }

  async function signIn(email: string, password: string) {
    setError(null);
    if (configError) return { error: configError };
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const friendly = friendlyAuthError(signInError.message);
        setError(friendly);
        return { error: friendly };
      }
      return { error: null };
    } catch {
      const friendly = "Couldn't reach Trender's servers. Check your connection and try again.";
      setError(friendly);
      return { error: friendly };
    }
  }

  async function signOut() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Already signed out / not configured — nothing to do.
    }
    setSession(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        error: error ?? configError,
        refreshProfile,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
