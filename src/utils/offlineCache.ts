import { ChurchStoreData } from '../types/church';

export const WORSHIP_OFFLINE_CACHE = 'efata-ibadah-offline-v2';
const LEGACY_WORSHIP_OFFLINE_CACHE = 'efata-ibadah-offline-v1';
const PAGES_ROUTES_CACHE = 'efata-pages-routes-v2';
const WARTA_PDF_CACHE = 'efata-warta-pdf-v1';
const STATIC_MEDIA_CACHE = 'efata-static-media-v1';
const DAILY_VERSE_CACHE = 'efata-daily-verse-v1';

const PRIORITY_OFFLINE_ROUTES = [
  '/',
  '/tata-ibadah',
  '/warta',
  '/jadwal',
  '/nyanyian',
  '/alkitab',
  '/layanan',
  '/keuangan',
  '/statistik',
  '/profil',
];

const WORSHIP_SNAPSHOT_ENDPOINTS = {
  liturgy: '/offline-cache/tata-ibadah.json',
  warta: '/offline-cache/warta-jemaat.json',
  schedules: '/offline-cache/jadwal-ibadah.json',
  hymns: '/offline-cache/nyanyian-rohani.json',
  profile: '/offline-cache/profil-gereja.json',
  finance: '/offline-cache/keuangan-jemaat.json',
  statistics: '/offline-cache/statistik-jemaat.json',
  gallery: '/offline-cache/galeri-jemaat.json',
  portal: '/offline-cache/portal-lengkap.json',
} as const;

export type OfflinePortalFallback = Partial<
  Pick<
    ChurchStoreData,
    'liturgy' | 'warta' | 'schedules' | 'hymns' | 'profile' | 'finance' | 'statistics' | 'gallery'
  >
>;

function createJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=7776000',
      'X-Offline-Synced-At': new Date().toISOString(),
    },
  });
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    const alreadyPersisted = await navigator.storage.persisted?.();
    if (alreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

async function fetchAndCacheAsset(cacheName: string, url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) return false;
    const cache = await window.caches.open(cacheName);
    await cache.put(url, response.clone());
    return true;
  } catch {
    return false;
  }
}

export async function warmWorshipOfflineCache(
  data: ChurchStoreData,
  options?: { warmRoutes?: boolean }
): Promise<{
  cachedSnapshots: number;
  cachedRoutes: number;
  cachedAssets: number;
  persistent: boolean;
}> {
  let cachedSnapshots = 0;
  let cachedRoutes = 0;
  let cachedAssets = 0;

  if (typeof window === 'undefined' || !('caches' in window)) {
    return { cachedSnapshots: 0, cachedRoutes: 0, cachedAssets: 0, persistent: false };
  }

  try {
    const offlineCache = await window.caches.open(WORSHIP_OFFLINE_CACHE);

    const compositePayload: OfflinePortalFallback & { syncedAt: string } = {
      liturgy: data.liturgy,
      warta: data.warta,
      schedules: data.schedules,
      hymns: data.hymns,
      profile: data.profile,
      finance: data.finance,
      statistics: data.statistics,
      gallery: data.gallery,
      syncedAt: new Date().toISOString(),
    };

    const snapshotEntries: [string, unknown][] = [
      [WORSHIP_SNAPSHOT_ENDPOINTS.liturgy, data.liturgy],
      [WORSHIP_SNAPSHOT_ENDPOINTS.warta, data.warta],
      [WORSHIP_SNAPSHOT_ENDPOINTS.schedules, data.schedules],
      [WORSHIP_SNAPSHOT_ENDPOINTS.hymns, data.hymns],
      [WORSHIP_SNAPSHOT_ENDPOINTS.profile, data.profile],
      [WORSHIP_SNAPSHOT_ENDPOINTS.finance, data.finance],
      [WORSHIP_SNAPSHOT_ENDPOINTS.statistics, data.statistics],
      [WORSHIP_SNAPSHOT_ENDPOINTS.gallery, data.gallery],
      [WORSHIP_SNAPSHOT_ENDPOINTS.portal, compositePayload],
    ];

    await Promise.all(
      snapshotEntries.map(async ([url, payload]) => {
        await offlineCache.put(url, createJsonResponse(payload));
        cachedSnapshots += 1;
      })
    );

    if (options?.warmRoutes !== false && navigator.onLine) {
      const routesCache = await window.caches.open(PAGES_ROUTES_CACHE);

      await Promise.all(
        PRIORITY_OFFLINE_ROUTES.map(async (routeUrl) => {
          try {
            const response = await fetch(routeUrl, { cache: 'no-cache' });
            if (response.ok) {
              await Promise.all([
                routesCache.put(routeUrl, response.clone()),
                offlineCache.put(routeUrl, response.clone()),
              ]);
              cachedRoutes += 1;
            }
          } catch {
            // Skip individual route network failure while preserving cached entries
          }
        })
      );

      // Cache Warta PDF (default + custom URL if any)
      const pdfUrls = Array.from(
        new Set(
          ['/warta-minggu-ini.pdf', data.warta.pdfUrl].filter(
            (u): u is string => Boolean(u && !u.startsWith('data:') && !u.startsWith('blob:'))
          )
        )
      );

      await Promise.all(
        pdfUrls.map(async (pdfUrl) => {
          const ok = await fetchAndCacheAsset(WARTA_PDF_CACHE, pdfUrl);
          if (ok) {
            cachedAssets += 1;
          }
        })
      );

      // Cache same-origin gallery images and core PWA static icons
      const mediaUrls = Array.from(
        new Set([
          '/icon.svg',
          '/apple-touch-icon.png',
          '/pwa-192x192.png',
          ...data.gallery
            .map((g) => g.imageUrl)
            .filter((u) => Boolean(u && u.startsWith('/'))),
        ])
      );

      await Promise.all(
        mediaUrls.map(async (imgUrl) => {
          const ok = await fetchAndCacheAsset(STATIC_MEDIA_CACHE, imgUrl);
          if (ok) {
            cachedAssets += 1;
          }
        })
      );

      // Warm default daily Bible verse response in Service Worker cache if endpoint is active
      await fetchAndCacheAsset(DAILY_VERSE_CACHE, '/api/daily-verse?topic=harian');
    }

    // Remove legacy v1 cache once v2 snapshots have been successfully written
    await window.caches.delete(LEGACY_WORSHIP_OFFLINE_CACHE).catch(() => {});
  } catch {
    // Cache Storage may be unavailable in restricted contexts
  }

  const persistent = await requestPersistentStorage();
  return { cachedSnapshots, cachedRoutes, cachedAssets, persistent };
}

