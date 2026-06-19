'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/components/LanguageProvider";
import { get, onValue, ref } from "firebase/database";

type SessionState = {
  code: string;
  traditionId: string;
  bookId: string;
  prayerId: string;
  prayerTitle: string;
  language: string;
  currentIndex: number;
  text: string;
  translationEnglish?: string;
  updatedAt: number;
};


function getReligionReadingBackground(traditionId?: string, title?: string, language?: string) {
  const key = `${traditionId ?? ""} ${title ?? ""} ${language ?? ""}`.toLowerCase();

  if (key.includes("islam") || key.includes("muslim") || key.includes("quran") || key.includes("sura") || key.includes("arabic")) {
    return "/religion-backgrounds/islam-reading-bg.jpg";
  }

  if (key.includes("jew") || key.includes("hebrew") || key.includes("torah") || key.includes("sefaria") || key.includes("tanakh")) {
    return "/religion-backgrounds/jewish-reading-bg.jpg";
  }

  return "/religion-backgrounds/christian-reading-bg.jpg";
}

function splitWords(text: string) {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
}

export default function FollowerPage() {
  const { t } = useLanguage();
  const [joinCode, setJoinCode] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [session, setSession] = useState<SessionState | null>(null);
  const [status, setStatus] = useState("idle");
  const [prayerFontSize, setPrayerFontSize] = useState(34);
  const [showTranslation, setShowTranslation] = useState(true);
  const currentWordRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    const sessionRef = ref(db, `sessions/${sessionCode}`);

    const unsub = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setSession(data);
        setStatus(`${t("common.status")}: ${sessionCode}`);
      } else {
        setStatus(`Session disappeared: ${sessionCode}`);
        setSession(null);
      }
    });

    return () => unsub();
  }, [sessionCode]);

  useEffect(() => {
    if (!currentWordRef.current) return;

    currentWordRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [session?.currentIndex, session?.text, prayerFontSize, showTranslation]);

  const words = useMemo(() => splitWords(session?.text ?? ''), [session?.text]);
  const currentIndex = session?.currentIndex ?? 0;

  async function joinSession(codeRaw: string) {
    const code = codeRaw.trim().toUpperCase();

    if (!code) {
      alert(t("follower.enterSessionCode"));
      return;
    }

    try {
      const snapshot = await get(ref(db, `sessions/${code}`));

      if (!snapshot.exists()) {
        setStatus("not found");
        alert("Session not found");
        return;
      }

      setSessionCode(code);
      setJoinCode(code);
      setSession(snapshot.val());
      setStatus(`joined ${code}`);
    } catch (e) {
      console.error(e);
      setStatus('error');
      alert("Join failed");
    }
  }

  const prayerPanelHeight = showTranslation ? '46vh' : '68vh';
  const readingBackgroundImage = getReligionReadingBackground(
    session?.traditionId,
    session?.prayerTitle,
    session?.language
  );

  const styles = {
    page: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      minHeight: '100vh',
      padding: 18,
      color: '#1f2937',
    } as const,
    shell: {
      maxWidth: 1400,
      margin: '0 auto',
    } as const,
    topCard: {
      background: 'rgba(232, 238, 255, 0.56)',
      border: '1px solid rgba(140, 160, 199, 0.76)',
      borderRadius: 18,
      padding: 18,
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      marginBottom: 18,
      backdropFilter: 'blur(6px)',
    } as const,
    title: {
      margin: 0,
      fontSize: 44,
      fontWeight: 700,
      color: '#2b2418',
      lineHeight: 1.05,
    } as const,
    subtitle: {
      marginTop: 8,
      marginBottom: 14,
      fontSize: 18,
      color: '#4b5563',
    } as const,
    statusRow: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      marginBottom: 16,
    } as const,
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 14px',
      borderRadius: 999,
      background: 'rgba(245, 237, 215, 0.72)',
      border: '1px solid rgba(203, 184, 148, 0.8)',
      fontSize: 16,
      fontWeight: 700,
      color: '#4b3c24',
      backdropFilter: 'blur(4px)',
    } as const,
    joinRow: {
      display: 'grid',
      gridTemplateColumns: 'minmax(220px, 420px) 140px auto',
      gap: 12,
      alignItems: 'center',
    } as const,
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: 20,
      borderRadius: 12,
      border: '1px solid #b4bfd6',
      background: 'rgba(255,255,255,0.92)',
      color: '#1f2937',
      outline: 'none',
    } as const,
    btn: {
      padding: '12px 18px',
      fontSize: 18,
      fontWeight: 700,
      borderRadius: 12,
      border: '1px solid #c1ae84',
      background: '#f7f3e8',
      color: '#352c1f',
      cursor: 'pointer',
    } as const,
    smallBtn: {
      padding: '10px 14px',
      fontSize: 18,
      fontWeight: 700,
      borderRadius: 12,
      border: '1px solid #c1ae84',
      background: '#f7f3e8',
      color: '#352c1f',
      cursor: 'pointer',
      minWidth: 52,
    } as const,
    sectionCard: {
      background: 'rgba(249, 246, 238, 0.56)',
      border: '1px solid rgba(183, 163, 122, 0.78)',
      borderRadius: 18,
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      backdropFilter: 'blur(6px)',
    } as const,
    sectionHeader: {
      padding: '16px 18px',
      borderBottom: '1px solid rgba(214, 200, 168, 0.78)',
      background: 'rgba(247, 243, 232, 0.62)',
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
      backdropFilter: 'blur(4px)',
    } as const,
    sectionTitle: {
      margin: 0,
      fontSize: 28,
      fontWeight: 700,
      color: '#312715',
    } as const,
    controlsRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    } as const,
    label: {
      fontSize: 18,
      fontWeight: 700,
      color: '#44341a',
    } as const,
    metaArea: {
      padding: '16px 18px 8px 18px',
      fontSize: 18,
      lineHeight: 1.5,
      color: '#352c1f',
    } as const,
    metaLine: {
      marginBottom: 4,
    } as const,
    bookSpread: {
      margin: '8px 18px 18px 18px',
      display: 'grid',
      gridTemplateColumns: showTranslation ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
      gap: 0,
      border: '1px solid rgba(118, 86, 42, 0.68)',
      borderRadius: 18,
      overflow: 'hidden',
      background: `linear-gradient(90deg, rgba(255,255,255,0.26), rgba(255,255,255,0.34) 47%, rgba(92,65,30,0.24) 50%, rgba(255,255,255,0.34) 53%, rgba(255,255,255,0.26)), linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.24)), url("${readingBackgroundImage}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      boxShadow: '0 18px 38px rgba(38, 26, 12, 0.32), inset 0 0 40px rgba(95, 62, 24, 0.18)',
    } as const,
    bookPage: {
      padding: 24,
      minHeight: 320,
      background: 'radial-gradient(circle at top left, rgba(255,255,255,0.44), transparent 34%), rgba(255, 248, 226, 0.20)',
    } as const,
    bookPageLeft: {
      borderRight: showTranslation ? '2px solid rgba(116, 82, 38, 0.30)' : 'none',
      boxShadow: showTranslation ? 'inset -16px 0 22px rgba(78, 50, 20, 0.12)' : 'none',
    } as const,
    bookPageRight: {
      boxShadow: 'inset 16px 0 22px rgba(78, 50, 20, 0.12)',
    } as const,
    bookPageTitle: {
      marginBottom: 12,
      fontSize: 22,
      fontWeight: 700,
      color: '#111827',
      textShadow: '0 1px 2px rgba(255,255,255,0.95)',
      borderBottom: '1px solid rgba(116, 82, 38, 0.28)',
      paddingBottom: 8,
    } as const,
    prayerBox: {
      margin: 0,
      padding: 0,
      background: 'transparent',
      border: 'none',
      borderRadius: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      lineHeight: 1.8,
      wordBreak: 'break-word',
      color: '#050505',
      textShadow: '0 1px 2px rgba(255,255,255,0.96)',
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
    } as const,
    translationWrap: {
      marginTop: 18,
    } as const,
    translationBox: {
      padding: 0,
      minHeight: 150,
      maxHeight: prayerPanelHeight,
      overflowY: 'auto',
      fontSize: 24,
      lineHeight: 1.7,
      color: '#050505',
      textShadow: '0 1px 2px rgba(255,255,255,0.96)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      background: 'transparent',
    } as const,
    emptyText: {
      color: '#6b7280',
      fontStyle: 'italic',
    } as const,
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.topCard}>
          <h1 style={styles.title}>{t("follower.title")}</h1>
          <div style={styles.subtitle}>{t("follower.subtitle")}</div>

          <div style={styles.statusRow}>
            <span style={styles.badge}>{t("common.status")}: {status}</span>
            <span style={styles.badge}>{t("common.session")}: {sessionCode || '-'}</span>
          </div>

          <div style={styles.joinRow}>
            <input
              placeholder={t("follower.enterSessionCode")}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  joinSession(joinCode);
                }
              }}
              style={styles.input}
            />

            <button type="button" onClick={() => joinSession(joinCode)} style={styles.btn}>
              {t("follower.join")}
            </button>

            <div style={styles.controlsRow}>
              <span style={styles.label}>{t("common.textSize")}:</span>
              <button
                type="button"
                style={styles.smallBtn}
                onClick={() => setPrayerFontSize((v) => Math.min(72, v + 2))}
              >
                +
              </button>
              <button
                type="button"
                style={styles.smallBtn}
                onClick={() => setPrayerFontSize((v) => Math.max(18, v - 2))}
              >
                -
              </button>
              <button
                type="button"
                style={styles.btn}
                onClick={() => setShowTranslation((v) => !v)}
              >
                {showTranslation ? t("common.disableTranslation") : t("common.enableTranslation")}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>{t("master.prayer")}</h2>
          </div>

          <div style={styles.metaArea}>
            <div style={styles.metaLine}><strong>{t("follower.currentPrayer")}:</strong> {session?.prayerTitle || '-'}</div>
            <div style={styles.metaLine}><strong>{t("follower.wordPosition")}:</strong> {words.length ? `${currentIndex + 1} / ${words.length}` : '0 / 0'}</div>
          </div>

          <div style={styles.bookSpread}>
            <div style={{ ...styles.bookPage, ...styles.bookPageLeft }}>
              <div style={styles.bookPageTitle}>{t("master.prayer")}</div>
              <div style={{ ...styles.prayerBox, height: prayerPanelHeight, fontSize: prayerFontSize }}>
                {words.length ? (
                  words.map((w, i) => {
                    const isCurrent = i === currentIndex;
                    return (
                      <span
                        key={`${i}-${w}`}
                        ref={isCurrent ? currentWordRef : null}
                        style={{
                          display: 'inline',
                          marginRight: 10,
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: isCurrent ? '#111827' : 'transparent',
                          color: isCurrent ? '#ffffff' : i < currentIndex ? '#8b7b63' : '#2b2418',
                        }}
                      >
                        {w}
                      </span>
                    );
                  })
                ) : (
                  <div style={styles.emptyText}>{t("follower.joinToShow")}</div>
                )}
              </div>
            </div>

            {showTranslation ? (
              <div style={{ ...styles.bookPage, ...styles.bookPageRight }}>
                <div style={styles.bookPageTitle}>{t("follower.translation")}</div>
                <div style={styles.translationBox}>
                  {session?.translationEnglish ? (
                    session.translationEnglish
                  ) : (
                    <span style={styles.emptyText}>{t("common.noTranslation")}</span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
