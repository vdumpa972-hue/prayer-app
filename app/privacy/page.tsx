import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Prayer Companion',
  description: 'Privacy Policy for Prayer Companion',
};

const updated = 'June 18, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <Link href="/" style={backLinkStyle}>← Back to Prayer Companion</Link>
        <h1 style={titleStyle}>Privacy Policy</h1>
        <p style={mutedStyle}>Last updated: {updated}</p>
        <p style={paragraphStyle}>Prayer Companion helps users organize prayer libraries, sermons, speeches, and live master/follower prayer sessions. This Privacy Policy explains what information the app collects, how it is used, and how users can contact us.</p>
        <h2 style={headingStyle}>Information we collect</h2>
        <p style={paragraphStyle}>Depending on how you use the app, we may collect:</p>
        <ul style={listStyle}>
          <li>Email address and account information used to create and sign in to an account.</li>
          <li>Profile information you enter, such as name, phone, organization, or notes.</li>
          <li>Prayer libraries, prayers, sermons, speeches, saved sequences, and related content you add or import.</li>
          <li>Session information, such as session codes and current prayer position, used for live master/follower synchronization.</li>
          <li>Technical information needed to run the app, such as device/browser type, basic diagnostics, and security logs.</li>
        </ul>
        <h2 style={headingStyle}>Microphone and voice follow</h2>
        <p style={paragraphStyle}>If you use Voice Follow, the app may request microphone access. Microphone access is used only to support speech recognition or prayer-position tracking while you actively use the feature. You can deny microphone access or disable Voice Follow at any time in your browser or device settings.</p>
        <h2 style={headingStyle}>How we use information</h2>
        <ul style={listStyle}>
          <li>To provide login, account access, and subscription/trial access.</li>
          <li>To save and display your prayer libraries and related content.</li>
          <li>To synchronize live sessions between a master device and follower devices.</li>
          <li>To improve reliability, security, and support.</li>
          <li>To respond to support requests.</li>
        </ul>
        <h2 style={headingStyle}>Data storage and service providers</h2>
        <p style={paragraphStyle}>Prayer Companion uses cloud services such as Firebase for authentication, database storage, and related app functionality. Data is transmitted using secure connections where supported by the service provider.</p>
        <h2 style={headingStyle}>Payments and subscriptions</h2>
        <p style={paragraphStyle}>If payment features are enabled, payment processing may be handled by a third-party payment provider or by the app store platform. We do not store full credit card numbers in the app database.</p>
        <h2 style={headingStyle}>Sharing of information</h2>
        <p style={paragraphStyle}>We do not sell personal information. We may share information only when needed to operate the app, comply with law, protect security, or provide support through trusted service providers.</p>
        <h2 style={headingStyle}>Account deletion and data requests</h2>
        <p style={paragraphStyle}>You may request account deletion, correction, or export of your data by contacting support. Include the email address used for your Prayer Companion account so we can identify the account.</p>
        <h2 style={headingStyle}>Children</h2>
        <p style={paragraphStyle}>Prayer Companion is not directed to children under 13. If you believe a child has provided personal information, contact us so we can review and delete it where appropriate.</p>
        <h2 style={headingStyle}>Contact</h2>
        <p style={paragraphStyle}>For privacy questions or data requests, contact: <a href="mailto:vdumpa972@gmail.com" style={linkStyle}>vdumpa972@gmail.com</a></p>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', padding: '42px 18px', background: '#f8f5ed', color: '#111827' } as const;
const cardStyle = { maxWidth: 920, margin: '0 auto', background: 'rgba(255,255,255,0.9)', border: '1px solid #d8c9ae', borderRadius: 18, padding: 28, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' } as const;
const titleStyle = { margin: '18px 0 8px', fontSize: 42, lineHeight: 1.08 } as const;
const headingStyle = { margin: '28px 0 10px', fontSize: 24 } as const;
const paragraphStyle = { fontSize: 17, lineHeight: 1.6, color: '#374151' } as const;
const mutedStyle = { color: '#6b7280', fontSize: 15, marginBottom: 22 } as const;
const listStyle = { fontSize: 17, lineHeight: 1.6, color: '#374151', paddingLeft: 24 } as const;
const linkStyle = { color: '#1d4ed8' } as const;
const backLinkStyle = { color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' } as const;
