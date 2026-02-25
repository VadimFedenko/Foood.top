import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        name: 'Best Food Ever',
        short_name: 'BFE',
        description: 'Personal food ranking database with dynamic priority-based scoring',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#18181B',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,txt}',
          '**/dishes/420x340/**/*.webp', // Предзагрузка только маленьких версий изображений для офлайн-режима
        ],
        runtimeCaching: [
          // App JSON datasets (offline-friendly, small)
          {
            urlPattern: ({ url }) =>
              url.pathname.endsWith('/dishes.json') ||
              url.pathname.endsWith('/ingredients.json') ||
              url.pathname.endsWith('/states.json'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bfe-data',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Dish images - уже в precache, но оставляем runtime для новых/обновленных
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && url.pathname.includes('/dishes/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bfe-images',
              expiration: {
                maxEntries: 600,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Other same-origin static assets
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bfe-static',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: './',
  build: {
    minify: 'esbuild',
    sourcemap: false,
    esbuild: {
      // Reduce main-thread work + shipped JS by stripping dev-only statements in production builds.
      drop: ['console', 'debugger'],
      legalComments: 'none',
    },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          
          // React and all React-related packages should be in the same chunk
          if (
            id.includes('react-dom') || 
            id.includes('react/') || 
            id.includes('react\\') ||
            id.includes('react-i18next') ||
            id.includes('i18next') ||
            id.includes('use-sync-external-store')
          ) {
            return 'vendor-react';
          }
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          return 'vendor';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
    ],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
})
