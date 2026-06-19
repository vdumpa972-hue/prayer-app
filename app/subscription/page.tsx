'use client';

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { getCurrentUserProfile, getEffectiveRenewalDate, isTrialExpired, setPlanCookie, signOutUser, subscribeToAuth, AppUserProfile } from "@/lib/auth";

export default function SubscriptionPage() {
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      if (!user) {
        window.location.href = "/auth?next=/subscription";
        return;
      }

      setUid(user.uid);
      setEmail(user.email || "");
      const loaded = await getCurrentUserProfile(user.uid);
      setProfile(loaded);
      setPlanCookie(loaded);
      setReady(true);
    });

    return () => unsub();
  }, []);

  const trialDaysLeft = useMemo(() => {
    if (!profile?.trialEnd) return null;
    const diff = profile.trialEnd - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  }, [profile]);

  const trialExpired = useMemo(() => isTrialExpired(profile), [profile]);
  const effectiveRenewalDate = useMemo(() => getEffectiveRenewalDate(profile), [profile]);

  async function openBillingPortal() {
    setPortalError("");
    try {
      setPortalBusy(true);
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not open billing portal.");
      }

      if (!data?.url) {
        throw new Error("Billing portal URL was not returned.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setPortalError(err?.message || "Could not open billing portal.");
    } finally {
      setPortalBusy(false);
    }
  }

  if (!ready) {
    return <main style={styles.page}><div style={styles.card}><h1 style={styles.title}>Manage Subscription</h1><p style={styles.subtle}>Loading...</p></div></main>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Manage Subscription</h1>
        <p style={styles.subtle}>Signed in as {email}</p>

        <div style={styles.infoBox}>
          <div><strong>Plan:</strong> {profile?.plan || "-"}</div>
          <div><strong>Status:</strong> {profile?.subscriptionStatus || "-"}</div>
          <div><strong>Billing interval:</strong> {profile?.billingInterval || "-"}</div>
          <div><strong>Member since:</strong> {profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString() : "-"}</div>
          <div><strong>Trial ends:</strong> {profile?.trialEnd ? new Date(profile.trialEnd).toLocaleDateString() : "-"}</div>
          <div><strong>Renewal date:</strong> {effectiveRenewalDate ? new Date(effectiveRenewalDate).toLocaleDateString() : "-"}</div>
          <div><strong>Trial days left:</strong> {trialDaysLeft ?? "-"}</div>
          <div><strong>Cancel at period end:</strong> {profile?.cancelAtPeriodEnd ? "yes" : "no"}</div>
          <div><strong>Stripe customer:</strong> {profile?.stripeCustomerId || "-"}</div>
          <div><strong>Stripe subscription:</strong> {profile?.stripeSubscriptionId || "-"}</div>
        </div>

        <div style={styles.notice}>
          Subscription status on this page now comes from Stripe webhooks after checkout and billing events.
        </div>

        {trialExpired ? (
          <div style={styles.warning}>
            Your 30-day trial has ended. To continue using Prayer Master, choose a paid plan below.
          </div>
        ) : null}

        {profile?.plan === "free" ? (
          <div style={styles.warning}>
            This account is on the free/basic plan. Choose a subscription to unlock Prayer Master.
          </div>
        ) : null}

        {portalError ? <div style={styles.error}>{portalError}</div> : null}

        <div style={styles.row}>
          <a href="/plans" style={styles.linkBtn}>Start / change subscription</a>
          {profile?.plan !== "paid" ? <a href="/trial" style={styles.linkBtn}>Start trial flow</a> : null}
          {!trialExpired && profile?.plan !== "free" ? <a href="/master" style={styles.linkBtn}>Back to prayer window</a> : null}
          {profile?.stripeCustomerId ? (
            <button style={styles.primaryBtn} onClick={openBillingPortal} disabled={portalBusy}>
              {portalBusy ? "Opening..." : "Manage Billing"}
            </button>
          ) : null}
          <button style={styles.secondaryBtn} onClick={() => signOutUser().then(() => (window.location.href = "/auth"))}>Logout</button>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" },
  card: { width: "100%", maxWidth: 720, background: "rgba(255,255,255,0.52)", backdropFilter: "blur(6px)", border: "1px solid rgba(216,200,167,0.78)", borderRadius: 16, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
  title: { margin: "0 0 8px 0", fontSize: 34, color: "#1f2937" },
  subtle: { margin: "0 0 20px 0", color: "#6b7280", fontSize: 18 },
  infoBox: { background: "rgba(243,244,246,0.66)", backdropFilter: "blur(4px)", border: "1px solid rgba(229,231,235,0.8)", borderRadius: 12, padding: 16, display: "grid", gap: 8, fontSize: 17, color: "#111827" },
  notice: { marginTop: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, color: "#92400e", fontSize: 16 },
  warning: { marginTop: 16, background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, color: "#991b1b", fontSize: 16 },
  row: { marginTop: 18, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
  linkBtn: { color: "#1d4ed8", textDecoration: "underline", fontSize: 17 },
  primaryBtn: { padding: "10px 14px", fontSize: 15, borderRadius: 10, border: "none", cursor: "pointer", background: "#1d4ed8", color: "#fff", fontWeight: 700 },
  secondaryBtn: { border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 15 },
  error: { marginTop: 16, background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, padding: 12, fontSize: 16 },
};
