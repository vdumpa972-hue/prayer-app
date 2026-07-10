import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const appVariant = process.env.NEXT_PUBLIC_APP_VARIANT === 'follower' ? 'follower' : 'master';
  const isFollower = appVariant === 'follower';

  return {
    id: isFollower ? '/follower-app' : '/master-app',
    name: isFollower ? 'Prayer Follower' : 'Prayer Master',
    short_name: isFollower ? 'Follower' : 'Master',
    description: isFollower
      ? 'Follow a synchronized prayer session led from Prayer Companion.'
      : 'Lead group prayer sessions, prepare sermons, and manage a prayer library.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#111827',
    theme_color: '#111827',
    categories: ['lifestyle', 'education'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
