"use client";

import { useEffect, useRef, useState } from "react";
import { getLanguageLabel, SUPPORTED_LANGUAGES, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateCompact = () => setIsCompact(window.innerWidth <= 640);
    updateCompact();
    window.addEventListener("resize", updateCompact);
    return () => window.removeEventListener("resize", updateCompact);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: "fixed", top: 12, right: 12, left: isCompact ? 12 : "auto", zIndex: 1000, maxWidth: isCompact ? "calc(100vw - 24px)" : "auto", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <button type="button" onClick={() => setOpen((current) => !current)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, width: isCompact ? "100%" : "auto", padding: isCompact ? "10px 12px" : "8px 12px", borderRadius: 12, background: "rgba(255,255,255,0.96)", border: "1px solid rgba(148,163,184,0.35)", boxShadow: "0 10px 24px rgba(15,23,42,0.12)", color: "#0f172a", fontWeight: 700, cursor: "pointer" }} aria-expanded={open} aria-controls="global-language-picker-panel">
        <span style={{ fontSize: 14 }}>{t("common.language")}</span>
        <span style={{ fontSize: 14, color: "#1d4ed8" }}>{getLanguageLabel(language)}</span>
        <span style={{ fontSize: 12, color: "#64748b" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div id="global-language-picker-panel" style={{ marginTop: 8, minWidth: isCompact ? "100%" : 200, width: isCompact ? "100%" : "auto", padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(148,163,184,0.35)", boxShadow: "0 14px 30px rgba(15,23,42,0.14)" }}>
          <label htmlFor="global-language-picker" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{t("common.language")}</label>
          <select id="global-language-picker" value={language} onChange={async (event) => { const nextLanguage = normalizeLanguage(event.target.value as SupportedLanguage); await setLanguage(nextLanguage); setOpen(false); }} style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(148,163,184,0.5)", padding: "8px 10px", fontWeight: 600, color: "#0f172a", background: "white" }}>
            {SUPPORTED_LANGUAGES.map((item) => <option key={item} value={item}>{getLanguageLabel(item)}</option>)}
          </select>
        </div>
      ) : null}
    </div>
  );
}
