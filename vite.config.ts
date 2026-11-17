import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const SELF_DESTROY_SW_SCRIPT = `
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => {
          if ('navigate' in client) client.navigate(client.url);
        });
      })
  );
});
`;

function devSwCleanupPlugin(): Plugin {
  return {
    name: 'dev-sw-cleanup',
    apply: 'serve',
    configureServer(server) {
      if (process.env.DISABLE_HMR !== 'true') return;
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || '').split('?')[0];
        if (cleanUrl === '/dev-sw.js' || cleanUrl === '/sw.js') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.end(SELF_DESTROY_SW_SCRIPT);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      devSwCleanupPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'warta-minggu-ini.pdf',
        ],
        manifest: {
          id: '/',
          name: 'GKI Efata Malanu',
          short_name: 'Efata Malanu',
          description:
            'Portal informasi jemaat, tata ibadah, jadwal rayon, warta jemaat, dan nyanyian rohani GKI Efata Malanu Klasis Sorong.',
          theme_color: '#9A3412',
          background_color: '#9A3412',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Tata Ibadah Minggu',
              short_name: 'Tata Ibadah',
              description: 'Buka urutan liturgi dan nyanyian ibadah Minggu secara offline',
              url: '/tata-ibadah',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Warta Jemaat',
              short_name: 'Warta',
              description: 'Baca pengumuman mingguan, HUT, dan pokok doa secara offline',
              url: '/warta',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Jadwal Ibadah & Rayon',
              short_name: 'Jadwal',
              description: 'Lihat jadwal Ibadah Minggu, Unsur, dan Rayon 1–5',
              url: '/jadwal',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Nyanyian Rohani & KJ',
              short_name: 'Nyanyian',
              description: 'Cari lirik NR, KJ, Mazmur, dan Suara Gembira',
              url: '/nyanyian',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,pdf,json,webmanifest}',
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/offline-cache\//],
          ignoreURLParametersMatching: [/^utm_/, /^page$/, /^v$/],
          runtimeCaching: [
            {
              urlPattern: ({ sameOrigin, request, url }) =>
                sameOrigin &&
                request.mode === 'navigate' &&
                !url.pathname.startsWith('/api/') &&
                !url.pathname.startsWith('/offline-cache/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'efata-pages-routes-v2',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ sameOrigin, url }) =>
                sameOrigin && url.pathname.startsWith('/offline-cache/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'efata-ibadah-offline-v2',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ url }) => /\.pdf(?:$|\?)/i.test(url.pathname + url.search),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'efata-warta-pdf-v1',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ sameOrigin, url }) =>
                sameOrigin && url.pathname.startsWith('/api/daily-verse'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'efata-daily-verse-v1',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ sameOrigin, request }) =>
                sameOrigin &&
                (request.destination === 'script' ||
                  request.destination === 'style' ||
                  request.destination === 'worker'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'efata-worship-app-code-v1',
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ sameOrigin, request, url }) =>
                sameOrigin &&
                (request.destination === 'image' ||
                  /\.(?:png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname)),
              handler: 'CacheFirst',
              options: {
                cacheName: 'efata-static-media-v1',
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 60 * 60 * 24 * 90,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ sameOrigin, request, url }) =>
                !sameOrigin &&
                url.protocol === 'https:' &&
                request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'efata-external-media-v1',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          // vite-plugin-pwa dev-sw relies on import.meta.hot.send(), which throws when server.hmr is false
          enabled: process.env.DISABLE_HMR !== 'true',
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
