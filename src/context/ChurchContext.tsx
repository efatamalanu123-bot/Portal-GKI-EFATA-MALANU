import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ToastPayload } from '../components/NotificationToast';
import { INITIAL_CHURCH_DATA } from '../data/initialData';
import {
  AdminAccount,
  BookmarkedVerse,
  ChurchStoreData,
  CustomLogoState,
  FavoriteDailyVerse,
  FinanceData,
  GalleryItem,
  PageId,
  ScheduleItem,
  StatisticsData,
  WartaData,
  WeeklyLiturgy,
} from '../types/church';
import { resolveChurchAssetUrl } from '../utils/churchAssets';
import {
  loadWorshipOfflineFallback,
  warmWorshipOfflineCache,
} from '../utils/offlineCache';
import {
  BrowserNotificationState,
  DailyReminderSettings,
  TodayScheduleItem,
  buildDailyWorshipReminderPayload,
  dispatchLocalSystemNotification,
  getBrowserNotificationPermission,
  getTodaySchedules,
  getWitCurrentMinutes,
  getWitDateKey,
  loadDailyReminderSettings,
  parseReminderMinutes,
  requestBrowserNotificationPermission,
  saveDailyReminderSettings,
} from '../utils/dailyWorshipReminder';

const VALID_PAGES: PageId[] = [
  'beranda',
  'tata-ibadah',
  'jadwal',
  'warta',
  'nyanyian',
  'alkitab',
  'layanan',
  'keuangan',
  'statistik',
  'profil',
  'login',
  'admin',
];

function resolvePageFromLocation(): PageId {
  if (typeof window === 'undefined') return 'beranda';
  try {
    const queryPage = new URLSearchParams(window.location.search).get('page') as PageId | null;
    if (queryPage && VALID_PAGES.includes(queryPage)) return queryPage;

    const pathSegment = window.location.pathname.replace(/^\/+|\/+$/g, '') as PageId;
    if (pathSegment && VALID_PAGES.includes(pathSegment)) return pathSegment;

    const hashPage = window.location.hash.replace(/^#/, '') as PageId;
    if (hashPage && VALID_PAGES.includes(hashPage)) return hashPage;
  } catch {
    // Ignore malformed URLs
  }
  return 'beranda';
}

const STORAGE_DATA_KEY = 'gki_efata_malanu_data_v1';
const STORAGE_THEME_KEY = 'gki_efata_dark_mode';
const STORAGE_THEME_PREF_KEY = 'gki_efata_theme_pref_v1';
const STORAGE_FONT_KEY = 'gki_efata_font_scale';
const STORAGE_USER_KEY = 'gki_efata_session_v1';
const STORAGE_BOOKMARKS_KEY = 'gki_efata_bookmarks_v1';
const STORAGE_FAVORITE_DAILY_VERSES_KEY = 'gki_efata_favorite_daily_verses_v1';
const STORAGE_CUSTOM_LOGO_KEY = 'gki_efata_custom_logo_v1';

export type ThemePreference = 'system' | 'light' | 'dark';

function readInitialThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_THEME_PREF_KEY);
    if (saved === 'system' || saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (localStorage.getItem(STORAGE_THEME_KEY) === 'true') {
      return 'dark';
    }
  } catch {
    // Ignore storage access errors
  }
  return 'system';
}

function readSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

