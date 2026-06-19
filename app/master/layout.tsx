import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Master',
  description: 'Prayer Master app',
  manifest: '/manifest-master.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Master',
  },
};

export default function MasterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
