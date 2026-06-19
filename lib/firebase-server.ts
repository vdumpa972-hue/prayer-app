import { getApp, getApps, initializeApp } from "firebase/app";
import { get, getDatabase, ref, update } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

export async function getUserProfileServer(uid: string) {
  const snapshot = await get(ref(db, `users/${uid}/profile`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateUserProfileServer(uid: string, data: Record<string, unknown>) {
  await update(ref(db, `users/${uid}/profile`), {
    ...data,
    updatedAt: Date.now(),
  });
}