interface ChurchContextValue {
  data: ChurchStoreData;
  currentPage: PageId;
  navigate: (page: PageId) => void;
  darkMode: boolean;
  themePreference: ThemePreference;
  systemPrefersDark: boolean;
  toggleDarkMode: () => void;
  cycleThemeMode: () => void;
  setThemeMode: (mode: ThemePreference) => void;
  fontScale: number;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  currentUser: AdminAccount | null;
  login: (username: string, password: string) => { ok: boolean; message: string };
  demoLogin: (username: 'superuser' | 'admin1' | 'admin2') => void;
  logout: () => void;
  toast: ToastPayload | null;
  showToast: (msg: string, options?: { title?: string; variant?: 'success' | 'info' | 'warning' }) => void;
  dismissToast: () => void;
  updateLiturgy: (liturgy: WeeklyLiturgy) => void;
  addSchedule: (item: ScheduleItem) => void;
  updateSchedule: (item: ScheduleItem) => void;
  deleteSchedule: (id: string) => void;
  updateWarta: (warta: WartaData) => void;
  addGalleryItem: (item: GalleryItem) => void;
  deleteGalleryItem: (id: string) => void;
  updateFinance: (finance: FinanceData) => void;
  updateStatistics: (statistics: StatisticsData) => void;
  updateAccountPassword: (username: 'admin1' | 'admin2' | 'superuser', newPassword: string) => void;
  resetAllData: () => void;
  bookmarkedVerses: BookmarkedVerse[];
  activeBibleTarget: { bookId: string; chapter: number } | null;
  clearActiveBibleTarget: () => void;
  toggleBookmarkVerse: (verse: Omit<BookmarkedVerse, 'id' | 'savedAt'>) => void;
  removeBookmarkVerse: (id: string) => void;
  isVerseBookmarked: (bookId: string, chapter: number, verse: number) => boolean;
  favoriteDailyVerses: FavoriteDailyVerse[];
  toggleFavoriteDailyVerse: (verse: Omit<FavoriteDailyVerse, 'id' | 'savedAt'>) => void;
  removeFavoriteDailyVerse: (id: string) => void;
  isDailyVerseFavorited: (referensi: string) => boolean;
  openBiblePassage: (bookId: string, chapter: number) => void;
  syncOfflineWorshipCache: () => Promise<void>;
  customLogo: CustomLogoState | null;
  applyCustomLogo: (logo: CustomLogoState) => void;
  resetCustomLogo: () => void;
  activeHymnTarget: { id: string; query?: string } | null;
  openHymn: (id: string, query?: string) => void;
  clearActiveHymnTarget: () => void;
  activeLiturgyStepId: string | null;
  openLiturgyStep: (stepId: string) => void;
  clearActiveLiturgyStep: () => void;
  applySyncedChurchData: (partial: Partial<ChurchStoreData>, summaryText?: string) => void;
  dailyReminderSettings: DailyReminderSettings;
  browserNotificationPermission: BrowserNotificationState;
  todaySchedules: TodayScheduleItem[];
  toggleDailyReminder: (enable?: boolean) => Promise<void>;
  updateDailyReminderTime: (time: string) => void;
  requestSystemNotificationAccess: () => Promise<BrowserNotificationState>;
  sendTestDailyReminder: () => Promise<void>;
}

const ChurchContext = createContext<ChurchContextValue | null>(null);

