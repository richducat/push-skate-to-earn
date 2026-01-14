import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Vite configuration for the SeekerScan dApp. This config enables React
// support and adds the PWA plugin which will generate a service worker and
// manifest for the application. When building for production the service
// worker will automatically precache the static assets and enable offline
// functionality. The manifest defined here describes your dApp to Android
// clients when published as a Progressive Web App.

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SeekerScan',
        short_name: 'SeekerScan',
        description: 'A dashboard for monitoring airdrop assets and earning rewards.',
        theme_color: '#0A0B0D',
        background_color: '#0A0B0D',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    open: true
  }
});
