"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlanGuard({ profile }: any) {
  const router = useRouter();

  useEffect(() => {
    if (!profile) return;

    if (profile.plan === "free") {
      router.push("/plans");
    }
  }, [profile]);

  return null;
}
