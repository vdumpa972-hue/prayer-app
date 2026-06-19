'use client';

import { useEffect } from "react";
import { getCurrentUserProfile, getPostLoginPath, subscribeToAuth } from "@/lib/auth";

export default function AppEntryPage() {
  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      if (!user) {
        window.location.replace("/auth?next=/app");
        return;
      }

      try {
        const profile = await getCurrentUserProfile(user.uid);
        window.location.replace(getPostLoginPath(profile, "/master"));
      } catch (error) {
        console.error("App redirect failed:", error);
        window.location.replace("/auth?next=/app");
      }
    });

    return () => unsub();
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
      Loading...
    </main>
  );
}
