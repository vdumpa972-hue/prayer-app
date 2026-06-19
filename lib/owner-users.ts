'use client';

import { initializeApp, getApp, getApps } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { get, ref, remove, set, update } from "firebase/database";
import { db, firebaseConfig } from "@/lib/firebase";

export type ManagedUserProfile = {
  uid: string;
  email: string;
  role: "owner" | "admin" | "user";
  plan: "free" | "paid" | "trial";
  createdAt: number;
  updatedAt?: number;
  fullName?: string;
  phone?: string;
  address?: string;
  isTestUser?: boolean;
  subscriptionType?: "trial" | "monthly" | "annual" | "free";
  subscriptionStatus?: "trialing" | "active" | "overdue" | "canceled" | "free";
  billingInterval?: "monthly" | "annual" | "none";
  memberSince?: number;
  notes?: string;
  trialStart?: number;
  trialEnd?: number;
  renewalDate?: number;
  cancelAtPeriodEnd?: boolean;
};

function randomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const DAY_MS = 24 * 60 * 60 * 1000;

function getOwnerCreationAuth() {
  const appName = "owner-user-creation";
  const app = getApps().some((existing) => existing.name === appName)
    ? getApp(appName)
    : initializeApp(firebaseConfig, appName);
  return getAuth(app);
}

export async function loadAllUserProfiles(): Promise<ManagedUserProfile[]> {
  let raw: Record<string, any> = {};

  try {
    const snapshot = await get(ref(db, "users"));
    raw = snapshot.exists() ? snapshot.val() : {};
  } catch (err: any) {
    const message = String(err?.message || err || "");
    if (message.toLowerCase().includes("permission")) {
      throw new Error(
        "Permission denied reading /users. This is Firebase Rules, not React. Open Firebase Console > Realtime Database > Rules, paste firebase-database-rules-owner-management.json, then Publish and reload. Owner UID d5bB5eJYvnS8UjfqON4aAeq6AF02 is included in the rules."
      );
    }
    throw err;
  }

  const rows: ManagedUserProfile[] = Object.entries(raw || {}).map(([uid, value]: [string, any]) => {
    const profile = value?.profile || {};
    return {
      uid,
      email: profile.email || "",
      role: profile.role || "user",
      plan: profile.plan || "free",
      createdAt: profile.createdAt || 0,
      updatedAt: profile.updatedAt || 0,
      fullName: profile.fullName || "",
      phone: profile.phone || "",
      address: profile.address || "",
      isTestUser: !!profile.isTestUser,
      subscriptionType: profile.subscriptionType || (profile.plan === "paid" ? "monthly" : profile.plan === "trial" ? "trial" : "free"),
      subscriptionStatus: profile.subscriptionStatus || (profile.plan === "paid" ? "active" : profile.plan === "trial" ? "trialing" : "free"),
      billingInterval: profile.billingInterval || (profile.plan === "paid" ? "monthly" : "none"),
      memberSince: profile.memberSince || profile.createdAt || 0,
      notes: profile.notes || "",
      trialStart: typeof profile.trialStart === "number" ? profile.trialStart : undefined,
      trialEnd: typeof profile.trialEnd === "number" ? profile.trialEnd : undefined,
      renewalDate: typeof profile.renewalDate === "number" ? profile.renewalDate : undefined,
      cancelAtPeriodEnd: !!profile.cancelAtPeriodEnd,
    };
  });

  rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return rows;
}

