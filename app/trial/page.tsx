'use client';

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { signOutUser, signUpTrialWithEmail } from "@/lib/auth";

export default function TrialPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("authFreshLoginEmail");
      window.sessionStorage.removeItem("ownerFreshAuthAt");
      window.sessionStorage.removeItem("ownerFreshAuthEmail");
    }

    void signOutUser().catch(() => undefined);
  }, []);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const trialSummary = useMemo(() => {
    return "This creates a trial account with a 30-day window saved in your user profile.";
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim()) return setError("Enter your email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    try {
      setBusy(true);
      await signUpTrialWithEmail(email.trim().toLowerCase(), password, fullName.trim());
      window.location.href = "/subscription";
    } catch (err: any) {
      setError(err?.message || "Could not start trial.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.card}>
          <h1 style={styles.title}>Start 30-Day Trial</h1>
          <p style={styles.subtle}>
            Try the app first. The trial status and end date are saved in your account now.
          </p>

          <div style={styles.summaryBox}>{trialSummary}</div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Full name
              <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </label>

            <label style={styles.label}>
              Email
              <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>

            <label style={styles.label}>
              Password
              <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            </label>

            <label style={styles.label}>
              Confirm password
              <input style={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
            </label>

            {error ? <div style={styles.error}>{error}</div> : null}

            <button type="submit" style={styles.primaryBtn} disabled={busy}>
              {busy ? "Working..." : "Create trial account"}
            </button>
          </form>

          <div style={styles.links}>
            <a href="/auth?forceLogin=1" style={styles.linkBtn}>Back to login</a>
            <a href="/plans" style={styles.linkBtn}>Join / Subscribe instead</a>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "transparent",
    padding: 24,
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  shell: {
    maxWidth: 680,
    margin: "0 auto",
  },
  card: {
    background: "rgba(255,255,255,0.52)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(216,200,167,0.78)",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: 34,
    color: "#1f2937",
  },
  subtle: {
    margin: "0 0 20px 0",
    color: "#6b7280",
    fontSize: 18,
  },
  summaryBox: {
    marginBottom: 18,
    background: "rgba(248,250,252,0.66)",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(229,231,235,0.8)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#334155",
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
  links: {
    marginTop: 20,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  linkBtn: {
    color: "#1d4ed8",
    textDecoration: "underline",
    fontSize: 17,
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
};
