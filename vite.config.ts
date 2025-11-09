import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: './public/manifest.json',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
        runtimeCaching: [{
          urlPattern: /(\/api\/|\.(?:png|svg|json|css|js)$)/,
          handler: 'CacheFirst',
          options: { cacheName: 'dvbwallet-assets' }
        }]
      },
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      devOptions: { enabled: true }
    })
  ],
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [
        '..',
        './out'
      ],
    },
  },
})