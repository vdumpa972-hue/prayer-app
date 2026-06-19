'use client';

import { get, ref, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { getCurrentUserProfile } from "@/lib/auth";

export type OwnerSecuritySettings = {
  allowedOwnerEmails: string[];
  ownerAccessCodeHash?: string;
  updatedAt?: number;
};

const SETTINGS_PATH = "settings/ownerSecurity";
const DEFAULT_OWNER_EMAIL = "vdumpa972@gmail.com";

export function normalizeOwnerEmail(email: string) {
  return email.trim().toLowerCase();
}

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails.map(normalizeOwnerEmail).filter(Boolean)));
}

function defaultOwnerSecuritySettings(): OwnerSecuritySettings {
  return {
    allowedOwnerEmails: [DEFAULT_OWNER_EMAIL],
  };
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function loadOwnerSecuritySettings(): Promise<OwnerSecuritySettings> {
  try {
    const snapshot = await get(ref(db, SETTINGS_PATH));
    const raw = snapshot.exists() ? snapshot.val() : {};
    const allowedOwnerEmails = uniqueEmails([
      DEFAULT_OWNER_EMAIL,
      ...(Array.isArray(raw?.allowedOwnerEmails) ? raw.allowedOwnerEmails : []),
    ]);

    return {
      allowedOwnerEmails,
      ownerAccessCodeHash: typeof raw?.ownerAccessCodeHash === "string" ? raw.ownerAccessCodeHash : undefined,
      updatedAt: typeof raw?.updatedAt === "number" ? raw.updatedAt : undefined,
    };
  } catch (err) {
    // The account-management page must not get stuck just because
    // /settings/ownerSecurity is not readable by current RTDB rules.
    // The app-owner email is always allowed as a safe fallback.
    console.warn("Could not read owner security settings; using default owner email.", err);
    return defaultOwnerSecuritySettings();
  }
}

export async function saveOwnerSecuritySettings(input: {
  allowedOwnerEmails: string[];
  ownerAccessCodeHash?: string | null;
}) {
  const allowedOwnerEmails = uniqueEmails([DEFAULT_OWNER_EMAIL, ...input.allowedOwnerEmails]);
  const payload: Record<string, unknown> = {
    allowedOwnerEmails,
    updatedAt: Date.now(),
  };

  if (typeof input.ownerAccessCodeHash === "string" && input.ownerAccessCodeHash) {
    payload.ownerAccessCodeHash = input.ownerAccessCodeHash;
  }
  if (input.ownerAccessCodeHash === null) {
    payload.ownerAccessCodeHash = null;
  }

  await update(ref(db, SETTINGS_PATH), payload);
}

export async function isAllowedOwnerEmail(email: string) {
  const clean = normalizeOwnerEmail(email);
  if (!clean) return false;
  if (clean === DEFAULT_OWNER_EMAIL) return true;

  const settings = await loadOwnerSecuritySettings();
  return settings.allowedOwnerEmails.includes(clean);
}

export async function ensureOwnerRoleForAllowedEmail(uid: string, email: string) {
  const clean = normalizeOwnerEmail(email);
  if (!clean) return false;

  const allowed = await isAllowedOwnerEmail(clean);
  if (!allowed) return false;

  try {
    const profile = await getCurrentUserProfile(uid);
    if (!profile) return true;
    if (profile.role === "owner") return true;

    await update(ref(db, `users/${uid}/profile`), {
      role: "owner",
      plan: profile.plan === "free" ? "paid" : profile.plan,
      subscriptionStatus: profile.subscriptionStatus === "free" ? "active" : profile.subscriptionStatus,
      billingInterval: profile.billingInterval === "none" ? "monthly" : profile.billingInterval,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    // Do not block the owner page on this helper. The page will still verify
    // access by email/profile and then try loading the users list.
    console.warn("Could not auto-repair owner role.", err);
    return true;
  }
}