export async function createDummyUserProfile(input: {
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: "owner" | "admin" | "user";
  plan: "trial" | "paid" | "free";
  billingInterval: "monthly" | "annual" | "none";
  subscriptionStatus: "trialing" | "active" | "overdue" | "canceled" | "free";
  notes?: string;
  tempPassword: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const tempPassword = input.tempPassword.trim();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (tempPassword.length < 6) {
    throw new Error("Temporary password must be at least 6 characters.");
  }

  const creationAuth = getOwnerCreationAuth();
  let uid = "";

  try {
    const credential = await createUserWithEmailAndPassword(creationAuth, normalizedEmail, tempPassword);
    uid = credential.user.uid;
  } catch (err: any) {
    const code = String(err?.code || "");
    if (code === "auth/email-already-in-use") {
      throw new Error(
        "This email already exists in Firebase Authentication. Delete that Auth user first, or use a different email."
      );
    }
    throw err;
  } finally {
    await signOut(creationAuth).catch(() => undefined);
  }

  if (!uid) {
    throw new Error("Firebase Authentication did not return a UID for the new user.");
  }

  const now = Date.now();
  const trialEnd = input.plan === "trial" ? now + 30 * DAY_MS : undefined;

  const profile: ManagedUserProfile = {
    uid,
    email: normalizedEmail,
    role: input.role,
    plan: input.plan,
    createdAt: now,
    updatedAt: now,
    fullName: input.fullName,
    phone: input.phone || "",
    address: input.address || "",
    isTestUser: true,
    subscriptionType:
      input.plan === "trial"
        ? "trial"
        : input.plan === "paid"
        ? input.billingInterval === "annual"
          ? "annual"
          : "monthly"
        : "free",
    subscriptionStatus: input.subscriptionStatus,
    billingInterval: input.billingInterval,
    memberSince: now,
    notes: input.notes || "",
    ...(input.plan === "trial" ? { trialStart: now, trialEnd } : {}),
  };

  await set(ref(db, `users/${uid}/profile`), profile);
  return profile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<ManagedUserProfile, "fullName" | "phone" | "address" | "role" | "plan" | "subscriptionStatus" | "billingInterval" | "notes" | "trialStart" | "trialEnd" | "renewalDate" | "memberSince">>
) {
  const now = Date.now();
  const nextPlan = updates.plan;
  const nextBilling = updates.billingInterval;

  const derivedSubscriptionType =
    nextPlan === "trial"
      ? "trial"
      : nextPlan === "paid"
      ? nextBilling === "annual"
        ? "annual"
        : "monthly"
      : nextPlan === "free"
      ? "free"
      : undefined;

  const payload: Record<string, unknown> = {
    ...updates,
    ...(derivedSubscriptionType ? { subscriptionType: derivedSubscriptionType } : {}),
    updatedAt: now,
  };

  if (nextPlan === "free") {
    payload.billingInterval = "none";
    payload.subscriptionStatus = updates.subscriptionStatus || "free";
    payload.subscriptionType = "free";
    payload.trialStart = null;
    payload.trialEnd = null;
    payload.renewalDate = null;
  }

  if (nextPlan === "trial") {
    payload.billingInterval = "none";
    payload.subscriptionStatus = updates.subscriptionStatus || "trialing";
    payload.subscriptionType = "trial";
    payload.trialStart = typeof updates.trialStart === "number" ? updates.trialStart : now;
    payload.trialEnd = typeof updates.trialEnd === "number" ? updates.trialEnd : now + 30 * DAY_MS;
    payload.renewalDate = null;
  }

  if (nextPlan === "paid") {
    const memberSince = typeof updates.memberSince === "number" ? updates.memberSince : now;
    const billingInterval = nextBilling === "annual" ? "annual" : "monthly";
    payload.billingInterval = billingInterval;
    payload.subscriptionStatus = updates.subscriptionStatus || "active";
    payload.subscriptionType = billingInterval === "annual" ? "annual" : "monthly";
    payload.memberSince = memberSince;
    payload.renewalDate = typeof updates.renewalDate === "number" ? updates.renewalDate : memberSince + (billingInterval === "annual" ? 365 * DAY_MS : 30 * DAY_MS);
    payload.trialStart = null;
    payload.trialEnd = null;
  }

  await update(ref(db, `users/${uid}/profile`), payload);
}

export async function deleteUserProfile(uid: string) {
  await remove(ref(db, `users/${uid}`));
}
