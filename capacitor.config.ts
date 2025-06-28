import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mymanager.app',
  appName: 'My Manager',
  webDir: 'out',  // Using Next.js output directory
  server: {
    androidScheme: 'https',
    // Don't set a URL to use the locally built frontend
    cleartext: true
  }
};

export default config;
