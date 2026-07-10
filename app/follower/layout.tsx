import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Follower',
  description: 'Prayer Follower app',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  manifest: '/manifest-follower.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Follower',
  },
};

export default function FollowerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
