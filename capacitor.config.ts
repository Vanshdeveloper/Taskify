import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskify.app',
  appName: 'Taskify',
  webDir: 'dist',
  backgroundColor: '#160f0d',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#160f0d',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_taskify',
      iconColor: '#f26a36',
    },
  },
};

export default config;
