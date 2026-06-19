'use client';

import { FormEvent, useEffect, useState, CSSProperties } from "react";
import {
  AppUserProfile,
  getCurrentUserProfile,
  getPostLoginPath,
  sendResetEmail,
  setPlanCookie,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeToAuth,
} from "@/lib/auth";

type AuthMode = "login" | "signup" | "forgot";

const LAST_LOGIN_EMAIL_KEY = "prayer_last_login_email";
const AUTH_FRESH_LOGIN_EMAIL_KEY = "authFreshLoginEmail";
const GUEST_DEMO_EMAIL = "vdumpa972+guest1@gmail.com";
const GUEST_DEMO_PASSWORD = "liord972";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [ownerReloginClearing, setOwnerReloginClearing] = useState(false);
  const [redirectStopped, setRedirectStopped] = useState(false);

  function getNextPath() {
    if (typeof window === "undefined") return "/master";
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    return next && next.startsWith("/") ? next : "/master";
  }

  function isOwnerRequest() {
    return getNextPath() === "/super-admin";
  }

  function isSuperAdminRequest() {
    return getNextPath() === "/super-admin";
  }

  function requiresOwnerRelogin() {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("ownerRelogin") === "1";
  }

  function requiresFreshLogin() {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    // Only force a sign-out/fresh credential entry when the URL explicitly asks for it.
    // Normal /auth redirects must NOT sign the user out, because protected pages may
    // send the browser here during a temporary auth-state refresh.
    return params.get("forceLogin") === "1" || params.get("ownerRelogin") === "1" || params.get("freshLogin") === "1";
  }

  function clearOwnerFreshLogin() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem("ownerFreshAuthAt");
    window.sessionStorage.removeItem("ownerFreshAuthEmail");
  }

  function markFreshOwnerLogin(emailValue: string) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("ownerFreshAuthAt", String(Date.now()));
    window.sessionStorage.setItem("ownerFreshAuthEmail", emailValue.trim().toLowerCase());
  }

  function clearAuthFreshLogin() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(AUTH_FRESH_LOGIN_EMAIL_KEY);
  }

  function markAuthFreshLogin(emailValue: string) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(AUTH_FRESH_LOGIN_EMAIL_KEY, emailValue.trim().toLowerCase());
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const demoRequested = params.get("demo") === "guest";
    const demoEmail = demoRequested
      ? window.sessionStorage.getItem("prayer_demo_email") || GUEST_DEMO_EMAIL
      : "";
    const demoPassword = demoRequested
      ? window.sessionStorage.getItem("prayer_demo_password") || GUEST_DEMO_PASSWORD
      : "";

    if (demoRequested) {
      setEmail(demoEmail);
      setPassword(demoPassword);
      window.sessionStorage.setItem("prayer_demo_email", demoEmail);
      window.sessionStorage.setItem("prayer_demo_password", demoPassword);
      window.localStorage.setItem(LAST_LOGIN_EMAIL_KEY, demoEmail.trim().toLowerCase());
      setMessage("Guest demo credentials are filled in. Click Login to enter.");
      return;
    }

    const rememberedEmail = window.localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  useEffect(() => {
    if (!requiresFreshLogin()) return;

    clearAuthFreshLogin();
    clearOwnerFreshLogin();
    setOwnerReloginClearing(true);
    setAuthLoading(true);
    setProfile(null);
    setCurrentEmail("");
    setMessage(isSuperAdminRequest() ? "Super-admin fresh login required." : "Please enter your email and password.");

    void signOutUser()
      .catch(() => {
        // Ignore sign-out errors here; the auth listener below will settle the page state.
      })
      .finally(() => {
        setOwnerReloginClearing(false);
        setAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      setAuthLoading(true);
      setRedirectStopped(false);

      if (!user) {
        setOwnerReloginClearing(false);
        setCurrentEmail("");
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      if (requiresFreshLogin()) {
        const freshEmailForLogin = typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_FRESH_LOGIN_EMAIL_KEY) : null;
        const normalizedUserEmail = (user.email || "").trim().toLowerCase();

        if (!freshEmailForLogin || freshEmailForLogin !== normalizedUserEmail) {
          clearAuthFreshLogin();
          clearOwnerFreshLogin();
          setOwnerReloginClearing(true);
          setCurrentEmail("");
          setProfile(null);
          await signOutUser().catch(() => undefined);
          setAuthLoading(false);
          return;
        }
      }

      if (requiresOwnerRelogin()) {
        const freshAt = typeof window !== "undefined" ? window.sessionStorage.getItem("ownerFreshAuthAt") : null;
        const freshEmail = typeof window !== "undefined" ? window.sessionStorage.getItem("ownerFreshAuthEmail") : null;
        const normalizedUserEmail = (user.email || "").trim().toLowerCase();

        if (!freshAt || freshEmail !== normalizedUserEmail) {
          clearOwnerFreshLogin();
          setOwnerReloginClearing(true);
          setCurrentEmail("");
          setProfile(null);
          await signOutUser().catch(() => undefined);
          setAuthLoading(false);
          return;
        }
      }

      setOwnerReloginClearing(false);
      setCurrentEmail(user.email || "");
      try {
        const loadedProfile = await getCurrentUserProfile(user.uid);

        if (!loadedProfile) {
          setProfile(null);
          setError(`Signed in with Firebase, but no app profile was found in the database for UID ${user.uid}. Login stopped so this message stays visible.`);
          setMessage("");
          setAuthLoading(false);
          return;
        }

        setProfile(loadedProfile);
      } catch (err: any) {
        setProfile(null);
        setError(`Signed in with Firebase, but the app could not read the user profile: ${err?.message || "Unknown database error"}. Login stopped so this message stays visible.`);
        setMessage("");
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authLoading && profile) {
      setPlanCookie(profile);
      setRedirectStopped(false);

      const requestedPath = getNextPath();
      if ((requestedPath === "/owner" || requestedPath === "/super-admin") && profile.role !== "owner") {
        setRedirectStopped(true);
        setError(`Signed in, but this account is not allowed to open ${requestedPath}. Role is "${profile.role}" and plan is "${profile.plan}". Redirect stopped so this message stays visible.`);
        setMessage("Login succeeded, but access was blocked by the app role check.");
        return;
      }

      if (requiresFreshLogin()) {
        const freshEmailForLogin = typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_FRESH_LOGIN_EMAIL_KEY) : null;
        const normalizedCurrent = (profile.email || "").trim().toLowerCase();
        if (!freshEmailForLogin || freshEmailForLogin !== normalizedCurrent) {
          return;
        }
      }

      if (requiresOwnerRelogin()) {
        const freshAt = typeof window !== "undefined" ? window.sessionStorage.getItem("ownerFreshAuthAt") : null;
        const freshEmail = typeof window !== "undefined" ? window.sessionStorage.getItem("ownerFreshAuthEmail") : null;
        const normalizedCurrent = (profile.email || "").trim().toLowerCase();
        if (!freshAt || freshEmail !== normalizedCurrent) {
          return;
        }
      }

      const timer = window.setTimeout(() => {
        window.location.href = getPostLoginPath(profile, getNextPath());
      }, 400);

      return () => window.clearTimeout(timer);
    }
  }, [authLoading, profile]);

  function resetAlerts() {
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    resetAlerts();

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail && typeof window !== "undefined") {
      window.localStorage.setItem(LAST_LOGIN_EMAIL_KEY, cleanEmail);
    }

    if (!cleanEmail) {
      setError("Enter your email.");
      return;
    }

    if (mode !== "forgot" && !password) {
      setError("Enter your password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      setBusy(true);

      if (mode === "login") {
        markAuthFreshLogin(cleanEmail);
        // Super-admin must NOT reuse an old Firebase browser session.
        // Mark this email before sign-in so /super-admin can distinguish this fresh
        // credential entry from an old remembered login. If sign-in fails, clear it below.
        if (isSuperAdminRequest()) {
          markFreshOwnerLogin(cleanEmail);
        }
        await signInWithEmail(cleanEmail, password);
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("prayer_demo_email");
          window.sessionStorage.removeItem("prayer_demo_password");
        }
        setMessage("Signed in.");
      } else if (mode === "signup") {
        markAuthFreshLogin(cleanEmail);
        await signUpWithEmail(cleanEmail, password);
        setMessage("Account created.");
      } else {
        await sendResetEmail(cleanEmail);
        setMessage("Password reset email sent.");
      }
    } catch (err: any) {
      clearAuthFreshLogin();
      if (isSuperAdminRequest()) {
        clearOwnerFreshLogin();
      }
      const code = err?.code || "";
      const friendly =
        code === "auth/email-already-in-use"
          ? "That email already has an account."
          : code === "auth/invalid-email"
          ? "That email address is invalid."
          : code === "auth/user-not-found"
          ? "No user found with that email."
          : code === "auth/wrong-password"
          ? "Wrong password."
          : code === "auth/invalid-credential"
          ? "Wrong email or password."
          : code === "auth/too-many-requests"
          ? "Too many attempts. Try again later."
          : err?.message || "Authentication failed.";

      setError(friendly);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    resetAlerts();
    clearOwnerFreshLogin();
    try {
      setBusy(true);
      await signOutUser();
      setMessage("Signed out.");
    } catch (err: any) {
      setError(err?.message || "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    resetAlerts();
  }

  if (authLoading || ownerReloginClearing) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Prayer Companion</h1>
          <p style={styles.subtle}>Loading account...</p>
        </div>
      </main>
    );
  }

  if (profile) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Welcome</h1>
          <p style={styles.text}><strong>Email:</strong> {currentEmail}</p>
          <p style={styles.text}><strong>Role:</strong> {profile.role}</p>
          <p style={styles.text}><strong>Plan:</strong> {profile.plan}</p>

          {message ? <div style={styles.success}>{message}</div> : null}
          {error ? <div style={styles.error}>{error}</div> : null}
          {!redirectStopped && !error ? <div style={styles.success}>Redirecting...</div> : null}

          <div style={styles.row}>
            <button style={styles.primaryBtn} onClick={handleLogout} disabled={busy}>
              {busy ? "Working..." : "Logout"}
            </button>
            <a href={getPostLoginPath(profile, getNextPath())} style={styles.linkBtn}>Continue</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{isSuperAdminRequest() ? "Super Admin Login" : getNextPath() === "/owner" ? "Owner Login" : "Prayer Companion Login"}</h1>
        <p style={styles.subtle}>
          {mode === "login"
            ? (isOwnerRequest() ? "Sign in with an authorized owner account." : "Sign in to your account.")
            : mode === "signup"
            ? "Create a basic account."
            : "Reset your password by email."}
        </p>
        {isOwnerRequest() ? (
          <div style={styles.ownerNotice}>{isSuperAdminRequest() ? "Super-admin area requires a new login every time." : "Owner area requires a fresh login."}</div>
        ) : null}

        <div style={styles.ctaRow}>
          <a href="/trial?fresh=1" style={styles.ctaBtn}>Start 30-Day Trial</a>
          <a href="/plans" style={styles.ctaBtnSecondary}>Join / Subscribe</a>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => {
                const nextEmail = e.target.value;
                setEmail(nextEmail);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(LAST_LOGIN_EMAIL_KEY, nextEmail.trim().toLowerCase());
                }
              }}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          {mode !== "forgot" && (
            <label style={styles.label}>
              Password
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Password"
              />
            </label>
          )}

          {mode === "signup" && (
            <label style={styles.label}>
              Confirm password
              <input
                style={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
              />
            </label>
          )}

          {error ? <div style={styles.error}>{error}</div> : null}
          {message ? <div style={styles.success}>{message}</div> : null}

          <button type="submit" style={styles.primaryBtn} disabled={busy}>
            {busy
              ? "Working..."
              : mode === "login"
              ? "Login"
              : mode === "signup"
              ? "Create basic account"
              : "Send reset email"}
          </button>
        </form>

        <div style={styles.links}>
          {mode !== "login" && (
            <button type="button" style={styles.linkBtnButton} onClick={() => switchMode("login")} disabled={busy}>
              Back to login
            </button>
          )}
          {mode !== "signup" && (
            <button type="button" style={styles.linkBtnButton} onClick={() => switchMode("signup")} disabled={busy}>
              Create basic account
            </button>
          )}
          {mode !== "forgot" && (
            <button type="button" style={styles.linkBtnButton} onClick={() => switchMode("forgot")} disabled={busy}>
              Forgot password
            </button>
          )}
        </div>
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
    maxWidth: 520,
    background: "rgba(255, 253, 248, 0.82)",
    border: "1px solid #d8c8a7",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
  title: { margin: "0 0 8px 0", fontSize: 34, color: "#1f2937" },
  subtle: { margin: "0 0 20px 0", color: "#6b7280", fontSize: 18 },
  text: { fontSize: 18, margin: "10px 0", color: "#111827" },
  ctaRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 },
  ctaBtn: {
    textAlign: "center",
    padding: "12px 14px",
    fontSize: 16,
    borderRadius: 10,
    background: "#111827",
    color: "white",
    textDecoration: "none",
    fontWeight: 700,
  },
  ctaBtnSecondary: {
    textAlign: "center",
    padding: "12px 14px",
    fontSize: 16,
    borderRadius: 10,
    background: "#e0f2fe",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 700,
    border: "1px solid #bae6fd",
  },
  form: { display: "grid", gap: 16 },
  label: { display: "grid", gap: 8, fontSize: 18, color: "#111827" },
  input: {
    padding: "12px 14px",
    fontSize: 18,
    borderRadius: 10,
    border: "1px solid #c7b89a",
    outline: "none",
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
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#1d4ed8",
    fontSize: 17,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  linkBtnButton: {
    background: "transparent",
    border: "none",
    color: "#1d4ed8",
    fontSize: 17,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  links: { marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap" },
  row: { marginTop: 18, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
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
  ownerNotice: {
    marginBottom: 16,
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
};
