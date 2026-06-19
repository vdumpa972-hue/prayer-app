import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vdumpa972.prayercompanion',
  appName: 'Prayer Companion',
  webDir: 'public',
  server: {
    url: 'https://prayer-master.vercel.app',
    cleartext: false
  }
};

export default config;