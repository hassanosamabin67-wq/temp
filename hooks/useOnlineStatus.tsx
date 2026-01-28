"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/config/supabase";

export function useOnlineStatus(userId?: string) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    const markOnline = async () => {
      try {
        await supabase
          .from("users")
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq("userId", userId);
      } catch (err) {
        console.error("markOnline error", err);
      }
    };

    const heartbeat = async () => {
      try {
        await supabase
          .from("users")
          .update({ last_seen: new Date().toISOString() })
          .eq("userId", userId);
      } catch (err) {
        console.error("heartbeat error", err);
      }
    };

    markOnline();
    intervalRef.current = window.setInterval(heartbeat, 15_000);

    // pagehide + beforeunload -> use beacon to call server API that marks offline
    const handlePageHide = () => {
      try {
        if (navigator && "sendBeacon" in navigator) {
          const url = `${location.origin}/api/set-offline`;
          const payload = JSON.stringify({ userId });
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        } else {
          // fallback attempt (best-effort)
          fetch("/api/set-offline", {
            method: "POST",
            body: JSON.stringify({ userId }),
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          }).catch(() => {});
        }
      } catch (e) {
        console.error("handlePageHide error", e);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      // DON'T mark offline here (prevents marking offline on SPA navigations)
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [userId]);
}
