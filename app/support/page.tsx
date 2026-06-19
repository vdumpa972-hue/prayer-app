import Link from 'next/link';

export const metadata = {
  title: 'Support | Prayer Companion',
  description: 'Support page for Prayer Companion',
};

export default function SupportPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <Link href="/" style={backLinkStyle}>← Back to Prayer Companion</Link>
        <h1 style={titleStyle}>Support</h1>
        <p style={paragraphStyle}>Need help with Prayer Companion? Use this page for app store support, account help, bug reports, and general questions.</p>
        <h2 style={headingStyle}>Contact support</h2>
        <p style={paragraphStyle}>Email: <a href="mailto:vdumpa972@gmail.com" style={linkStyle}>vdumpa972@gmail.com</a></p>
        <p style={paragraphStyle}>Typical response time: 24-72 hours.</p>
        <h2 style={headingStyle}>Helpful information to include</h2>
        <ul style={listStyle}>
          <li>Your account email address.</li>
          <li>Whether you are using master, follower, owner, or guest demo mode.</li>
          <li>Your device type and browser, or Android/iOS version.</li>
          <li>A screenshot or clear description of the problem.</li>
        </ul>
        <h2 style={headingStyle}>Common help topics</h2>
        <ul style={listStyle}>
          <li><strong>Login:</strong> Use the password reset link on the login screen if you cannot sign in.</li>
          <li><strong>Joining a session:</strong> Followers need the session code created by the master device.</li>
          <li><strong>Voice Follow:</strong> Allow microphone access and use a quiet room for best results.</li>
          <li><strong>Prayer libraries:</strong> You can use sample libraries, import JSON files, or load a public JSON URL.</li>
        </ul>
        <h2 style={headingStyle}>Related pages</h2>
        <p style={paragraphStyle}><Link href="/privacy" style={linkStyle}>Privacy Policy</Link> · <Link href="/terms" style={linkStyle}>Terms of Service</Link></p>
      </section>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', padding: '42px 18px', background: '#f8f5ed', color: '#111827' } as const;
const cardStyle = { maxWidth: 920, margin: '0 auto', background: 'rgba(255,255,255,0.9)', border: '1px solid #d8c9ae', borderRadius: 18, padding: 28, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' } as const;
const titleStyle = { margin: '18px 0 8px', fontSize: 42, lineHeight: 1.08 } as const;
const headingStyle = { margin: '28px 0 10px', fontSize: 24 } as const;
const paragraphStyle = { fontSize: 17, lineHeight: 1.6, color: '#374151' } as const;
const listStyle = { fontSize: 17, lineHeight: 1.6, color: '#374151', paddingLeft: 24 } as const;
const linkStyle = { color: '#1d4ed8' } as const;
const backLinkStyle = { color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' } as const;
