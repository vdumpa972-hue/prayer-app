"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { get, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { AppUserProfile, getCurrentUserProfile, isTrialExpired, signOutUser, subscribeToAuth } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { getDisplayRole } from "@/lib/i18n";

const DEBUG_TRACE_STORAGE_KEY = "prayer_debug_trace_enabled";
const DEBUG_TRACE_CHANGED_EVENT = "prayer-debug-trace-changed";
const OWNER_FRESH_LOGIN_MAX_MS = 2 * 60 * 1000;


type CustomerRow = AppUserProfile & { uid: string };

function hasFreshOwnerLogin(email: string) {
  if (typeof window === "undefined") return false;
  const normalizedEmail = email.trim().toLowerCase();
  const freshAtRaw = window.sessionStorage.getItem("ownerFreshAuthAt");
  const freshEmail = (window.sessionStorage.getItem("ownerFreshAuthEmail") || "").trim().toLowerCase();
  const freshAt = freshAtRaw ? Number(freshAtRaw) : 0;

  if (!freshAt || Number.isNaN(freshAt)) return false;
  if (freshEmail !== normalizedEmail) return false;
  return Date.now() - freshAt <= OWNER_FRESH_LOGIN_MAX_MS;
}

function consumeFreshOwnerLogin() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("ownerFreshAuthAt");
  window.sessionStorage.removeItem("ownerFreshAuthEmail");
}

function sendToFreshOwnerLogin() {
  if (typeof window === "undefined") return;
  consumeFreshOwnerLogin();
  const nonce = Date.now();
  window.location.replace(`/auth?next=/super-admin&ownerRelogin=1&t=${nonce}`);
}

const links = [
  { key: "runMaster", href: "/master" },
  { key: "masterFeatures", href: "/master" },
  { key: "follower", href: "/follower" },
  { key: "accountManagement", href: "/owner" },
  { key: "login", href: "/auth?next=/super-admin&ownerRelogin=1" },
] as const;

function formatDate(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Date(value).toLocaleDateString();
}

function getTrialLabel(profile: AppUserProfile) {
  if (profile.plan !== "trial") return "—";
  return isTrialExpired(profile) ? "Expired" : "Active";
}

function getPlanLabel(profile: AppUserProfile) {
  if (profile.plan === "paid") {
    if (profile.billingInterval === "annual") return "Paid annual";
    if (profile.billingInterval === "monthly") return "Paid monthly";
    return "Paid";
  }
  if (profile.plan === "trial") return "Trial";
  return "Free";
}

