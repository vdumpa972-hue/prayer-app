'use client';

import { CSSProperties, FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { getCurrentUserProfile, signOutUser, subscribeToAuth, AppUserProfile } from "@/lib/auth";
import {
  ManagedUserProfile,
  createDummyUserProfile,
  deleteUserProfile,
  loadAllUserProfiles,
  updateUserProfile,
} from "@/lib/owner-users";
import {
  ensureOwnerRoleForAllowedEmail,
  loadOwnerSecuritySettings,
  OwnerSecuritySettings,
  saveOwnerSecuritySettings,
  sha256Hex,
} from "@/lib/owner-security";

type Stats = {
  totalUsers: number;
  paidUsers: number;
  trialUsers: number;
  testUsers: number;
  overdueUsers: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const OWNER_FRESH_LOGIN_MAX_MS = 10 * 60 * 1000;

const emptyForm = {
  email: "",
  fullName: "",
  phone: "",
  address: "",
  role: "user" as "admin" | "user",
  plan: "trial" as "trial" | "paid" | "free",
  billingInterval: "monthly" as "monthly" | "annual" | "none",
  subscriptionStatus: "trialing" as "trialing" | "active" | "overdue" | "canceled" | "free",
  notes: "",
  tempPassword: "",
};

type EditForm = {
  fullName: string;
  phone: string;
  address: string;
  role: "owner" | "admin" | "user";
  plan: "trial" | "paid" | "free";
  billingInterval: "monthly" | "annual" | "none";
  subscriptionStatus: "trialing" | "active" | "overdue" | "canceled" | "free";
  notes: string;
  trialEndDate: string;
  renewalDate: string;
};

function toDateInputValue(timestamp?: number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value: string, endOfDay = false) {
  if (!value) return undefined;
  const suffix = endOfDay ? "T23:59:59" : "T12:00:00";
  const parsed = new Date(`${value}${suffix}`);
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : undefined;
}

function formatDate(timestamp?: number | null) {
  return timestamp ? new Date(timestamp).toLocaleDateString() : "-";
}

function getTrialDaysLeft(user: ManagedUserProfile) {
  if (user.plan !== "trial" || typeof user.trialEnd !== "number") return null;
  const diff = user.trialEnd - Date.now();
  return Math.max(0, Math.ceil(diff / DAY_MS));
}

function makeEditForm(user: ManagedUserProfile): EditForm {
  return {
    fullName: user.fullName || "",
    phone: user.phone || "",
    address: user.address || "",
    role: user.role || "user",
    plan: user.plan || "free",
    billingInterval: user.billingInterval || (user.plan === "paid" ? "monthly" : "none"),
    subscriptionStatus: user.subscriptionStatus || (user.plan === "paid" ? "active" : user.plan === "trial" ? "trialing" : "free"),
    notes: user.notes || "",
    trialEndDate: toDateInputValue(user.trialEnd),
    renewalDate: toDateInputValue(user.renewalDate),
  };
}

function ownerGateKey(email: string) {
  return `owner_gate_ok:${email.trim().toLowerCase()}`;
}

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

function redirectToOwnerLogin() {
  if (typeof window === "undefined") return;
  window.location.replace(`/auth?next=/owner&t=${Date.now()}`);
}

function emailsToTextareaValue(emails: string[]) {
  return emails.join("\n");
}

function parseEmailTextarea(value: string) {
  return Array.from(new Set(value.split(/\r?\n|,/).map((item) => item.trim().toLowerCase()).filter(Boolean)));
}

export default function OwnerDashboardClient() {
  const [authReady, setAuthReady] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerProfile, setOwnerProfile] = useState<AppUserProfile | null>(null);
  const [securitySettings, setSecuritySettings] = useState<OwnerSecuritySettings | null>(null);
  const [ownerEmailsText, setOwnerEmailsText] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [newAccessCode, setNewAccessCode] = useState("");
  const [confirmAccessCode, setConfirmAccessCode] = useState("");
  const [clearAccessCode, setClearAccessCode] = useState(false);
  const [accessCodeRequired, setAccessCodeRequired] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [users, setUsers] = useState<ManagedUserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingUid, setEditingUid] = useState("");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      try {
        if (!user) {
          redirectToOwnerLogin();
          return;
        }

        const normalizedEmail = (user.email || "").trim().toLowerCase();
        setOwnerEmail(normalizedEmail);


        await ensureOwnerRoleForAllowedEmail(user.uid, normalizedEmail);

        const [profile, security] = await Promise.all([
          getCurrentUserProfile(user.uid),
          loadOwnerSecuritySettings(),
        ]);

        const allowed = !!normalizedEmail && security.allowedOwnerEmails.includes(normalizedEmail);
        const effectiveProfile =
          profile ||
          (allowed
            ? {
                uid: user.uid,
                email: normalizedEmail,
                role: "owner" as const,
                plan: "paid" as const,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                billingInterval: "monthly" as const,
                subscriptionStatus: "active" as const,
                subscriptionType: "monthly" as const,
              }
            : null);

        setOwnerProfile(effectiveProfile);
        setSecuritySettings(security);
        setOwnerEmailsText(emailsToTextareaValue(security.allowedOwnerEmails));
        setOwnerPhone(effectiveProfile?.phone || "");

        if (!effectiveProfile || (!allowed && effectiveProfile.role !== "owner")) {
          setError("Owner access only.");
          await signOutUser().catch(() => undefined);
          redirectToOwnerLogin();
          return;
        }

        const gateWasVerified = typeof window !== "undefined" && sessionStorage.getItem(ownerGateKey(normalizedEmail)) === "1";

        if (security.ownerAccessCodeHash && !gateWasVerified) {
          setAccessCodeRequired(true);
          setAuthReady(false);
          return;
        }

        setAccessCodeRequired(false);
        setAuthReady(true);
      } catch (err: any) {
        console.error(err);
        setLoadingUsers(false);
        setAuthReady(false);
        setError(err?.message || "Could not verify owner access.");
      }
    });

    return () => unsub();
  }, []);

  async function refreshUsers() {
    try {
      setLoadingUsers(true);
      const next = await loadAllUserProfiles();
      setUsers(next);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not load users.");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    void refreshUsers();
  }, [authReady]);

  const stats = useMemo<Stats>(() => ({
    totalUsers: users.length,
    paidUsers: users.filter((u) => u.plan === "paid").length,
    trialUsers: users.filter((u) => u.plan === "trial").length,
    testUsers: users.filter((u) => u.isTestUser).length,
    overdueUsers: users.filter((u) => u.subscriptionStatus === "overdue").length,
  }), [users]);

  async function verifyOwnerAccessCode(event: FormEvent) {
    event.preventDefault();
    if (!securitySettings?.ownerAccessCodeHash) {
      setAuthReady(true);
      setAccessCodeRequired(false);
      return;
    }

    try {
      setBusy(true);
      setError("");
      const hashed = await sha256Hex(accessCodeInput.trim());
      if (hashed !== securitySettings.ownerAccessCodeHash) {
        setError("Wrong owner access code.");
        return;
      }
      sessionStorage.setItem(ownerGateKey(ownerEmail), "1");
      consumeFreshOwnerLogin();
      setAccessCodeRequired(false);
      setAuthReady(true);
      setMessage("Owner access verified.");
      setAccessCodeInput("");
    } catch (err: any) {
      setError(err?.message || "Could not verify the owner access code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateDummyUser(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await createDummyUserProfile({
        email: form.email.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        role: form.role,
        plan: form.plan,
        billingInterval: form.billingInterval,
        subscriptionStatus: form.subscriptionStatus,
        notes: form.notes.trim(),
        tempPassword: form.tempPassword,
      });

      setForm(emptyForm);
      setMessage("User created. Give them the email and temporary password, or ask them to use Forgot password.");
      await refreshUsers();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not create test user.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(uid: string, email: string) {
    const protectedUser = users.find((user) => user.uid === uid);
    if (protectedUser?.role === "owner") {
      setError("Owner account is protected and cannot be deleted.");
      return;
    }

    const ok = window.confirm(`Delete user ${email || uid}?`);
    if (!ok) return;

    try {
      setBusy(true);
      setError("");
      setMessage("");
      await deleteUserProfile(uid);
      setMessage("User deleted.");
      if (editingUid === uid) {
        setEditingUid("");
        setEditForm(null);
      }
      await refreshUsers();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not delete user.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(user: ManagedUserProfile) {
    setError("");
    setMessage("");
    setEditingUid(user.uid);
    setEditForm(makeEditForm(user));
  }

  function cancelEdit() {
    setEditingUid("");
    setEditForm(null);
  }

  function extendTrial(days: number) {
    setEditForm((current) => {
      if (!current) return current;
      const base = fromDateInputValue(current.trialEndDate) || Date.now();
      return {
        ...current,
        plan: "trial",
        billingInterval: "none",
        subscriptionStatus: current.subscriptionStatus === "free" ? "trialing" : current.subscriptionStatus,
        trialEndDate: toDateInputValue(base + days * DAY_MS),
      };
    });
  }

  function resetTrialThirtyDays() {
    setEditForm((current) => {
      if (!current) return current;
      return {
        ...current,
        plan: "trial",
        billingInterval: "none",
        subscriptionStatus: "trialing",
        trialEndDate: toDateInputValue(Date.now() + 30 * DAY_MS),
      };
    });
  }

  async function handleSaveSecurity() {
    if (!ownerProfile?.uid) return;

    try {
      setBusy(true);
      setError("");
      setMessage("");

      if (newAccessCode || confirmAccessCode) {
        if (newAccessCode.length < 4) {
          setError("Owner access code must be at least 4 characters.");
          return;
        }
        if (newAccessCode !== confirmAccessCode) {
          setError("Owner access code and confirmation do not match.");
          return;
        }
      }

      const normalizedEmails = parseEmailTextarea(ownerEmailsText);
      const codeHash = clearAccessCode ? null : newAccessCode ? await sha256Hex(newAccessCode.trim()) : undefined;

      await saveOwnerSecuritySettings({
        allowedOwnerEmails: normalizedEmails,
        ownerAccessCodeHash: codeHash,
      });

      await updateUserProfile(ownerProfile.uid, {
        phone: ownerPhone.trim(),
      });

      const refreshedSettings = await loadOwnerSecuritySettings();
      const refreshedProfile = await getCurrentUserProfile(ownerProfile.uid);
      setSecuritySettings(refreshedSettings);
      setOwnerProfile(refreshedProfile);
      setOwnerEmailsText(emailsToTextareaValue(refreshedSettings.allowedOwnerEmails));
      setOwnerPhone(refreshedProfile?.phone || ownerPhone.trim());
      setNewAccessCode("");
      setConfirmAccessCode("");
      setClearAccessCode(false);
      setMessage("Owner security settings updated.");
      await refreshUsers();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not save owner security settings.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(uid: string) {
    if (!editForm) return;

    try {
      setBusy(true);
      setError("");
      setMessage("");

      const existingUser = users.find((user) => user.uid === uid);
      const isOwnerRow = existingUser?.role === "owner";

      const updates: Parameters<typeof updateUserProfile>[1] = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        role: isOwnerRow ? "owner" : editForm.role,
        plan: editForm.plan,
        billingInterval: editForm.billingInterval,
        subscriptionStatus: editForm.subscriptionStatus,
        notes: editForm.notes.trim(),
      };

      if (editForm.plan === "trial") {
        const trialEnd = fromDateInputValue(editForm.trialEndDate, true);
        updates.trialStart = existingUser?.trialStart || Date.now();
        updates.trialEnd = trialEnd || Date.now() + 30 * DAY_MS;
      }

      if (editForm.plan === "paid") {
        const renewalDate = fromDateInputValue(editForm.renewalDate, true);
        updates.memberSince = existingUser?.memberSince || Date.now();
        if (renewalDate) updates.renewalDate = renewalDate;
      }

      await updateUserProfile(uid, updates);
      setMessage(isOwnerRow ? "Owner profile updated." : "User updated.");
      setEditingUid("");
      setEditForm(null);
      const refreshedProfile = ownerProfile?.uid === uid ? await getCurrentUserProfile(uid) : ownerProfile;
      setOwnerProfile(refreshedProfile);
      if (refreshedProfile?.uid === uid) setOwnerPhone(refreshedProfile?.phone || "");
      await refreshUsers();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not update user.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      setBusy(true);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(ownerGateKey(ownerEmail));
      }
      await signOutUser();
      window.location.href = "/auth?next=/owner";
    } catch (err: any) {
      setError(err?.message || "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  if (accessCodeRequired && !authReady) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Owner Access Check</h1>
          <p style={styles.subtle}>Enter the extra owner access code to open account management.</p>
          {error ? <div style={styles.error}>{error}</div> : null}
          {message ? <div style={styles.success}>{message}</div> : null}
          <form onSubmit={verifyOwnerAccessCode} style={styles.formGrid}>
            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Owner access code
              <input style={styles.input} type="password" value={accessCodeInput} onChange={(e) => setAccessCodeInput(e.target.value)} placeholder="Enter owner access code" />
            </label>
            <div style={styles.actionRow}>
              <button type="submit" style={styles.primaryBtn} disabled={busy}>{busy ? "Checking..." : "Open account management"}</button>
              <a href="/master" style={styles.linkBtn}>Back to master</a>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (!authReady) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Owner Account Management</h1>
          <p style={styles.subtle}>Checking owner access...</p>
          {error ? <div style={styles.error}>{error}</div> : null}
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Owner Account Management</h1>
            <p style={styles.subtle}>
              Signed in as {ownerEmail}
              {ownerProfile?.role ? ` (${ownerProfile.role})` : ""}
            </p>
          </div>

          <div style={styles.headerActions}>
            <a href="/master" style={styles.linkBtn}>Open master</a>
            <a href="/profile" style={styles.linkBtn}>My profile</a>
            <button style={styles.secondaryBtn} onClick={handleLogout} disabled={busy}>Logout</button>
          </div>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}
        {message ? <div style={styles.success}>{message}</div> : null}

        <section style={styles.statsGrid}>
          <div style={styles.statCard}><div style={styles.statLabel}>Total users</div><div style={styles.statValue}>{stats.totalUsers}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Paid users</div><div style={styles.statValue}>{stats.paidUsers}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Trial users</div><div style={styles.statValue}>{stats.trialUsers}</div></div>
          <div style={styles.statCard}><div style={styles.statLabel}>Overdue users</div><div style={styles.statValue}>{stats.overdueUsers}</div></div>
        </section>

        <section style={styles.twoCol}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Create user</h2>
                <div style={styles.sectionNote}>Creates a real Firebase login account with the temporary password you enter.</div>
              </div>
            </div>

            <form onSubmit={handleCreateDummyUser} style={styles.formGrid}>
              <label style={styles.label}>Email<input style={styles.input} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="test@example.com" /></label>
              <label style={styles.label}>Full name<input style={styles.input} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Guest User" /></label>
              <label style={styles.label}>Temporary password<input style={styles.input} type="password" value={form.tempPassword} onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))} placeholder="Minimum 6 characters" /></label>
              <label style={styles.label}>Phone<input style={styles.input} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone number" /></label>
              <label style={styles.label}>Address<input style={styles.input} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" /></label>
              <label style={styles.label}>Role<select style={styles.input} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "admin" | "user" }))}><option value="user">user</option><option value="admin">admin</option></select></label>
              <label style={styles.label}>Plan<select style={styles.input} value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as "trial" | "paid" | "free" }))}><option value="trial">trial</option><option value="paid">paid</option><option value="free">free</option></select></label>
              <label style={styles.label}>Billing interval<select style={styles.input} value={form.billingInterval} onChange={(e) => setForm((f) => ({ ...f, billingInterval: e.target.value as "monthly" | "annual" | "none" }))}><option value="monthly">monthly</option><option value="annual">annual</option><option value="none">none</option></select></label>
              <label style={styles.label}>Subscription status<select style={styles.input} value={form.subscriptionStatus} onChange={(e) => setForm((f) => ({ ...f, subscriptionStatus: e.target.value as "trialing" | "active" | "overdue" | "canceled" | "free" }))}><option value="trialing">trialing</option><option value="active">active</option><option value="overdue">overdue</option><option value="canceled">canceled</option><option value="free">free</option></select></label>
              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Notes<textarea style={styles.textarea} rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Internal notes" /></label>
              <div style={styles.actionRow}><button type="submit" style={styles.primaryBtn} disabled={busy}>{busy ? "Working..." : "Create user"}</button></div>
            </form>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Owner security</h2>
                <div style={styles.sectionNote}>Add extra owner emails, keep an owner phone on file, and require an extra access code for /owner.</div>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
                Authorized owner emails (one per line)
                <textarea style={styles.textarea} rows={5} value={ownerEmailsText} onChange={(e) => setOwnerEmailsText(e.target.value)} placeholder="owner@example.com" />
              </label>
              <label style={styles.label}>
                Current owner phone
                <input style={styles.input} value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="Phone for future owner recovery" />
              </label>
              <label style={styles.label}>
                New owner access code
                <input style={styles.input} type="password" value={newAccessCode} onChange={(e) => setNewAccessCode(e.target.value)} placeholder={securitySettings?.ownerAccessCodeHash ? "Leave blank to keep current code" : "Set extra owner access code"} />
              </label>
              <label style={styles.label}>
                Confirm access code
                <input style={styles.input} type="password" value={confirmAccessCode} onChange={(e) => setConfirmAccessCode(e.target.value)} placeholder="Repeat access code" />
              </label>
              <label style={{ ...styles.label, alignContent: "end" }}>
                <span>Clear existing code</span>
                <button type="button" style={clearAccessCode ? styles.primaryBtn : styles.secondaryBtn} onClick={() => setClearAccessCode((v) => !v)}>
                  {clearAccessCode ? "Code will be cleared" : "Keep current code"}
                </button>
              </label>
              <div style={{ ...styles.sectionNote, gridColumn: "1 / -1" }}>
                Real SMS 2-factor login is not live in this ZIP yet. It needs Firebase phone auth or a text provider such as Twilio plus extra setup. I added the owner phone field now so you are ready for that later.
              </div>
              <div style={styles.actionRow}>
                <button type="button" style={styles.primaryBtn} onClick={handleSaveSecurity} disabled={busy}>{busy ? "Saving..." : "Save owner security"}</button>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Clients</h2>
              <div style={styles.sectionNote}>Delete any non-owner account. Owner accounts stay protected.</div>
            </div>
          </div>

          {loadingUsers ? (
            <p style={styles.subtle}>Loading users...</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Plan</th>
                    <th style={styles.th}>Trial end</th>
                    <th style={styles.th}>Days left</th>
                    <th style={styles.th}>Renewal</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isEditing = editingUid === user.uid && !!editForm;
                    const isOwnerRow = user.role === "owner";
                    return (
                      <Fragment key={user.uid}>
                        <tr>
                          <td style={styles.td}>{user.email || user.uid}</td>
                          <td style={styles.td}>{user.role}</td>
                          <td style={styles.td}>{user.plan}</td>
                          <td style={styles.td}>{formatDate(user.trialEnd)}</td>
                          <td style={styles.td}>{getTrialDaysLeft(user) ?? "-"}</td>
                          <td style={styles.td}>{formatDate(user.renewalDate)}</td>
                          <td style={styles.td}>
                            <div style={styles.actionRow}>
                              <button type="button" style={styles.secondaryBtn} onClick={() => startEdit(user)} disabled={busy}>Edit</button>
                              {!isOwnerRow ? (
                                <button type="button" style={styles.deleteBtn} onClick={() => handleDelete(user.uid, user.email)} disabled={busy}>Delete</button>
                              ) : (
                                <span style={styles.sectionNote}>Protected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isEditing ? (
                          <tr>
                            <td style={styles.editCell} colSpan={7}>
                              <div style={styles.editPanel}>
                                <div style={styles.editPanelHeader}>
                                  <div style={styles.editTitle}>{isOwnerRow ? "Edit owner" : "Edit user"}</div>
                                  <div style={styles.actionRow}>
                                    <button type="button" style={styles.primaryBtn} onClick={() => handleSaveEdit(user.uid)} disabled={busy}>{busy ? "Saving..." : "Save"}</button>
                                    <button type="button" style={styles.secondaryBtn} onClick={cancelEdit} disabled={busy}>Cancel</button>
                                  </div>
                                </div>

                                <div style={styles.formGrid}>
                                  <label style={styles.label}>Full name<input style={styles.input} value={editForm!.fullName} onChange={(e) => setEditForm((f) => f ? { ...f, fullName: e.target.value } : f)} /></label>
                                  <label style={styles.label}>Phone<input style={styles.input} value={editForm!.phone} onChange={(e) => setEditForm((f) => f ? { ...f, phone: e.target.value } : f)} /></label>
                                  <label style={styles.label}>Address<input style={styles.input} value={editForm!.address} onChange={(e) => setEditForm((f) => f ? { ...f, address: e.target.value } : f)} /></label>
                                  <label style={styles.label}>Role<select style={styles.input} value={editForm!.role} disabled={isOwnerRow} onChange={(e) => setEditForm((f) => f ? { ...f, role: e.target.value as "owner" | "admin" | "user" } : f)}><option value="user">user</option><option value="admin">admin</option><option value="owner">owner</option></select></label>
                                  <label style={styles.label}>Plan<select style={styles.input} value={editForm!.plan} onChange={(e) => setEditForm((f) => {
                                      if (!f) return f;
                                      const plan = e.target.value as "trial" | "paid" | "free";
                                      return {
                                        ...f,
                                        plan,
                                        billingInterval: plan === "paid" ? (f.billingInterval === "annual" ? "annual" : "monthly") : "none",
                                        subscriptionStatus: plan === "paid" ? "active" : plan === "trial" ? "trialing" : "free",
                                        trialEndDate: plan === "trial" ? (f.trialEndDate || toDateInputValue(Date.now() + 30 * DAY_MS)) : "",
                                      };
                                    })}><option value="trial">trial</option><option value="paid">paid</option><option value="free">free</option></select></label>
                                  <label style={styles.label}>Billing interval<select style={styles.input} value={editForm!.billingInterval} disabled={editForm!.plan !== "paid"} onChange={(e) => setEditForm((f) => f ? { ...f, billingInterval: e.target.value as "monthly" | "annual" | "none" } : f)}><option value="monthly">monthly</option><option value="annual">annual</option><option value="none">none</option></select></label>
                                  <label style={styles.label}>Subscription status<select style={styles.input} value={editForm!.subscriptionStatus} onChange={(e) => setEditForm((f) => f ? { ...f, subscriptionStatus: e.target.value as "trialing" | "active" | "overdue" | "canceled" | "free" } : f)}><option value="trialing">trialing</option><option value="active">active</option><option value="overdue">overdue</option><option value="canceled">canceled</option><option value="free">free</option></select></label>

                                  {editForm!.plan === "trial" ? (
                                    <>
                                      <label style={styles.label}>Trial end date<input style={styles.input} type="date" value={editForm!.trialEndDate} onChange={(e) => setEditForm((f) => f ? { ...f, trialEndDate: e.target.value } : f)} /></label>
                                      <div style={styles.label}>Quick trial actions<div style={styles.inlineActionWrap}><button type="button" style={styles.quickBtn} onClick={() => extendTrial(7)}>+7 days</button><button type="button" style={styles.quickBtn} onClick={() => extendTrial(30)}>+30 days</button><button type="button" style={styles.quickBtn} onClick={resetTrialThirtyDays}>Reset 30 days</button></div></div>
                                    </>
                                  ) : null}

                                  {editForm!.plan === "paid" ? (
                                    <label style={styles.label}>Renewal date<input style={styles.input} type="date" value={editForm!.renewalDate} onChange={(e) => setEditForm((f) => f ? { ...f, renewalDate: e.target.value } : f)} /></label>
                                  ) : null}

                                  <label style={{ ...styles.label, gridColumn: "1 / -1" }}>Notes<textarea style={styles.textarea} rows={3} value={editForm!.notes} onChange={(e) => setEditForm((f) => f ? { ...f, notes: e.target.value } : f)} /></label>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "transparent", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" },
  shell: { maxWidth: 1440, margin: "0 auto", display: "grid", gap: 18 },
  card: { maxWidth: 560, margin: "80px auto", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(216,200,167,0.78)", borderRadius: 16, padding: 24, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(229,231,235,0.8)", borderRadius: 16, padding: 20 },
  headerActions: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  title: { margin: 0, fontSize: 34, color: "#111827" },
  subtle: { margin: "8px 0 0 0", color: "#6b7280", fontSize: 16 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 },
  statCard: { background: "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)", border: "1px solid rgba(229,231,235,0.8)", borderRadius: 16, padding: 18 },
  statLabel: { color: "#6b7280", fontSize: 15 },
  statValue: { marginTop: 8, fontSize: 32, fontWeight: 700, color: "#111827" },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 },
  sectionCard: { background: "rgba(255,255,255,0.55)", backdropFilter: "blur(4px)", border: "1px solid rgba(229,231,235,0.8)", borderRadius: 16, padding: 18 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 },
  sectionTitle: { margin: 0, fontSize: 22, color: "#111827" },
  sectionNote: { color: "#6b7280", fontSize: 14 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  label: { display: "grid", gap: 8, fontSize: 15, color: "#111827" },
  input: { padding: "12px 14px", fontSize: 16, borderRadius: 10, border: "1px solid #cbd5e1", background: "#ffffff" },
  textarea: { padding: "12px 14px", fontSize: 16, borderRadius: 10, border: "1px solid #cbd5e1", background: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" },
  primaryBtn: { padding: "12px 16px", fontSize: 16, borderRadius: 10, border: "none", cursor: "pointer", background: "#1d4ed8", color: "white", fontWeight: 700 },
  secondaryBtn: { border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 15 },
  deleteBtn: { border: "1px solid #ef4444", background: "#fff5f5", color: "#b91c1c", borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontSize: 14 },
  quickBtn: { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 10, padding: "9px 12px", cursor: "pointer", fontSize: 14, fontWeight: 700 },
  inlineActionWrap: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  editCell: { padding: "0 12px 16px 12px", borderBottom: "1px solid rgba(241,245,249,0.8)", background: "rgba(252,252,255,0.48)" },
  editPanel: { border: "1px solid rgba(219,228,255,0.82)", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(6px)", borderRadius: 16, padding: 16, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)" },
  editPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 },
  editTitle: { fontSize: 20, fontWeight: 700, color: "#111827" },
  linkBtn: { color: "#1d4ed8", textDecoration: "underline", fontSize: 15 },
  error: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 10, padding: 12, fontSize: 16 },
  success: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12, fontSize: 16 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(229,231,235,0.8)", color: "#374151", fontSize: 14, background: "rgba(249,250,251,0.7)" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#111827", fontSize: 14, verticalAlign: "top" },
};
