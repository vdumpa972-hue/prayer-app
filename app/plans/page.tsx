'use client';

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { BillingInterval, getCurrentUserProfile, getPostLoginPath, isTrialExpired, subscribeToAuth, AppUserProfile } from "@/lib/auth";

export default function PlansPage() {
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let redirectTimer: number | null = null;

    const clearRedirectTimer = () => {
      if (redirectTimer !== null) {
        window.clearTimeout(redirectTimer);
        redirectTimer = null;
      }
    };

    const unsub = subscribeToAuth(async (user) => {
      clearRedirectTimer();

      if (!user) {
        // Firebase can briefly report null while restoring a browser session.
        // Do not bounce immediately between /plans and /auth; wait first.
        setReady(false);
        redirectTimer = window.setTimeout(() => {
          window.location.href = "/auth?next=/plans";
        }, 2500);
        return;
      }

      try {
        setUid(user.uid);
        setEmail(user.email || "");
        const loaded = await getCurrentUserProfile(user.uid);
        setProfile(loaded);
        setReady(true);
        if (!loaded) {
          setError(`Signed in with Firebase, but no app profile was found for UID ${user.uid}.`);
        }
      } catch (err: any) {
        setProfile(null);
        setReady(true);
        setError(err?.message || "Could not load account profile.");
      }
    });

    return () => {
      clearRedirectTimer();
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready || !profile) return;
    if (profile.plan === "paid" && !isTrialExpired(profile)) {
      window.location.replace(getPostLoginPath(profile, "/master"));
    }
  }, [ready, profile]);

  const summary = useMemo(() => {
    if (billingInterval === "annual") {
      return {
        title: "Annual plan",
        subtitle: "Best for committed long-term use",
        note: "You will be sent to secure Stripe Checkout for an annual subscription.",
        badge: "Best value",
        bullets: [
          "Best for established use",
          "Less billing administration",
          "Strong fit for recurring prayer leadership",
        ],
      };
    }

    return {
      title: "Monthly plan",
      subtitle: "Flexible month-to-month access",
      note: "You will be sent to secure Stripe Checkout for a monthly subscription.",
      badge: "Flexible",
      bullets: [
        "Start quickly",
        "Easy month-to-month commitment",
        "Good for testing live use before going annual",
      ],
    };
  }, [billingInterval]);

  async function handleCheckout() {
    setError("");
    setMessage("");

    try {
      setBusy(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          email,
          billingInterval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not start Stripe Checkout.");
      }

      if (!data?.url) {
        throw new Error("Stripe Checkout URL was not returned.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message || "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Join / Subscribe</h1>
          <p style={styles.subtle}>Loading your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>Pricing</div>
          <h1 style={styles.heroTitle}>Choose the plan that fits your prayer leadership style.</h1>
          <p style={styles.heroText}>
            Secure Stripe Checkout, clean subscription handling, and simple account management. Signed in as {email}.
          </p>

          <div style={styles.featureStack}>
            <div style={styles.featureCard}>
              <div style={styles.featureTitle}>Secure billing</div>
              <div style={styles.featureText}>Subscription checkout is handled through Stripe.</div>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureTitle}>Simple account control</div>
              <div style={styles.featureText}>Manage billing, trials, and account state from one place.</div>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureTitle}>Follower-ready workflow</div>
              <div style={styles.featureText}>Built for leaders who want followers synced in real time.</div>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h1 style={styles.title}>Join / Subscribe</h1>
          <p style={styles.subtle}>
            Choose Monthly or Annual, then continue to Stripe Checkout.
          </p>

          {profile?.plan === "paid" && profile?.subscriptionStatus === "active" ? (
            <div style={styles.notice}>
              Your account already looks active. You can still open billing and manage it from the subscription page.
            </div>
          ) : null}

          <div style={styles.planGrid}>
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              style={billingInterval === "monthly" ? styles.planCardActive : styles.planCard}
            >
              <div style={styles.planBadge}>Most flexible</div>
              <div style={styles.planTitle}>Monthly</div>
              <div style={styles.planPrice}>$100<span style={styles.planUnit}> / month</span></div>
              <div style={styles.planSubtitle}>Good for getting started with minimal commitment.</div>
            </button>

            <button
              type="button"
              onClick={() => setBillingInterval("annual")}
              style={billingInterval === "annual" ? styles.planCardRecommended : styles.planCard}
            >
              <div style={styles.planBadgeRecommended}>Recommended</div>
              <div style={styles.planTitle}>Annual</div>
              <div style={styles.planPrice}>$1,200<span style={styles.planUnit}> / year</span></div>
              <div style={styles.planSubtitle}>Best for long-term use and cleaner yearly billing.</div>
            </button>
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.summaryHeader}>
              <div>
                <div style={styles.summaryTitle}>{summary.title}</div>
                <div style={styles.summarySubtitle}>{summary.subtitle}</div>
              </div>
              <div style={styles.summaryBadge}>{summary.badge}</div>
            </div>

            <div style={styles.summaryBullets}>
              {summary.bullets.map((bullet) => (
                <div key={bullet} style={styles.summaryBullet}>• {bullet}</div>
              ))}
            </div>

            <div style={styles.summaryNote}>{summary.note}</div>
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}
          {message ? <div style={styles.success}>{message}</div> : null}

          <div style={styles.actionRow}>
            <button type="button" style={styles.primaryBtn} onClick={handleCheckout} disabled={busy}>
              {busy ? "Redirecting..." : `Continue to Stripe Checkout (${billingInterval})`}
            </button>
          </div>

          <div style={styles.linkRow}>
            <a href="/subscription" style={styles.linkBtn}>Manage current subscription</a>
            <a href="/trial" style={styles.linkBtn}>Start 30-Day Trial instead</a>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "transparent",
    padding: "28px 20px",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  shell: {
    maxWidth: 1180,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "0.94fr 1.06fr",
    gap: 24,
    alignItems: "stretch",
  },
  hero: {
    borderRadius: 28,
    padding: 34,
    background: "rgba(15, 23, 42, 0.64)",
    color: "#fff",
    boxShadow: "0 22px 52px rgba(15, 23, 42, 0.22)",
    minHeight: 620,
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.18)",
  },
  eyebrow: {
    display: "inline-flex",
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  heroTitle: {
    margin: "18px 0 14px 0",
    fontSize: 44,
    lineHeight: 1.08,
    fontWeight: 800,
  },
  heroText: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.84)",
  },
  featureStack: {
    display: "grid",
    gap: 14,
    marginTop: 28,
  },
  featureCard: {
    borderRadius: 18,
    padding: 18,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  featureTitle: {
    fontWeight: 800,
    fontSize: 17,
    marginBottom: 6,
  },
  featureText: {
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.5,
    fontSize: 15,
  },
  card: {
    width: "100%",
    background: "rgba(255,255,255,0.52)",
    border: "1px solid rgba(217,214,204,0.78)",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(8px)",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: 40,
    lineHeight: 1.08,
    color: "#0f172a",
  },
  subtle: {
    margin: "0 0 22px 0",
    color: "#64748b",
    fontSize: 17,
    lineHeight: 1.55,
  },
  notice: {
    marginBottom: 18,
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 16,
    padding: 14,
    color: "#92400e",
    fontSize: 15,
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 18,
  },
  planCard: {
    textAlign: "left",
    borderRadius: 22,
    border: "1px solid rgba(214,211,209,0.82)",
    background: "rgba(255,255,255,0.62)",
    padding: 22,
    cursor: "pointer",
    backdropFilter: "blur(4px)",
  },
  planCardActive: {
    textAlign: "left",
    borderRadius: 22,
    border: "2px solid #1d4ed8",
    background: "rgba(239,246,255,0.70)",
    padding: 22,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(29, 78, 216, 0.12)",
    backdropFilter: "blur(4px)",
  },
  planCardRecommended: {
    textAlign: "left",
    borderRadius: 22,
    border: "2px solid #0f172a",
    background: "rgba(248,250,252,0.72)",
    padding: 22,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(15, 23, 42, 0.10)",
    backdropFilter: "blur(4px)",
  },
  planBadge: {
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#4338ca",
    fontWeight: 800,
    fontSize: 12,
    marginBottom: 14,
  },
  planBadgeRecommended: {
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    marginBottom: 14,
  },
  planTitle: {
    fontSize: 30,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 38,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 10,
  },
  planUnit: {
    fontSize: 16,
    fontWeight: 700,
    color: "#64748b",
  },
  planSubtitle: {
    color: "#64748b",
    lineHeight: 1.55,
    fontSize: 15,
  },
  summaryBox: {
    background: "rgba(248,250,252,0.68)",
    border: "1px solid rgba(226,232,240,0.82)",
    borderRadius: 20,
    padding: 20,
    backdropFilter: "blur(4px)",
  },
  summaryHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 6,
  },
  summarySubtitle: {
    color: "#475569",
    fontSize: 16,
  },
  summaryBadge: {
    display: "inline-flex",
    padding: "9px 12px",
    borderRadius: 999,
    background: "#e0e7ff",
    color: "#3730a3",
    fontWeight: 800,
    fontSize: 13,
  },
  summaryBullets: {
    marginTop: 16,
    display: "grid",
    gap: 8,
  },
  summaryBullet: {
    color: "#334155",
    fontSize: 15,
  },
  summaryNote: {
    marginTop: 16,
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 1.55,
  },
  actionRow: {
    marginTop: 18,
  },
  primaryBtn: {
    width: "100%",
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
    padding: "18px 20px",
    cursor: "pointer",
    boxShadow: "0 16px 30px rgba(37, 99, 235, 0.16)",
  },
  linkRow: {
    marginTop: 18,
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
  },
  linkBtn: {
    color: "#1d4ed8",
    textDecoration: "underline",
    fontSize: 16,
    fontWeight: 700,
  },
  error: {
    marginTop: 16,
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
  },
  success: {
    marginTop: 16,
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #a7f3d0",
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
  },
};
