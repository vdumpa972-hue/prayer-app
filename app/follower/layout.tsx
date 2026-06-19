import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Follower',
  description: 'Prayer Follower app',
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
