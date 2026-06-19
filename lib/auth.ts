'use client';

import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { get, ref, set } from "firebase/database";

export type BillingInterval = "monthly" | "annual" | "none";
export type SubscriptionStatus = "trialing" | "active" | "overdue" | "canceled" | "free";

export type AppUserProfile = {
  uid: string;
  email: string;
  role: "owner" | "admin" | "user";
  plan: "free" | "paid" | "trial";
  createdAt: number;
  updatedAt?: number;
  fullName?: string;
  phone?: string;
  address?: string;
  memberSince?: number;
  billingInterval?: BillingInterval;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionType?: "trial" | "monthly" | "annual" | "free";
  trialStart?: number;
  trialEnd?: number;
  renewalDate?: number;
  cancelAtPeriodEnd?: boolean;
  isTestUser?: boolean;
  notes?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCurrentPeriodEnd?: number;
  preferredLanguage?: string;
};

const DEFAULT_SUPER_ADMIN_EMAIL = "vdumpa972@gmail.com";
const SUPER_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || DEFAULT_SUPER_ADMIN_EMAIL)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function baseRoleForEmail(email: string): "owner" | "user" {
  return SUPER_ADMIN_EMAILS.includes(email) ? "owner" : "user";
}

async function writeUserProfile(uid: string, profile: AppUserProfile) {
  await set(ref(db, `users/${uid}/profile`), profile);
}

export async function signUpWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const normalizedEmail = (cred.user.email || email).trim().toLowerCase();
  const now = Date.now();
  const isOwner = SUPER_ADMIN_EMAILS.includes(normalizedEmail);

  const profile: AppUserProfile = {
    uid: cred.user.uid,
    email: normalizedEmail,
    role: baseRoleForEmail(normalizedEmail),
    plan: isOwner ? "paid" : "free",
    createdAt: now,
    updatedAt: now,
    memberSince: now,
    billingInterval: isOwner ? "monthly" : "none",
    subscriptionStatus: isOwner ? "active" : "free",
    subscriptionType: isOwner ? "monthly" : "free",
  };

  await writeUserProfile(cred.user.uid, profile);
  return cred.user;
}

export async function signUpTrialWithEmail(email: string, password: string, fullName = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const normalizedEmail = (cred.user.email || email).trim().toLowerCase();
  const now = Date.now();
  const isOwner = SUPER_ADMIN_EMAILS.includes(normalizedEmail);

  const profile: AppUserProfile = {
    uid: cred.user.uid,
    email: normalizedEmail,
    role: baseRoleForEmail(normalizedEmail),
    plan: isOwner ? "paid" : "trial",
    createdAt: now,
    updatedAt: now,
    memberSince: now,
    fullName: fullName || "",
    billingInterval: isOwner ? "monthly" : "none",
    subscriptionStatus: isOwner ? "active" : "trialing",
    subscriptionType: isOwner ? "monthly" : "trial",
    ...(isOwner
      ? { renewalDate: now + THIRTY_DAYS_MS }
      : {
          trialStart: now,
          trialEnd: now + THIRTY_DAYS_MS,
        }),
  };

  await writeUserProfile(cred.user.uid, profile);
  return cred.user;
}

export async function signUpPaidWithEmail(
  email: string,
  password: string,
  billingInterval: BillingInterval,
  fullName = ""
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const normalizedEmail = (cred.user.email || email).trim().toLowerCase();
  const now = Date.now();

  const renewalMs = billingInterval === "annual" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  const profile: AppUserProfile = {
    uid: cred.user.uid,
    email: normalizedEmail,
    role: baseRoleForEmail(normalizedEmail),
    plan: "paid",
    createdAt: now,
    updatedAt: now,
    memberSince: now,
    fullName: fullName || "",
    billingInterval,
    subscriptionStatus: "active",
    subscriptionType: billingInterval === "annual" ? "annual" : "monthly",
    renewalDate: now + renewalMs,
  };

  await writeUserProfile(cred.user.uid, profile);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function sendResetEmail(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function changeCurrentUserPassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("Please log in again before changing your password.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function signOutUser() {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUserProfile(uid: string): Promise<AppUserProfile | null> {
  const snapshot = await get(ref(db, `users/${uid}/profile`));
  return snapshot.exists() ? (snapshot.val() as AppUserProfile) : null;
}

export function isTrialExpired(profile?: AppUserProfile | null) {
  return !!(
    profile &&
    profile.plan === "trial" &&
    typeof profile.trialEnd === "number" &&
    profile.trialEnd <= Date.now()
  );
}

export function getEffectiveRenewalDate(profile?: AppUserProfile | null) {
  if (!profile) return null;
  if (typeof profile.renewalDate === "number") return profile.renewalDate;
  if (typeof profile.stripeCurrentPeriodEnd === "number") return profile.stripeCurrentPeriodEnd;

  if (profile.plan === "paid" && typeof profile.memberSince === "number") {
    if (profile.billingInterval === "annual") {
      return profile.memberSince + 365 * 24 * 60 * 60 * 1000;
    }
    if (profile.billingInterval === "monthly") {
      return profile.memberSince + 30 * 24 * 60 * 60 * 1000;
    }
  }

  return null;
}

export function setPlanCookie(profile?: AppUserProfile | null) {
  if (typeof document === "undefined") return;

  const plan = profile?.plan || "free";
  document.cookie = `plan=${plan}; path=/; SameSite=Lax`;

  if (typeof profile?.trialEnd === "number") {
    document.cookie = `trialEnd=${profile.trialEnd}; path=/; SameSite=Lax`;
  } else {
    document.cookie = "trialEnd=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}

export function getPostLoginPath(profile?: AppUserProfile | null, requestedPath = "/master") {
  if (!profile) return "/auth";
  if (profile.plan === "free") return "/plans";
  if (isTrialExpired(profile)) return "/subscription?trialExpired=1";

  const safeRequestedPath = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master";

  if (profile.role === "owner") {
    if (safeRequestedPath === "/owner") return "/owner";
    if (safeRequestedPath === "/super-admin") return "/super-admin";
    return "/master";
  }

  return safeRequestedPath === "/plans" || safeRequestedPath === "/auth" ? "/master" : safeRequestedPath;
}
