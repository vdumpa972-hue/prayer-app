'use client';

import { CSSProperties, FormEvent, useEffect, useState } from "react";
import { signOutUser, subscribeToAuth } from "@/lib/auth";
import { loadUserProfile, saveUserProfile, UserProfileDetails } from "@/lib/profile";

export default function ProfilePage() {
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<UserProfileDetails | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      setMessage("");
      setError("");

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      setUid(user.uid);
      setEmail(user.email || "");

      const loaded = await loadUserProfile(user.uid);
      setProfile(loaded);
      setFullName(loaded?.fullName || "");
      setPhone(loaded?.phone || "");
      setAddress(loaded?.address || "");
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      await saveUserProfile(uid, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      const loaded = await loadUserProfile(uid);
      setProfile(loaded);
      setMessage("Profile saved.");
    } catch (err: any) {
      setError(err?.message || "Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      setBusy(true);
      await signOutUser();
      window.location.href = "/auth";
    } catch (err: any) {
      setError(err?.message || "Could not log out.");
      setBusy(false);
    }
  }

  if (!authReady) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Profile</h1>
          <p style={styles.subtle}>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>My Profile</h1>

        <div style={styles.infoBox}>
          <div><strong>Email:</strong> {email}</div>
          <div><strong>Role:</strong> {profile?.role || "user"}</div>
          <div><strong>Plan:</strong> {profile?.plan || "free"}</div>
        </div>

        <form onSubmit={handleSave} style={styles.form}>
          <label style={styles.label}>
            Full name
            <input
              style={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </label>

          <label style={styles.label}>
            Phone
            <input
              style={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </label>

          <label style={styles.label}>
            Address
            <textarea
              style={styles.textarea}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              rows={4}
            />
          </label>

          {message ? <div style={styles.success}>{message}</div> : null}
          {error ? <div style={styles.error}>{error}</div> : null}

          <div style={styles.row}>
            <button type="submit" style={styles.primaryBtn} disabled={busy}>
              {busy ? "Saving..." : "Save profile"}
            </button>
            <a href="/master" style={styles.linkBtn}>Back to master</a>
            <button type="button" style={styles.secondaryBtn} onClick={handleLogout} disabled={busy}>
              Logout
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    padding: 24,
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    background: "rgba(255,255,255,0.52)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(216,200,167,0.78)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: 34,
    color: "#1f2937",
  },
  subtle: {
    margin: 0,
    color: "#6b7280",
    fontSize: 18,
  },
  infoBox: {
    background: "rgba(243,244,246,0.66)",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(229,231,235,0.8)",
    borderRadius: 10,
    padding: 14,
    display: "grid",
    gap: 8,
    fontSize: 18,
    marginBottom: 18,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 8,
    fontSize: 18,
    color: "#111827",
  },
  input: {
    padding: "12px 14px",
    fontSize: 18,
    borderRadius: 10,
    border: "1px solid #c7b89a",
    background: "#ffffff",
  },
  textarea: {
    padding: "12px 14px",
    fontSize: 18,
    borderRadius: 10,
    border: "1px solid #c7b89a",
    background: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  row: {
    marginTop: 6,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryBtn: {
    padding: "12px 16px",
    fontSize: 18,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#1d4ed8",
    color: "white",
    fontWeight: 700,
  },
  secondaryBtn: {
    padding: "12px 16px",
    fontSize: 18,
    borderRadius: 10,
    border: "1px solid #c7b89a",
    cursor: "pointer",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 700,
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#1d4ed8",
    fontSize: 17,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
};
