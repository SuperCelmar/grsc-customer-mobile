/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config'
import { cpSync, createReadStream, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function copySelectedPublicAssets(): PluginOption {
  return {
    name: 'copy-selected-public-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestPath = request.url?.split('?')[0] ?? ''
        const publicPath =
          requestPath === '/favicon.svg' || requestPath === '/icons.svg'
            ? requestPath.slice(1)
            : requestPath.startsWith('/icons/')
              ? requestPath.slice(1)
              : null

        if (!publicPath) {
          next()
          return
        }

        const filePath = join(process.cwd(), 'public', publicPath)
        if (!existsSync(filePath)) {
          next()
          return
        }

        response.setHeader('Cache-Control', 'no-cache')
        if (filePath.endsWith('.svg')) response.setHeader('Content-Type', 'image/svg+xml')
        createReadStream(filePath).pipe(response)
      })
    },
    closeBundle() {
      const root = process.cwd()
      const copies = [
        ['public/favicon.svg', 'dist/favicon.svg'],
        ['public/icons.svg', 'dist/icons.svg'],
        ['public/icons', 'dist/icons'],
      ]

      for (const [fromPath, toPath] of copies) {
        const from = join(root, fromPath)
        const to = join(root, toPath)
        if (!existsSync(from)) continue
        mkdirSync(dirname(to), { recursive: true })
        cpSync(from, to, { recursive: true })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const supabaseUrl = env.VITE_SUPABASE_URL ?? 'https://YOUR_PROJECT_REF.supabase.co'
  const supabaseHost = new URL(supabaseUrl).host
  const escapedHost = supabaseHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return {
    publicDir: false,
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
      css: false,
      exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    },
    plugins: [
      react(),
      copySelectedPublicAssets(),
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
            { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,webmanifest}'],
          globIgnores: ['**/Menu Final Images/**'],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^https://${escapedHost}/storage/v1/object/public/menu-images/`),
              handler: 'CacheFirst',
              options: {
                cacheName: 'menu-image-cache',
                expiration: { maxEntries: 140, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/goldrushsportscoffee\.com\/wp-content\/uploads\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'menu-image-cache',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 14 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: new RegExp(`^https://${escapedHost}/functions/v1/customer-menu`),
              handler: 'NetworkFirst',
              options: { cacheName: 'menu-cache', expiration: { maxEntries: 8, maxAgeSeconds: 300 } },
            },
            {
              urlPattern: new RegExp(`^https://${escapedHost}/functions/v1/`),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    server: { port: 5173 },
  }
})
