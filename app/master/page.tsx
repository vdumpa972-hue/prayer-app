'use client';

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { onValue, ref, set, update } from "firebase/database";

type Prayer = {
  id: string;
  folder: string;
  title: string;
  text: string;
};

type SessionState = {
  code: string;
  prayerId: string;
  currentIndex: number;
  text: string;
  updatedAt: number;
};

const PRAYERS: Prayer[] = [
  {
    id: "shema",
    folder: "Morning Prayers",
    title: "Shema",
    text: "Hear O Israel the Lord is our God the Lord is One Blessed be the name of His glorious kingdom forever and ever."
  },
  {
    id: "amidah",
    folder: "Morning Prayers",
    title: "Amidah Opening",
    text: "Lord open my lips and my mouth shall declare Your praise Blessed are You Lord our God and God of our fathers."
  },
  {
    id: "kiddush",
    folder: "Shabbat",
    title: "Kiddush",
    text: "Blessed are You Lord our God King of the universe who creates the fruit of the vine."
  }
];

function splitWords(text: string) {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getPrayerById(id: string) {
  return PRAYERS.find((p) => p.id === id) ?? PRAYERS[0];
}

export default function Home() {
  const [sessionCode, setSessionCode] = useState("");
  const [session, setSessionState] = useState<SessionState | null>(null);
  const [selectedPrayerId, setSelectedPrayerId] = useState(PRAYERS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(600);

  useEffect(() => {
    if (!sessionCode) return;

    const sessionRef = ref(db, `sessions/${sessionCode}`);

    const unsub = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSessionState(data);
        setSelectedPrayerId(data.prayerId);
      }
    });

    return () => unsub();
  }, [sessionCode]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!sessionCode || !session) return;

    const maxIndex = Math.max(splitWords(session.text).length - 1, 0);

    if (session.currentIndex >= maxIndex) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(async () => {
      await update(ref(db, `sessions/${sessionCode}`), {
        currentIndex: Math.min(session.currentIndex + 1, maxIndex),
        updatedAt: Date.now()
      });
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, speedMs, sessionCode, session]);

  const activePrayer = session
    ? getPrayerById(session.prayerId)
    : getPrayerById(selectedPrayerId);

  const words = useMemo(
    () => splitWords(session?.text ?? activePrayer.text),
    [session, activePrayer]
  );

  const currentIndex = session?.currentIndex ?? 0;

  async function createSession() {
    setIsPlaying(false);

    const code = randomCode();
    const prayer = getPrayerById(selectedPrayerId);

    const newSession: SessionState = {
      code,
      prayerId: prayer.id,
      currentIndex: 0,
      text: prayer.text,
      updatedAt: Date.now()
    };

    await set(ref(db, `sessions/${code}`), newSession);
    setSessionCode(code);
  }

  async function choosePrayer(prayerId: string) {
    setIsPlaying(false);
    setSelectedPrayerId(prayerId);

    if (!sessionCode) return;

    const prayer = getPrayerById(prayerId);

    await update(ref(db, `sessions/${sessionCode}`), {
      prayerId: prayer.id,
      text: prayer.text,
      currentIndex: 0,
      updatedAt: Date.now()
    });
  }

  async function nextWord() {
    if (!sessionCode || !session) return;

    const maxIndex = Math.max(splitWords(session.text).length - 1, 0);

    await update(ref(db, `sessions/${sessionCode}`), {
      currentIndex: Math.min(session.currentIndex + 1, maxIndex),
      updatedAt: Date.now()
    });
  }

  async function prevWord() {
    if (!sessionCode || !session) return;

    await update(ref(db, `sessions/${sessionCode}`), {
      currentIndex: Math.max(session.currentIndex - 1, 0),
      updatedAt: Date.now()
    });
  }

  async function resetWords() {
    if (!sessionCode) return;

    setIsPlaying(false);

    await update(ref(db, `sessions/${sessionCode}`), {
      currentIndex: 0,
      updatedAt: Date.now()
    });
  }

  function playWords() {
    if (!sessionCode || !session) return;
    setIsPlaying(true);
  }

  function pauseWords() {
    setIsPlaying(false);
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: 20,
        maxWidth: 1200,
        margin: "0 auto"
      }}
    >
      <h1>Prayer Master</h1>
      <p>
        Current mode: <strong>Master</strong>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <div style={{ border: "1px solid #ccc", padding: 15, borderRadius: 8 }}>
          <h3>Master controls</h3>

          <div style={{ marginBottom: 15 }}>
            <button
              onClick={createSession}
              style={{ padding: "10px 14px", cursor: "pointer" }}
            >
              Create Session
            </button>
          </div>

          <div style={{ marginBottom: 15 }}>
            <strong>Session Code:</strong> {sessionCode || "Not created yet"}
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4>Prayer Library</h4>

            {PRAYERS.map((prayer) => (
              <div key={prayer.id} style={{ marginBottom: 6 }}>
                <button
                  onClick={() => choosePrayer(prayer.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    border: "1px solid #ccc",
                    background: selectedPrayerId === prayer.id ? "black" : "white",
                    color: selectedPrayerId === prayer.id ? "white" : "black",
                    cursor: "pointer"
                  }}
                >
                  {prayer.folder} — {prayer.title}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 15 }}>
            <button onClick={prevWord} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Back
            </button>
            <button onClick={nextWord} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Next
            </button>
            <button onClick={resetWords} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Reset
            </button>
            <button onClick={playWords} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Play
            </button>
            <button onClick={pauseWords} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Pause
            </button>
          </div>

          <div style={{ marginTop: 10, marginBottom: 20 }}>
            <label>
              <strong>Speed (ms): </strong>
              <input
                type="number"
                value={speedMs}
                min={150}
                step={50}
                onChange={(e) => setSpeedMs(Number(e.target.value) || 600)}
                style={{ padding: "6px 8px", width: 100, marginLeft: 8 }}
              />
            </label>

            <span style={{ marginLeft: 12 }}>
              {isPlaying ? "Playing" : "Paused"}
            </span>
          </div>
        </div>

        <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 8 }}>
          <div style={{ marginBottom: 10 }}>
            <strong>Current Prayer:</strong> {activePrayer.title}
          </div>

          <div style={{ marginBottom: 20 }}>
            <strong>Word Position:</strong>{" "}
            {words.length ? `${currentIndex + 1} / ${words.length}` : "0 / 0"}
          </div>

          <div style={{ fontSize: 28, lineHeight: 1.8 }}>
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  marginRight: 10,
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: i === currentIndex ? "black" : "transparent",
                  color: i === currentIndex ? "white" : i < currentIndex ? "#999" : "black"
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}