function loadStoredData(): ChurchStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_DATA_KEY);
    if (!raw) return INITIAL_CHURCH_DATA;
    const parsed = JSON.parse(raw) as Partial<ChurchStoreData>;
    const rawLiturgy = parsed.liturgy;
    const rawWarta = parsed.warta;
    const rawFinance = parsed.finance;
    const rawStats = parsed.statistics;
    const rawProfile = parsed.profile;

    return {
      ...INITIAL_CHURCH_DATA,
      ...parsed,
      liturgy: rawLiturgy
        ? {
            ...INITIAL_CHURCH_DATA.liturgy,
            ...rawLiturgy,
            steps: Array.isArray(rawLiturgy.steps)
              ? rawLiturgy.steps
              : INITIAL_CHURCH_DATA.liturgy.steps,
          }
        : INITIAL_CHURCH_DATA.liturgy,
      schedules: Array.isArray(parsed.schedules)
        ? parsed.schedules
        : INITIAL_CHURCH_DATA.schedules,
      warta: rawWarta
        ? {
            ...INITIAL_CHURCH_DATA.warta,
            ...rawWarta,
            pengumuman: Array.isArray(rawWarta.pengumuman)
              ? rawWarta.pengumuman
              : INITIAL_CHURCH_DATA.warta.pengumuman,
            hutJemaat: Array.isArray(rawWarta.hutJemaat)
              ? rawWarta.hutJemaat
              : INITIAL_CHURCH_DATA.warta.hutJemaat,
            beritaDukaSakit: Array.isArray(rawWarta.beritaDukaSakit)
              ? rawWarta.beritaDukaSakit
              : INITIAL_CHURCH_DATA.warta.beritaDukaSakit,
          }
        : INITIAL_CHURCH_DATA.warta,
      hymns: Array.isArray(parsed.hymns) ? parsed.hymns : INITIAL_CHURCH_DATA.hymns,
      finance: rawFinance
        ? {
            ...INITIAL_CHURCH_DATA.finance,
            ...rawFinance,
            penerimaan: Array.isArray(rawFinance.penerimaan)
              ? rawFinance.penerimaan
              : INITIAL_CHURCH_DATA.finance.penerimaan,
            pengeluaran: Array.isArray(rawFinance.pengeluaran)
              ? rawFinance.pengeluaran
              : INITIAL_CHURCH_DATA.finance.pengeluaran,
          }
        : INITIAL_CHURCH_DATA.finance,
      statistics: rawStats
        ? {
            ...INITIAL_CHURCH_DATA.statistics,
            ...rawStats,
            rayonList: Array.isArray(rawStats.rayonList)
              ? rawStats.rayonList
              : INITIAL_CHURCH_DATA.statistics.rayonList,
            majelisJemaat: Array.isArray(rawStats.majelisJemaat)
              ? rawStats.majelisJemaat
              : INITIAL_CHURCH_DATA.statistics.majelisJemaat,
          }
        : INITIAL_CHURCH_DATA.statistics,
      gallery: Array.isArray(parsed.gallery)
        ? parsed.gallery.map((g) => ({
            ...g,
            imageUrl: resolveChurchAssetUrl(g.imageUrl),
          }))
        : INITIAL_CHURCH_DATA.gallery,
      profile: rawProfile
        ? {
            ...INITIAL_CHURCH_DATA.profile,
            ...rawProfile,
            rekeningList: Array.isArray(rawProfile.rekeningList)
              ? rawProfile.rekeningList
              : INITIAL_CHURCH_DATA.profile.rekeningList,
          }
        : INITIAL_CHURCH_DATA.profile,
      accounts: Array.isArray(parsed.accounts)
        ? parsed.accounts
        : INITIAL_CHURCH_DATA.accounts,
    };
  } catch {
    return INITIAL_CHURCH_DATA;
  }
}

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ChurchStoreData>(loadStoredData);
  const [currentPage, setCurrentPage] = useState<PageId>(resolvePageFromLocation);
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    readInitialThemePreference
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(readSystemPrefersDark);
  const darkMode =
    themePreference === 'system' ? systemPrefersDark : themePreference === 'dark';
  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const val = parseFloat(localStorage.getItem(STORAGE_FONT_KEY) || '1');
      return Number.isFinite(val) ? Math.min(1.45, Math.max(0.85, val)) : 1;
    } catch {
      return 1;
    }
  });
  const [currentUser, setCurrentUser] = useState<AdminAccount | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? (JSON.parse(raw) as AdminAccount) : null;
    } catch {
      return null;
    }
  });
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [bookmarkedVerses, setBookmarkedVerses] = useState<BookmarkedVerse[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      return raw ? (JSON.parse(raw) as BookmarkedVerse[]) : [];
    } catch {
      return [];
    }
  });
  const [favoriteDailyVerses, setFavoriteDailyVerses] = useState<FavoriteDailyVerse[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITE_DAILY_VERSES_KEY);
      return raw ? (JSON.parse(raw) as FavoriteDailyVerse[]) : [];
    } catch {
      return [];
    }
  });
  const [activeBibleTarget, setActiveBibleTarget] = useState<{
    bookId: string;
    chapter: number;
  } | null>(null);
  const [activeHymnTarget, setActiveHymnTarget] = useState<{
    id: string;
    query?: string;
  } | null>(null);
  const [activeLiturgyStepId, setActiveLiturgyStepId] = useState<string | null>(null);
  const [dailyReminderSettings, setDailyReminderSettings] = useState<DailyReminderSettings>(
    loadDailyReminderSettings
  );
  const [browserNotificationPermission, setBrowserNotificationPermission] =
    useState<BrowserNotificationState>(getBrowserNotificationPermission);
  const todaySchedules = React.useMemo(
    () => getTodaySchedules(data.schedules),
    [data.schedules]
  );
  const [customLogo, setCustomLogo] = useState<CustomLogoState | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_LOGO_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CustomLogoState>;
      if (
        parsed &&
        typeof parsed.dataUrl === 'string' &&
        (parsed.dataUrl.startsWith('data:image/') || parsed.dataUrl.startsWith('https://'))
      ) {
        return {
          dataUrl: parsed.dataUrl,
          fileName: parsed.fileName || 'Logo_GKI_Big.png',
          driveFileId: parsed.driveFileId,
          source: parsed.source === 'upload' ? 'upload' : 'drive',
          updatedAt: parsed.updatedAt || '',
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors cleanly
    }

    const timer = window.setTimeout(() => {
      warmWorshipOfflineCache(data, { warmRoutes: false }).catch(() => {});
    }, 350);

    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    // Hydrate from Service Worker Cache Storage if localStorage was empty, and pre-warm key worship routes
    let cancelled = false;
    const initOfflineSync = async () => {
      try {
        const hasLocal = Boolean(localStorage.getItem(STORAGE_DATA_KEY));
        if (!hasLocal) {
          const cachedFallback = await loadWorshipOfflineFallback();
          if (!cancelled && cachedFallback) {
            setData((prev) => ({
              ...prev,
              ...cachedFallback,
            }));
          }
        }
      } catch {
        // Ignore storage read errors
      }

      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) {
            await Promise.race([
              navigator.serviceWorker.ready,
              new Promise((resolve) => window.setTimeout(resolve, 1500)),
            ]);
          }
        } catch {
          // Proceed even if SW ready rejects in non-secure context
        }
      }

      if (!cancelled) {
        await warmWorshipOfflineCache(data, { warmRoutes: true });
      }
    };

    initOfflineSync();

    const handleOnlineReconnect = () => {
      warmWorshipOfflineCache(data, { warmRoutes: true }).catch(() => {});
    };
    window.addEventListener('online', handleOnlineReconnect);

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnlineReconnect);
    };
    // Run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(resolvePageFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = darkMode ? '#180D07' : '#9A3412';
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THEME_PREF_KEY, themePreference);
    } catch {
      // Ignore
    }
  }, [themePreference]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FONT_KEY, String(fontScale));
    } catch {
      // Ignore
    }
  }, [fontScale]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarkedVerses));
    } catch {
      // Ignore
    }
  }, [bookmarkedVerses]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_FAVORITE_DAILY_VERSES_KEY,
        JSON.stringify(favoriteDailyVerses)
      );
    } catch {
      // Ignore
    }
  }, [favoriteDailyVerses]);

  useEffect(() => {
    saveDailyReminderSettings(dailyReminderSettings);
  }, [dailyReminderSettings]);

  useEffect(() => {
    if (!dailyReminderSettings.enabled) return;

    const evaluateDailyReminder = async () => {
      const now = new Date();
      const todayKey = getWitDateKey(now);
      if (dailyReminderSettings.lastNotifiedDateKey === todayKey) return;

      const currentMinutes = getWitCurrentMinutes(now);
      const targetMinutes = parseReminderMinutes(dailyReminderSettings.reminderTime);
      if (currentMinutes < targetMinutes) return;

      const schedulesToday = getTodaySchedules(data.schedules, now);
      if (schedulesToday.length === 0) return;

      const payload = buildDailyWorshipReminderPayload(schedulesToday, now);
      setDailyReminderSettings((prev) =>
        prev.lastNotifiedDateKey === todayKey
          ? prev
          : { ...prev, lastNotifiedDateKey: todayKey }
      );

      await dispatchLocalSystemNotification({
        title: payload.title,
        body: payload.body,
        tag: `gki-efata-daily-${todayKey}`,
      });

      showToast(payload.body, {
        title: payload.title,
        variant: 'info',
      });
    };

    evaluateDailyReminder();

    const intervalId = window.setInterval(() => {
      evaluateDailyReminder();
    }, 60 * 1000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        setBrowserNotificationPermission(getBrowserNotificationPermission());
        evaluateDailyReminder();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [
    dailyReminderSettings.enabled,
    dailyReminderSettings.reminderTime,
    dailyReminderSettings.lastNotifiedDateKey,
    data.schedules,
  ]);

  useEffect(() => {
    try {
      if (customLogo) {
        localStorage.setItem(STORAGE_CUSTOM_LOGO_KEY, JSON.stringify(customLogo));
      } else {
        localStorage.removeItem(STORAGE_CUSTOM_LOGO_KEY);
      }
    } catch {
      // Ignore storage quota errors cleanly
    }

    // Sync browser tab icon & Apple touch icon dynamically with active logo
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (iconLink) {
      if (customLogo?.dataUrl) {
        iconLink.type = 'image/png';
        iconLink.href = customLogo.dataUrl;
      } else {
        iconLink.type = 'image/svg+xml';
        iconLink.href = '/icon.svg';
      }
    }
    const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleIcon) {
      appleIcon.href = customLogo?.dataUrl || '/apple-touch-icon.png';
    }
  }, [customLogo]);

  const dismissToast = () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  };

  const showToast = (
    msg: string,
    options?: { title?: string; variant?: 'success' | 'info' | 'warning' }
  ) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({
      id,
      message: msg,
      title: options?.title,
      variant: options?.variant ?? 'info',
    });
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  };

  const navigate = (page: PageId) => {
    setCurrentPage(page);
    try {
      const targetPath = page === 'beranda' ? '/' : `/${page}`;
      if (window.location.pathname !== targetPath || window.location.search || window.location.hash) {
        window.history.pushState({ page }, '', targetPath);
      }
    } catch {
      // Ignore history pushState restriction in sandboxed environments
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDarkMode = () =>
    setThemePreference(darkMode ? 'light' : 'dark');
  const cycleThemeMode = () =>
    setThemePreference((prev) =>
      prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system'
    );
  const setThemeMode = (mode: ThemePreference) => setThemePreference(mode);
  const increaseFont = () => setFontScale((prev) => Math.min(1.45, Number((prev + 0.1).toFixed(2))));
  const decreaseFont = () => setFontScale((prev) => Math.max(0.85, Number((prev - 0.1).toFixed(2))));
  const resetFont = () => setFontScale(1);

  const login = (username: string, password: string) => {
    const cleanUser = username.trim().toLowerCase();
    const account = data.accounts.find((acc) => acc.username === cleanUser);
    if (!account) {
      return { ok: false, message: 'Nama pengguna tidak ditemukan.' };
    }
    if (account.password !== password) {
      return { ok: false, message: 'Kata sandi tidak sesuai.' };
    }
    setCurrentUser(account);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(account));
    } catch {
      // Ignore
    }
    navigate('admin');
    showToast(`Berhasil masuk sebagai ${account.displayName}`);
    return { ok: true, message: 'Login berhasil.' };
  };

  const demoLogin = (username: 'superuser' | 'admin1' | 'admin2') => {
    const account = data.accounts.find((acc) => acc.username === username);
    if (!account) return;
    setCurrentUser(account);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(account));
    } catch {
      // Ignore
    }
    navigate('admin');
    showToast(`Masuk mode demo: ${account.displayName}`);
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch {
      // Ignore
    }
    navigate('beranda');
    showToast('Anda telah keluar dari Dashboard Pengurus.');
  };

  const updateLiturgy = (liturgy: WeeklyLiturgy) => {
    setData((prev) => ({ ...prev, liturgy }));
    showToast('Tata Ibadah & Tema Pelayanan diperbarui.');
  };

  const addSchedule = (item: ScheduleItem) => {
    setData((prev) => ({ ...prev, schedules: [item, ...prev.schedules] }));
    showToast('Jadwal ibadah baru ditambahkan.');
  };

  const updateSchedule = (item: ScheduleItem) => {
    setData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === item.id ? item : s)),
    }));
    showToast('Jadwal ibadah diperbarui.');
  };

  const deleteSchedule = (id: string) => {
    setData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id),
    }));
    showToast('Jadwal ibadah dihapus.');
  };

  const updateWarta = (warta: WartaData) => {
    setData((prev) => ({ ...prev, warta }));
    showToast('Warta Jemaat berhasil disimpan.');
  };

  const addGalleryItem = (item: GalleryItem) => {
    setData((prev) => ({ ...prev, gallery: [item, ...prev.gallery] }));
    showToast('Foto kegiatan ditambahkan ke Galeri.');
  };

  const deleteGalleryItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((g) => g.id !== id),
    }));
    showToast('Item galeri dihapus.');
  };

  const updateFinance = (finance: FinanceData) => {
    setData((prev) => ({ ...prev, finance }));
    showToast('Laporan Keuangan Jemaat diperbarui.');
  };

  const updateStatistics = (statistics: StatisticsData) => {
    setData((prev) => ({ ...prev, statistics }));
    showToast('Data Statistik & Majelis diperbarui.');
  };

  const updateAccountPassword = (username: 'admin1' | 'admin2' | 'superuser', newPassword: string) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((acc) =>
        acc.username === username ? { ...acc, password: newPassword } : acc
      ),
    }));
    if (currentUser?.username === username) {
      const updated = { ...currentUser, password: newPassword };
      setCurrentUser(updated);
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }
    showToast(`Kata sandi akun "${username}" berhasil diperbarui.`);
  };

  const resetAllData = () => {
    setData(INITIAL_CHURCH_DATA);
    try {
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(INITIAL_CHURCH_DATA));
    } catch {
      // Ignore
    }
    showToast('Seluruh data dikembalikan ke pengaturan awal.');
  };

  const isVerseBookmarked = (bookId: string, chapter: number, verse: number) => {
    const id = `${bookId}-${chapter}-${verse}`;
    return bookmarkedVerses.some((b) => b.id === id);
  };

  const toggleBookmarkVerse = (item: Omit<BookmarkedVerse, 'id' | 'savedAt'>) => {
    const id = `${item.bookId}-${item.chapter}-${item.verse}`;
    const exists = bookmarkedVerses.some((b) => b.id === id);
    if (exists) {
      setBookmarkedVerses((prev) => prev.filter((b) => b.id !== id));
      showToast(`Bookmark ${item.bookName} ${item.chapter}:${item.verse} dihapus.`, {
        title: 'Bookmark Dihapus',
        variant: 'info',
      });
    } else {
      const entry: BookmarkedVerse = {
        ...item,
        id,
        savedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      };
      setBookmarkedVerses((prev) => [entry, ...prev]);
      showToast(`${item.bookName} ${item.chapter}:${item.verse} disimpan ke Bookmark Ayat di Profil.`, {
        title: 'Ayat Disimpan',
        variant: 'success',
      });
    }
  };

  const removeBookmarkVerse = (id: string) => {
    setBookmarkedVerses((prev) => prev.filter((b) => b.id !== id));
    showToast('Ayat dihapus dari daftar bookmark.');
  };

  const normalizeDailyVerseId = (referensi: string) =>
    referensi.trim().toLowerCase().replace(/\s+/g, ' ');

  const isDailyVerseFavorited = (referensi: string) => {
    const id = normalizeDailyVerseId(referensi);
    return favoriteDailyVerses.some((f) => f.id === id);
  };

  const toggleFavoriteDailyVerse = (
    verse: Omit<FavoriteDailyVerse, 'id' | 'savedAt'>
  ) => {
    const id = normalizeDailyVerseId(verse.referensi);
    const exists = favoriteDailyVerses.some((f) => f.id === id);
    if (exists) {
      setFavoriteDailyVerses((prev) => prev.filter((f) => f.id !== id));
      showToast(`${verse.referensi} dihapus dari Ayat Favorit.`, {
        title: 'Favorit Dihapus',
        variant: 'info',
      });
    } else {
      const entry: FavoriteDailyVerse = {
        ...verse,
        id,
        savedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      };
      setFavoriteDailyVerses((prev) => [entry, ...prev]);
      showToast(`${verse.referensi} disimpan ke Ayat Favorit untuk direnungkan nanti.`, {
        title: 'Disimpan ke Favorit',
        variant: 'success',
      });
    }
  };

  const removeFavoriteDailyVerse = (id: string) => {
    setFavoriteDailyVerses((prev) => prev.filter((f) => f.id !== id));
    showToast('Ayat dihapus dari daftar favorit.');
  };

  const openBiblePassage = (bookId: string, chapter: number) => {
    setActiveBibleTarget({ bookId, chapter });
    navigate('alkitab');
  };

  const clearActiveBibleTarget = () => setActiveBibleTarget(null);

  const syncOfflineWorshipCache = async () => {
    const result = await warmWorshipOfflineCache(data, { warmRoutes: true });
    showToast(
      `Tata Ibadah, Warta Jemaat (+ PDF), Jadwal & Nyanyian (${result.cachedSnapshots} paket konten, ${result.cachedRoutes} halaman) siap diakses tanpa internet.`,
      {
        title: 'Cache Offline Portal Diperbarui',
        variant: 'success',
      }
    );
  };

  const applyCustomLogo = (logo: CustomLogoState) => {
    setCustomLogo(logo);
    showToast(`Logo "${logo.fileName}" diterapkan ke seluruh halaman aplikasi.`, {
      title: 'Logo GKI Diperbarui',
      variant: 'success',
    });
  };

  const resetCustomLogo = () => {
    setCustomLogo(null);
    showToast('Logo dikembalikan ke ikon bawaan.', {
      title: 'Logo Direset',
      variant: 'info',
    });
  };

  const openHymn = (id: string, query?: string) => {
    setActiveHymnTarget({ id, query });
    navigate('nyanyian');
  };

  const clearActiveHymnTarget = () => setActiveHymnTarget(null);

  const openLiturgyStep = (stepId: string) => {
    setActiveLiturgyStepId(stepId);
    navigate('tata-ibadah');
  };

  const clearActiveLiturgyStep = () => setActiveLiturgyStepId(null);

  const applySyncedChurchData = (
    partial: Partial<ChurchStoreData>,
    summaryText?: string
  ) => {
    setData((prev) => ({
      ...prev,
      ...partial,
      gallery: Array.isArray(partial.gallery)
        ? partial.gallery.map((g) => ({
            ...g,
            imageUrl: resolveChurchAssetUrl(g.imageUrl),
          }))
        : prev.gallery,
    }));
    showToast(
      summaryText || 'Seluruh data portal berhasil disinkronkan dari Google Sheets.',
      {
        title: 'Sinkronisasi Google Sheets',
        variant: 'success',
      }
    );
  };

  const requestSystemNotificationAccess = async (): Promise<BrowserNotificationState> => {
    const result = await requestBrowserNotificationPermission();
    setBrowserNotificationPermission(result);
    if (result === 'granted') {
      showToast('Izin notifikasi perangkat diaktifkan untuk pengingat ibadah harian.', {
        title: 'Notifikasi Perangkat Aktif',
        variant: 'success',
      });
    } else if (result === 'denied') {
      showToast(
        'Izin notifikasi browser ditolak. Pengingat ibadah tetap muncul sebagai banner di dalam aplikasi.',
        {
          title: 'Mode Pengingat Dalam Aplikasi',
          variant: 'warning',
        }
      );
    }
    return result;
  };

  const toggleDailyReminder = async (enable?: boolean) => {
    const nextEnabled =
      typeof enable === 'boolean' ? enable : !dailyReminderSettings.enabled;
    setDailyReminderSettings((prev) => ({
      ...prev,
      enabled: nextEnabled,
    }));

    if (nextEnabled) {
      let perm = getBrowserNotificationPermission();
      if (perm === 'default') {
        perm = await requestBrowserNotificationPermission();
        setBrowserNotificationPermission(perm);
      }
      showToast(
        perm === 'granted'
          ? `Pengingat harian aktif setiap pukul ${dailyReminderSettings.reminderTime} WIT (notifikasi perangkat & aplikasi).`
          : `Pengingat harian aktif setiap pukul ${dailyReminderSettings.reminderTime} WIT di dalam aplikasi.`,
        {
          title: 'Pengingat Harian Aktif',
          variant: 'success',
        }
      );
    } else {
      showToast('Pengingat harian jadwal ibadah dinonaktifkan.', {
        title: 'Pengingat Harian Nonaktif',
        variant: 'info',
      });
    }
  };

  const updateDailyReminderTime = (time: string) => {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    setDailyReminderSettings((prev) => ({
      ...prev,
      reminderTime: time,
      lastNotifiedDateKey: null,
    }));
    showToast(`Waktu pengingat harian diatur ke pukul ${time} WIT.`, {
      title: 'Waktu Pengingat Diperbarui',
      variant: 'success',
    });
  };

  const sendTestDailyReminder = async () => {
    const now = new Date();
    const schedulesToday = getTodaySchedules(data.schedules, now);
    const payload = buildDailyWorshipReminderPayload(schedulesToday, now);
    const channel = await dispatchLocalSystemNotification({
      title: payload.title,
      body: payload.body,
      tag: `gki-efata-test-${Date.now()}`,
    });

    showToast(
      channel === 'in-app'
        ? payload.body
        : `${payload.body} (Terkirim juga ke notifikasi perangkat)`,
      {
        title: payload.title,
        variant: 'success',
      }
    );
  };

  return (
    <ChurchContext.Provider
      value={{
        data,
        currentPage,
        navigate,
        darkMode,
        themePreference,
        systemPrefersDark,
        toggleDarkMode,
        cycleThemeMode,
        setThemeMode,
        fontScale,
        increaseFont,
        decreaseFont,
        resetFont,
        currentUser,
        login,
        demoLogin,
        logout,
        toast,
        showToast,
        dismissToast,
        updateLiturgy,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        updateWarta,
        addGalleryItem,
        deleteGalleryItem,
        updateFinance,
        updateStatistics,
        updateAccountPassword,
        resetAllData,
        bookmarkedVerses,
        activeBibleTarget,
        clearActiveBibleTarget,
        toggleBookmarkVerse,
        removeBookmarkVerse,
        isVerseBookmarked,
        favoriteDailyVerses,
        toggleFavoriteDailyVerse,
        removeFavoriteDailyVerse,
        isDailyVerseFavorited,
        openBiblePassage,
        syncOfflineWorshipCache,
        customLogo,
        applyCustomLogo,
        resetCustomLogo,
        activeHymnTarget,
        openHymn,
        clearActiveHymnTarget,
        activeLiturgyStepId,
        openLiturgyStep,
        clearActiveLiturgyStep,
        applySyncedChurchData,
        dailyReminderSettings,
        browserNotificationPermission,
        todaySchedules,
        toggleDailyReminder,
        updateDailyReminderTime,
        requestSystemNotificationAccess,
        sendTestDailyReminder,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
};

export function useChurch() {
  const ctx = useContext(ChurchContext);
  if (!ctx) throw new Error('useChurch must be used inside ChurchProvider');
  return ctx;
}