async function readSnapshotsFromCache(cache: Cache): Promise<OfflinePortalFallback | null> {
  const compositeRes = await cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.portal);
  if (compositeRes) {
    try {
      const composite = (await compositeRes.json()) as OfflinePortalFallback;
      if (composite && (composite.liturgy || composite.warta || composite.schedules)) {
        return {
          liturgy: composite.liturgy,
          warta: composite.warta,
          schedules: composite.schedules,
          hymns: composite.hymns,
          profile: composite.profile,
          finance: composite.finance,
          statistics: composite.statistics,
          gallery: composite.gallery,
        };
      }
    } catch {
      // Fall back to individual endpoint reads below
    }
  }

  const [
    liturgyRes,
    wartaRes,
    schedulesRes,
    hymnsRes,
    profileRes,
    financeRes,
    statisticsRes,
    galleryRes,
  ] = await Promise.all([
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.liturgy),
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.warta),
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.schedules),
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.hymns),
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.profile),
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.finance),
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.statistics),
    cache.match(WORSHIP_SNAPSHOT_ENDPOINTS.gallery),
  ]);

  const result: OfflinePortalFallback = {};
  if (liturgyRes) result.liturgy = await liturgyRes.json();
  if (wartaRes) result.warta = await wartaRes.json();
  if (schedulesRes) result.schedules = await schedulesRes.json();
  if (hymnsRes) result.hymns = await hymnsRes.json();
  if (profileRes) result.profile = await profileRes.json();
  if (financeRes) result.finance = await financeRes.json();
  if (statisticsRes) result.statistics = await statisticsRes.json();
  if (galleryRes) result.gallery = await galleryRes.json();

  return Object.keys(result).length > 0 ? result : null;
}

export async function loadWorshipOfflineFallback(): Promise<OfflinePortalFallback | null> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return null;
  }

  try {
    const v2Cache = await window.caches.open(WORSHIP_OFFLINE_CACHE);
    const v2Result = await readSnapshotsFromCache(v2Cache);
    if (v2Result) return v2Result;

    const hasLegacy = await window.caches.has(LEGACY_WORSHIP_OFFLINE_CACHE);
    if (hasLegacy) {
      const legacyCache = await window.caches.open(LEGACY_WORSHIP_OFFLINE_CACHE);
      return await readSnapshotsFromCache(legacyCache);
    }

    return null;
  } catch {
    return null;
  }
}
