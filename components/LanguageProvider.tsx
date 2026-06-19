"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_LANGUAGE, getStoredLanguage, LANGUAGE_CHANGED_EVENT, normalizeLanguage, persistLanguage, translate, type SupportedLanguage } from "@/lib/i18n";

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const nextLanguage = getStoredLanguage();
    setLanguageState(nextLanguage);
    persistLanguage(nextLanguage);
  }, []);

  useEffect(() => {
    const handleLanguageChanged = (event: Event) => {
      const nextLanguage = normalizeLanguage((event as CustomEvent<string>).detail || getStoredLanguage());
      setLanguageState(nextLanguage);
    };
    window.addEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChanged as EventListener);
    return () => window.removeEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChanged as EventListener);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user?.uid) return;
      try {
        const snap = await get(ref(db, `users/${user.uid}/profile/preferredLanguage`));
        if (!snap.exists()) return;
        const preferred = normalizeLanguage(String(snap.val() || ""));
        setLanguageState(preferred);
        persistLanguage(preferred);
      } catch (error) {
        console.error("Could not load preferred language", error);
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: async (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage);
      setLanguageState(normalized);
      persistLanguage(normalized);
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;
      try {
        await update(ref(db, `users/${currentUser.uid}/profile`), { preferredLanguage: normalized, updatedAt: Date.now() });
      } catch (error) {
        console.error("Could not save preferred language", error);
      }
    },
    t: (key) => translate(language, key),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
