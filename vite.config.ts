/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'GoldRush Coffee',
        short_name: 'GoldRush',
        description: 'GoldRush Sports Coffee — Loyalty & Ordering',
        theme_color: '#D4A574',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/hotymmwjdqnztegxgttb\.supabase\.co\/functions\/v1\/customer-menu/,
            handler: 'NetworkFirst',
            options: { cacheName: 'menu-cache', expiration: { maxAgeSeconds: 300 } }
          },
          {
            urlPattern: /^https:\/\/hotymmwjdqnztegxgttb\.supabase\.co\/functions\/v1\//,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: { port: 5173 }
})
