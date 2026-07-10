import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SeoStructuredData from "../src/components/SeoStructuredData";

export const metadata: Metadata = {
  metadataBase: new URL("https://prayer-master.vercel.app"),
  title: {
    default: "Prayer Companion | Group Prayer and Sermon App",
    template: "%s | Prayer Companion",
  },
  description: "Create and lead prayer sessions, prepare sermons, manage a prayer library, and synchronize a leader’s selected prayer with followers on phones, tablets, and TVs.",
  keywords: [
    "group prayer app",
    "prayer leader app",
    "sermon preparation app",
    "church prayer app",
    "synchronized prayer",
    "prayer library"
  ],
  applicationName: "Prayer Companion",
  category: "lifestyle",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Prayer Companion",
    title: "Prayer Companion | Group Prayer and Sermon App",
    description: "Create and lead prayer sessions, prepare sermons, manage a prayer library, and synchronize a leader’s selected prayer with followers on phones, tablets, and TVs.",
  },
  twitter: {
    card: "summary",
    title: "Prayer Companion | Group Prayer and Sermon App",
    description: "Create and lead prayer sessions, prepare sermons, manage a prayer library, and synchronize a leader’s selected prayer with followers on phones, tablets, and TVs.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#111827" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <SeoStructuredData />
        <LanguageProvider>
          <LanguageSwitcher />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
