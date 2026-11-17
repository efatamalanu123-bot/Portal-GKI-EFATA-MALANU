import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Home,
  Lock,
  Moon,
  Music,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { PageId } from '../types/church';
import { ChurchLogo } from './ChurchLogo';
import { NotificationToast } from './NotificationToast';
import { OfflineIndicator } from './PWAHelpers';
import { HeaderConnectionIndicator } from './HeaderConnectionIndicator';
import { ReminderBellButton } from './DailyReminderCard';
import { ThemeMenu } from './ThemeMenu';

const PAGE_TITLES: Record<PageId, string> = {
  beranda: 'GKI Efata Malanu',
  'tata-ibadah': 'Tata Ibadah Minggu',
  jadwal: 'Jadwal Ibadah & Rayon',
  warta: 'Warta Jemaat',
  nyanyian: 'Nyanyian Rohani',
  alkitab: 'Alkitab',
  layanan: 'Layanan Jemaat',
  pastoral: 'Layanan Pastoral',
  keuangan: 'Laporan Keuangan',
  statistik: 'Data & Statistik',
  profil: 'Profil & Kontak',
  login: 'Login Pengurus',
  admin: 'Dashboard Admin',
};

const DESKTOP_NAV: { id: PageId; label: string }[] = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tata-ibadah', label: 'Tata Ibadah' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'pastoral', label: 'Pastoral' },
  { id: 'nyanyian', label: 'Nyanyian' },
  { id: 'alkitab', label: 'Alkitab' },
];

const MOBILE_BOTTOM_NAV: { id: PageId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'tata-ibadah', label: 'Tata Ibadah', icon: BookOpen },
  { id: 'nyanyian', label: 'Nyanyian', icon: Music },
  { id: 'profil', label: 'Profil', icon: User },
];

export const LayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentPage,
    navigate,
    darkMode,
    toggleDarkMode,
    increaseFont,
    decreaseFont,
    fontScale,
    currentUser,
    toast,
    dismissToast,
  } = useChurch();

  const isAdminPage = currentPage === 'admin';

  const themeToggleFab = (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
      className={`fixed right-4 md:right-6 z-40 h-12 w-12 rounded-full bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407] shadow-lg border border-[#D4AF37]/40 dark:border-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-[#D4AF37] no-print ${
        isAdminPage ? 'bottom-6' : 'bottom-20 md:bottom-6'
      }`}
    >
      {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );

  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-[#FAF2E8] dark:bg-[#180D07] text-slate-900 dark:text-slate-100 transition-colors">
        {children}
        {themeToggleFab}
        <OfflineIndicator />
        <NotificationToast toast={toast} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF2E8] dark:bg-[#180D07] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar (Responsive: Compact mobile app bar <768px, Full 3-zone header >=768px) */}
      <header className="sticky top-0 z-40 h-14 md:h-16 bg-white/95 dark:bg-[#221209]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-[1280px] mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4 lg:gap-8">
          {/* Left Zone: Logo / Back on Mobile */}
          <div className="flex items-center gap-3 min-w-0">
            {currentPage !== 'beranda' && (
              <button
                type="button"
                onClick={() => navigate('beranda')}
                aria-label="Kembali ke Beranda"
                className="md:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[#9A3412] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('beranda')}
              className="flex items-center gap-2.5 text-left min-w-0 focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded-lg"
            >
              <ChurchLogo className="h-8 w-8 md:h-9 md:w-9 shrink-0" />
              <span className="font-display text-base md:text-lg font-bold tracking-tight text-[#9A3412] dark:text-white whitespace-nowrap truncate">
                {currentPage === 'beranda' ? 'GKI EFATA MALANU' : PAGE_TITLES[currentPage]}
              </span>
            </button>
          </div>

          {/* Center Zone: Desktop & Tablet Navigation Links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium"
          >
            {DESKTOP_NAV.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`relative py-2 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${
                    active
                      ? 'text-[#9A3412] dark:text-[#D4AF37] font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#9A3412] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#D4AF37]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Zone: A-/A+ Font Size & Dark Mode Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#361D10] p-0.5">
              <button
                type="button"
                onClick={decreaseFont}
                disabled={fontScale <= 0.85}
                title="Perkecil huruf (A-)"
                aria-label="Perkecil huruf"
                className="min-h-[36px] min-w-[36px] px-2 rounded-md text-xs font-bold text-[#9A3412] dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                A-
              </button>
              <button
                type="button"
                onClick={increaseFont}
                disabled={fontScale >= 1.45}
                title="Perbesar huruf (A+)"
                aria-label="Perbesar huruf"
                className="min-h-[36px] min-w-[36px] px-2 rounded-md text-xs font-bold text-[#9A3412] dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                A+
              </button>
            </div>

            <HeaderConnectionIndicator />
            <ReminderBellButton />
            <ThemeMenu variant="header" />

            {currentUser && (
              <button
                type="button"
                onClick={() => navigate('admin')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#9A3412] dark:bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 pt-5 pb-24 md:pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#221209] pb-20 md:pb-8 pt-8 no-print">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ChurchLogo className="h-8 w-8 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#9A3412] dark:text-white">
                GKI Efata Malanu · Klasis Sorong — Tanah Papua
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Jl. Basuki Rahmat Km. 9, Malanu, Sorong Utara · Kota Sorong, Papua Barat Daya
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('profil')}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#9A3412] dark:hover:text-[#D4AF37] underline-offset-4 hover:underline min-h-[36px] px-1"
            >
              Profil & Rekening
            </button>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => navigate(currentUser ? 'admin' : 'login')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors min-h-[36px]"
            >
              <Lock className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>{currentUser ? 'Buka Dashboard Admin' : 'Login Majelis / Admin'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Navigasi Bawah"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#221209]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center px-1 no-print"
      >
        {MOBILE_BOTTOM_NAV.map((tab) => {
          const Icon = tab.icon;
          const active = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                active
                  ? 'text-[#9A3412] dark:text-[#D4AF37] font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {themeToggleFab}

      <OfflineIndicator />

      <NotificationToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
};
