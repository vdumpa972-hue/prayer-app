import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Prayer Companion',
  description: 'Terms of Service for Prayer Companion',
};

const updated = 'June 18, 2026';

export default function TermsPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <Link href="/" style={backLinkStyle}>← Back to Prayer Companion</Link>
        <h1 style={titleStyle}>Terms of Service</h1>
        <p style={mutedStyle}>Last updated: {updated}</p>
        <p style={paragraphStyle}>These Terms of Service describe the rules for using Prayer Companion. By using the app, you agree to use it responsibly and follow applicable laws and app store policies.</p>
        <h2 style={headingStyle}>Use of the app</h2>
        <p style={paragraphStyle}>Prayer Companion is provided for organizing prayers, sermons, speeches, spiritual readings, and live group prayer sessions. You are responsible for the content you upload, import, save, or share through the app.</p>
        <h2 style={headingStyle}>Accounts</h2>
        <p style={paragraphStyle}>You must provide accurate information when creating an account. Keep your login credentials secure. You are responsible for activity that occurs under your account.</p>
        <h2 style={headingStyle}>User content</h2>
        <ul style={listStyle}>
          <li>Do not upload illegal, harmful, abusive, or infringing content.</li>
          <li>Only upload or import content that you have permission to use.</li>
          <li>You remain responsible for your prayer libraries, sermons, speeches, and saved sequences.</li>
        </ul>
        <h2 style={headingStyle}>Subscriptions and trials</h2>
        <p style={paragraphStyle}>If paid plans or subscriptions are enabled, pricing, renewal, cancellation, and refund rules may be handled by the app store or payment provider used at purchase time. Trial access may be limited or changed at any time.</p>
        <h2 style={headingStyle}>No professional advice</h2>
        <p style={paragraphStyle}>Prayer Companion is a software tool. It does not provide religious, legal, medical, financial, or professional advice.</p>
        <h2 style={headingStyle}>Availability</h2>
        <p style={paragraphStyle}>We work to keep the app available, but service may be interrupted for maintenance, updates, internet issues, or third-party service outages.</p>
        <h2 style={headingStyle}>Changes</h2>
        <p style={paragraphStyle}>We may update these terms as the app changes. Continued use of the app after updates means you accept the updated terms.</p>
        <h2 style={headingStyle}>Contact</h2>
        <p style={paragraphStyle}>For questions about these terms, contact: <a href="mailto:vdumpa972@gmail.com" style={linkStyle}>vdumpa972@gmail.com</a></p>
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
