'use client';

import { db } from "@/lib/firebase";
import { get, ref, update } from "firebase/database";
import { AppUserProfile } from "@/lib/auth";

export type UserProfileDetails = AppUserProfile;

export async function loadUserProfile(uid: string): Promise<UserProfileDetails | null> {
  const snapshot = await get(ref(db, `users/${uid}/profile`));
  return snapshot.exists() ? (snapshot.val() as UserProfileDetails) : null;
}

export async function saveUserProfile(
  uid: string,
  data: Partial<Pick<UserProfileDetails, "fullName" | "phone" | "address" | "notes">>
) {
  await update(ref(db, `users/${uid}/profile`), {
    ...data,
    updatedAt: Date.now(),
  });
}
