import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.factusamdc',
  appName: 'Factus-Amdc',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#667eea',
      overlaysWebView: true
    }
  }
};

export default config;
