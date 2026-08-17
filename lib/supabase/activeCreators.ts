"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, type SupabaseBrowserClient } from "./client";

export const ACTIVE_CREATOR_WINDOW_MINUTES = 5;
export const ACTIVE_CREATOR_REFRESH_MS = 30000;
export const ACTIVE_CREATOR_HEARTBEAT_MS = 30000;

export async function getActiveCreatorCount(
  supabase: SupabaseBrowserClient = getSupabaseBrowserClient()
): Promise<number> {
  const { data, error } = await supabase.rpc("get_active_creator_count");

  if (error) {
    throw error;
  }

  return Number(data ?? 0);
}

export function useActiveCreatorCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      try {
        const nextCount = await getActiveCreatorCount();
        if (!isMounted) return;
        setCount(nextCount);
        setError(null);
      } catch {
        if (!isMounted) return;
        setCount(0);
        setError("Couldn't load active creators.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    refresh();
    const intervalId = window.setInterval(refresh, ACTIVE_CREATOR_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return { count, loading, error };
}

export function useCreatorPresence(userId: string | null | undefined, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = getSupabaseBrowserClient();

    const updatePresence = async () => {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("creator_presence")
        .upsert(
          { creator_id: userId, last_seen_at: now },
          { onConflict: "creator_id" }
        );

      if (error) {
        console.error("[creatorPresence] heartbeat failed", error);
      }
    };

    void updatePresence();
    const intervalId = window.setInterval(() => {
      void updatePresence();
    }, ACTIVE_CREATOR_HEARTBEAT_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, userId]);
}
