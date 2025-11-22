import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), VitePWA({
      registerType: 'autoUpdate', // Updates app automatically when you push new code
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      // IMPORTANT: This enables PWA in dev mode (localhost)
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'canteeria',
        short_name: 'canteeria',
        description: 'best solution for your campus cravings',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Hides the browser URL bar
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // You must create these images in /public folder later
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })],
})
