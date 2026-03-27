'use client';

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { get, onValue, ref } from "firebase/database";

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
  return text.split(/\s+/).map(w => w.trim()).filter(Boolean);
}

function getPrayerById(id: string) {
  return PRAYERS.find(p => p.id === id) ?? PRAYERS[0];
}

export default function FollowerPage() {
  const [joinCode, setJoinCode] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [session, setSession] = useState<SessionState | null>(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!sessionCode) return;

    const sessionRef = ref(db, `sessions/${sessionCode}`);

    const unsub = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSession(data);
        setStatus(`connected to ${sessionCode}`);
      }
    });

    return () => unsub();
  }, [sessionCode]);

  const activePrayer = session ? getPrayerById(session.prayerId) : PRAYERS[0];
  const words = useMemo(() => splitWords(session?.text ?? activePrayer.text), [session, activePrayer]);
  const currentIndex = session?.currentIndex ?? 0;

  async function joinSession(codeRaw: string) {
    const code = codeRaw.trim().toUpperCase();

    if (!code) {
      alert("Enter session code");
      return;
    }

    setStatus(`trying ${code}`);

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
      alert(`Joined ${code}`);
    } catch (e) {
      console.error(e);
      setStatus("error");
      alert("Join failed");
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h1>Follower</h1>

      {/* TEST BUTTON */}
      <button
        onClick={() => alert("BUTTON WORKS")}
        style={{
          padding: 16,
          fontSize: 20,
          background: "red",
          color: "white",
          border: "none",
          width: "100%",
          marginBottom: 20
        }}
      >
        TEST TAP
      </button>

      <p>Status: <b>{status}</b></p>

      {/* SIMPLE INPUT */}
      <input
  placeholder="Enter code"
  value={joinCode}
  onChange={(e) => setJoinCode(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      alert("ENTER WORKS");
      joinSession(joinCode);
    }
  }}
  style={{
    width: "100%",
    padding: 12,
    fontSize: 18,
    marginBottom: 10
  }}
/>

<button
  type="button"
  onClick={() => {
    alert("CLICK WORKS");
    joinSession(joinCode);
  }}
  style={{
    padding: 12,
    fontSize: 18,
    background: "#444",
    color: "white",
    border: "none",
    width: "100%"
  }}
>
  Join
</button>

      <div style={{ marginTop: 10 }}>
        Typed Code: {joinCode || "(empty)"}
      </div>

      <hr />

      <div style={{ fontSize: 24 }}>
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              marginRight: 8,
              background: i === currentIndex ? "black" : "transparent",
              color: i === currentIndex ? "white" : "black"
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}