export default function SuperAdminPage() {
  const { t, language } = useLanguage();
  const [debugTraceEnabled, setDebugTraceEnabled] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(DEBUG_TRACE_STORAGE_KEY);
    setDebugTraceEnabled(saved === null ? true : saved === "true");
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      try {
        if (!user) {
          sendToFreshOwnerLogin();
          return;
        }

        const normalizedEmail = (user.email || "").trim().toLowerCase();

        if (!hasFreshOwnerLogin(normalizedEmail)) {
          await signOutUser().catch(() => undefined);
          sendToFreshOwnerLogin();
          return;
        }

        const profile = await getCurrentUserProfile(user.uid);

        if (!profile || profile.role !== "owner") {
          consumeFreshOwnerLogin();
          await signOutUser().catch(() => undefined);
          sendToFreshOwnerLogin();
          return;
        }

        // Super-admin must never reuse an old browser session.
        // The fresh-login marker is accepted once, then cleared.
        consumeFreshOwnerLogin();
        setIsOwner(true);
        setAuthReady(true);
      } catch (error) {
        console.error("Super-admin auth check failed", error);
        consumeFreshOwnerLogin();
        await signOutUser().catch(() => undefined);
        sendToFreshOwnerLogin();
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !isOwner) return;

    let cancelled = false;

    async function loadCustomers() {
      try {
        setCustomersLoading(true);
        setCustomersError("");
        const snapshot = await get(ref(db, "users"));
        const rawUsers = snapshot.val() || {};

        const rows = Object.entries(rawUsers)
          .map(([uid, value]: [string, any]) => {
            const profile = value?.profile || value;
            if (!profile || typeof profile !== "object") return null;
            return { ...(profile as AppUserProfile), uid } as CustomerRow;
          })
          .filter(Boolean) as CustomerRow[];

        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        if (!cancelled) setCustomers(rows);
      } catch (error: any) {
        console.error("Failed to load customers", error);
        if (!cancelled) setCustomersError(error?.message || "Could not load customers.");
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    }

    void loadCustomers();
    return () => {
      cancelled = true;
    };
  }, [authReady, isOwner]);

  const customerStats = useMemo(() => {
    const total = customers.length;
    const paid = customers.filter((customer) => customer.plan === "paid").length;
    const trial = customers.filter((customer) => customer.plan === "trial" && !isTrialExpired(customer)).length;
    const expiredTrial = customers.filter((customer) => customer.plan === "trial" && isTrialExpired(customer)).length;
    const free = customers.filter((customer) => customer.plan === "free").length;
    return { total, paid, trial, expiredTrial, free };
  }, [customers]);

  const toggleDebugTrace = () => {
    const next = !debugTraceEnabled;
    setDebugTraceEnabled(next);
    window.localStorage.setItem(DEBUG_TRACE_STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent(DEBUG_TRACE_CHANGED_EVENT, { detail: next }));
  };

  if (!authReady) {
    return (
      <main style={{ ...styles.page, direction: language === "he" ? "rtl" : "ltr" }}>
        <section style={styles.card}>
          <h1 style={styles.title}>Checking super-admin login...</h1>
          <p style={styles.subtitle}>This page requires a new owner login every time.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ ...styles.page, direction: language === "he" ? "rtl" : "ltr" }}>
      <section style={styles.card}>
        <div style={styles.badge}>{t("superAdmin.badge")}</div>
        <h1 style={styles.title}>{t("superAdmin.title")}</h1>
        <p style={styles.subtitle}>{t("superAdmin.subtitle")}</p>

        <div style={styles.panelGrid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>{t("superAdmin.languageTitle")}</h2>
            <p style={styles.panelText}>{t("superAdmin.languageText")}</p>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>{t("superAdmin.debugTitle")}</h2>
            <p style={styles.panelText}>{t("superAdmin.debugText")}</p>
            <button type="button" onClick={toggleDebugTrace} style={debugTraceEnabled ? styles.toggleOn : styles.toggleOff}>
              {debugTraceEnabled ? t("superAdmin.debugOn") : t("superAdmin.debugOff")}
            </button>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>{t("superAdmin.roleMapTitle")}</h2>
            <p style={styles.roleLine}>{t("superAdmin.ownerMap")}</p>
            <p style={styles.roleLine}>{t("superAdmin.adminMap")}</p>
            <p style={styles.roleLine}>{t("superAdmin.userMap")}</p>
          </div>
        </div>

        <div style={styles.actions}>
          {links.map((button) => (
            <Link key={`${button.key}-${button.href}`} href={button.href} style={styles.button}>
              {t(`superAdmin.${button.key}`)}
            </Link>
          ))}
        </div>

        <div style={styles.customerSection}>
          <h2 style={styles.customerTitle}>Customers Overview</h2>
          <p style={styles.customerText}>Read-only customer, trial, and payment status snapshot.</p>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}><strong>{customerStats.total}</strong><span>Total users</span></div>
            <div style={styles.statCard}><strong>{customerStats.paid}</strong><span>Paying</span></div>
            <div style={styles.statCard}><strong>{customerStats.trial}</strong><span>Active trials</span></div>
            <div style={styles.statCard}><strong>{customerStats.expiredTrial}</strong><span>Expired trials</span></div>
            <div style={styles.statCard}><strong>{customerStats.free}</strong><span>Free/basic</span></div>
          </div>

          {customersLoading ? (
            <div style={styles.infoNotice}>Loading customers...</div>
          ) : customersError ? (
            <div style={styles.errorNotice}>{customersError}</div>
          ) : customers.length === 0 ? (
            <div style={styles.infoNotice}>No customer records found yet.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Plan</th>
                    <th style={styles.th}>Subscription</th>
                    <th style={styles.th}>Trial</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Renews / Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.uid}>
                      <td style={styles.td}>{customer.email || "—"}</td>
                      <td style={styles.td}>{customer.fullName || "—"}</td>
                      <td style={styles.td}>{getDisplayRole(customer.role, language)}</td>
                      <td style={styles.td}>{getPlanLabel(customer)}</td>
                      <td style={styles.td}>{customer.subscriptionStatus || customer.subscriptionType || "—"}</td>
                      <td style={styles.td}>{getTrialLabel(customer)}</td>
                      <td style={styles.td}>{formatDate(customer.createdAt || customer.memberSince)}</td>
                      <td style={styles.td}>{formatDate(customer.renewalDate || customer.trialEnd || customer.stripeCurrentPeriodEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "transparent", color: "#111827", fontFamily: "Arial, Helvetica, sans-serif", padding: "72px 20px 48px" },
  card: { maxWidth: 1180, margin: "0 auto", background: "rgba(255, 255, 255, 0.46)", backdropFilter: "blur(6px)", border: "1px solid rgba(216, 200, 167, 0.72)", borderRadius: 22, padding: "36px 28px", boxShadow: "0 8px 28px rgba(0,0,0,0.08)" },
  badge: { display: "inline-block", background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0f172a", borderRadius: 999, padding: "8px 12px", fontWeight: 700, marginBottom: 16 },
  title: { fontSize: 48, lineHeight: 1.05, margin: "0 0 16px 0" },
  subtitle: { fontSize: 20, lineHeight: 1.5, color: "#4b5563", margin: "0 0 24px 0" },
  panelGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 24 },
  panel: { background: "rgba(255,255,255,0.58)", backdropFilter: "blur(4px)", border: "1px solid rgba(229, 231, 235, 0.78)", borderRadius: 16, padding: 18 },
  panelTitle: { fontSize: 20, margin: "0 0 8px", color: "#0f172a" },
  panelText: { fontSize: 15, lineHeight: 1.45, color: "#4b5563", margin: "0 0 12px" },
  roleLine: { fontSize: 15, lineHeight: 1.45, color: "#111827", margin: "6px 0" },
  actions: { display: "flex", gap: 14, flexWrap: "wrap" },
  button: { background: "#111827", color: "white", borderRadius: 12, padding: "14px 18px", textDecoration: "none", fontWeight: 800, fontSize: 17 },
  toggleOn: { background: "#166534", color: "white", border: "1px solid #14532d", borderRadius: 12, padding: "10px 14px", fontWeight: 800, cursor: "pointer" },
  toggleOff: { background: "#ffffff", color: "#111827", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 14px", fontWeight: 800, cursor: "pointer" },
  customerSection: { marginTop: 28, borderTop: "1px solid #e5e7eb", paddingTop: 24 },
  customerTitle: { fontSize: 28, margin: "0 0 6px", color: "#0f172a" },
  customerText: { fontSize: 16, color: "#4b5563", margin: "0 0 16px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 },
  statCard: { background: "rgba(248,250,252,0.68)", backdropFilter: "blur(4px)", border: "1px solid rgba(229, 231, 235, 0.78)", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 6 },
  infoNotice: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a", borderRadius: 12, padding: 14, fontWeight: 700 },
  errorNotice: { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 12, padding: 14, fontWeight: 700 },
  tableWrap: { overflowX: "auto", border: "1px solid rgba(229, 231, 235, 0.78)", borderRadius: 14, background: "rgba(255,255,255,0.68)", backdropFilter: "blur(4px)" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 900 },
  th: { textAlign: "left", padding: "12px 10px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: 13, color: "#374151", whiteSpace: "nowrap" },
  td: { padding: "11px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: "#111827", whiteSpace: "nowrap" },
};
