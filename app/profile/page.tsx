'use client';

import { CSSProperties, FormEvent, useEffect, useState } from "react";
import { changeCurrentUserPassword, signOutUser, subscribeToAuth } from "@/lib/auth";
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordMessage("");
    setPasswordError("");

    const trimmedNewPassword = newPassword.trim();

    try {
      if (!currentPassword) {
        throw new Error("Enter your current password.");
      }
      if (trimmedNewPassword.length < 6) {
        throw new Error("New password must be at least 6 characters.");
      }
      if (trimmedNewPassword !== confirmPassword.trim()) {
        throw new Error("New password and confirmation do not match.");
      }

      await changeCurrentUserPassword(currentPassword, trimmedNewPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords(false);
      setPasswordMessage("Password changed successfully.");
    } catch (err: any) {
      const code = err?.code || "";
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setPasswordError("Current password is incorrect.");
      } else if (code.includes("requires-recent-login")) {
        setPasswordError("Please log out, log in again, then change your password.");
      } else {
        setPasswordError(err?.message || "Could not change password.");
      }
    } finally {
      setPasswordBusy(false);
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

        <section style={styles.passwordSection}>
          <h2 style={styles.sectionTitle}>Change password</h2>
          <p style={styles.helpText}>Enter your current password, then type and confirm the new password.</p>

          <form onSubmit={handlePasswordChange} style={styles.form}>
            <label style={styles.label}>
              Current password
              <input
                style={styles.input}
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Current password"
              />
            </label>

            <label style={styles.label}>
              New password
              <input
                style={styles.input}
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="New password"
              />
            </label>

            <label style={styles.label}>
              Confirm new password
              <input
                style={styles.input}
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Confirm new password"
              />
            </label>

            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              Show passwords
            </label>

            {passwordMessage ? <div style={styles.success}>{passwordMessage}</div> : null}
            {passwordError ? <div style={styles.error}>{passwordError}</div> : null}

            <div style={styles.row}>
              <button type="submit" style={styles.primaryBtn} disabled={passwordBusy}>
                {passwordBusy ? "Changing..." : "Change password"}
              </button>
            </div>
          </form>
        </section>
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
  passwordSection: {
    marginTop: 26,
    paddingTop: 22,
    borderTop: "1px solid rgba(216,200,167,0.78)",
  },
  sectionTitle: {
    margin: "0 0 8px 0",
    fontSize: 24,
    color: "#1f2937",
  },
  helpText: {
    margin: "0 0 16px 0",
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 1.4,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 17,
    color: "#111827",
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
