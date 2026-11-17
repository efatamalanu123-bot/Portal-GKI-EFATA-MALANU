import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Copy,
  HeartHandshake,
  Info,
  MapPin,
  MessageCircle,
  Moon,
  Music,
  Newspaper,
  Share2,
  Sun,
  Sunset,
  Users,
  Wallet,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { PageId } from '../../types/church';
import { CHURCH_IMAGES } from '../../utils/churchAssets';
import {
  getTodayPrayerCount,
  PRAYER_COUNT_UPDATED_EVENT,
  STORAGE_DAILY_PRAYER_COUNTER_KEY,
} from '../../utils/prayerCounter';
import { ChurchLogo } from '../ChurchLogo';
import { AddToCalendarMenu } from '../AddToCalendarMenu';
import { BibleReadingPlanCard } from '../BibleReadingPlanCard';
import { DailyVerseCard } from '../DailyVerseCard';
import { DriveLogoSyncCard } from '../DriveLogoSyncCard';
import { GlobalSearchBar } from '../GlobalSearchBar';

interface MenuItemDef {
  id: PageId;
  label: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
}

const MAIN_MENUS: MenuItemDef[] = [
  { id: 'tata-ibadah', label: 'Tata Ibadah', subtitle: 'Liturgi & lagu', icon: BookOpen },
  { id: 'jadwal', label: 'Jadwal Ibadah', subtitle: 'Minggu & Rayon', icon: CalendarDays },
  { id: 'warta', label: 'Warta Jemaat', subtitle: 'Info & PDF', icon: Newspaper },
  { id: 'pastoral', label: 'Layanan Pastoral', subtitle: 'Kunjungan & Kontak', icon: Users },
  { id: 'layanan', label: 'Layanan Jemaat', subtitle: 'Doa & Baptis', icon: HeartHandshake },
  { id: 'nyanyian', label: 'Nyanyian Rohani', subtitle: 'NR, KJ & Mazmur', icon: Music },
  { id: 'alkitab', label: 'Alkitab', subtitle: 'PL & PB lengkap', icon: BookMarked },
  { id: 'keuangan', label: 'Laporan Keuangan', subtitle: 'Kas & Aksi', icon: Wallet },
  { id: 'statistik', label: 'Data & Statistik', subtitle: 'KK & Majelis', icon: BarChart3 },
  { id: 'profil', label: 'Profil & Kontak', subtitle: 'Lokasi & Rek', icon: Info },
];

type TimePeriod = 'morning' | 'afternoon' | 'evening';

function getWitGreeting(): {
  salutation: string;
  subtitle: string;
  period: TimePeriod;
} {
  try {
    const hourStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jayapura',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    const hour = Number(hourStr);

    if (hour >= 4 && hour < 11) {
      return {
        salutation: 'Selamat Pagi',
        subtitle: 'Selamat Datang · Awali hari dalam kasih dan firman Tuhan',
        period: 'morning',
      };
    }
    if (hour >= 11 && hour < 15) {
      return {
        salutation: 'Selamat Siang',
        subtitle: 'Selamat Datang · Kiranya damai sejahtera menyertai aktivitas Anda',
        period: 'afternoon',
      };
    }
    if (hour >= 15 && hour < 18) {
      return {
        salutation: 'Selamat Sore',
        subtitle: 'Selamat Datang · Mari bersekutu dan melayani dengan sukacita',
        period: 'afternoon',
      };
    }
    return {
      salutation: 'Selamat Malam',
      subtitle: 'Selamat Datang · Kiranya Tuhan memberi keteduhan dan istirahat yang damai',
      period: 'evening',
    };
  } catch {
    return {
      salutation: 'Shalom',
      subtitle: 'Selamat Datang di Portal Jemaat GKI Efata Malanu',
      period: 'morning',
    };
  }
}

export const HomePage: React.FC = () => {
  const { data, navigate, todaySchedules, dailyReminderSettings, toggleDailyReminder, showToast } =
    useChurch();
  const { liturgy, schedules, warta, gallery } = data;

  const [greeting, setGreeting] = useState(getWitGreeting);
  const [prayerCount, setPrayerCount] = useState<number>(getTodayPrayerCount);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isWartaExpanded, setIsWartaExpanded] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGreeting(getWitGreeting());
      setPrayerCount(getTodayPrayerCount());
    }, 60_000);

    const handlePrayerUpdate = () => {
      setPrayerCount(getTodayPrayerCount());
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_DAILY_PRAYER_COUNTER_KEY) {
        setPrayerCount(getTodayPrayerCount());
      }
    };

    window.addEventListener(PRAYER_COUNT_UPDATED_EVENT, handlePrayerUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(PRAYER_COUNT_UPDATED_EVENT, handlePrayerUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!shareMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShareMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [shareMenuOpen]);

  const portalUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareTitle = 'Portal Jemaat GKI Efata Malanu';
  const shareMessage = `Shalom! Mari akses Tata Ibadah, Jadwal Pelayanan, Warta Jemaat, Nyanyian Rohani, dan Alkitab di Portal Jemaat GKI Efata Malanu:\n${portalUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const supportsNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyPortalLink = async () => {
    try {
      await navigator.clipboard?.writeText(portalUrl);
      setCopiedLink(true);
      showToast('Tautan Portal Jemaat GKI Efata Malanu berhasil disalin.', {
        title: 'Tautan Disalin',
        variant: 'success',
      });
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Gagal menyalin tautan secara otomatis.', {
        title: 'Gagal Menyalin',
        variant: 'warning',
      });
    }
    setShareMenuOpen(false);
  };

  const handleNativeShare = async () => {
    if (!supportsNativeShare) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: 'Shalom! Akses informasi ibadah, warta, nyanyian, dan pelayanan GKI Efata Malanu di sini:',
        url: portalUrl,
      });
      setShareMenuOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  };

  const upcomingSchedules = schedules.slice(0, 3);
  const latestWarta = warta.pengumuman.slice(0, 3);

  const GreetingIcon =
    greeting.period === 'morning' ? Sun : greeting.period === 'afternoon' ? Sunset : Moon;

  return (
    <div className="space-y-8">
      {/* Dynamic Greeting & Sub-header Identity Banner */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <ChurchLogo className="h-12 w-12 shrink-0 mt-1 sm:mt-0" />
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A7B16] dark:text-[#E5C158]">
              <GreetingIcon className="h-3.5 w-3.5 shrink-0" />
              <span>
                {greeting.salutation}, Selamat Datang
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#9A3412] dark:text-white">
              GKI EFATA MALANU
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              {greeting.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Jemaat Berdoa Today Counter */}
          <button
            type="button"
            onClick={() => navigate('layanan')}
            aria-label={`Jemaat berdoa hari ini: ${prayerCount} pokok doa. Klik untuk kirim pokok doa.`}
            className="group flex items-center gap-3 rounded-xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 shadow-xs hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-[#C2410C]/12 dark:bg-[#D4AF37]/15 text-[#9A3412] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Jemaat berdoa
              </p>
              <p className="text-sm font-bold text-[#9A3412] dark:text-white font-mono-nums leading-tight">
                {prayerCount}{' '}
                <span className="font-sans text-xs font-medium text-slate-600 dark:text-slate-300">
                  doa hari ini
                </span>
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#9A3412] dark:group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </button>

          {/* Social Share Portal Button & Menu */}
          <div className="relative" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setShareMenuOpen((prev) => !prev)}
              aria-expanded={shareMenuOpen}
              aria-haspopup="menu"
              aria-label="Bagikan tautan portal gereja ke jemaat"
              className="min-h-[54px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-3.5 py-2.5 text-xs font-bold text-white dark:text-[#431407] shadow-xs hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              <span>Bagikan Portal</span>
            </button>

            {shareMenuOpen && (
              <div
                role="menu"
                aria-label="Pilihan berbagi portal jemaat"
                className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-700 shadow-lg p-2 z-30 space-y-1"
              >
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={() => setShareMenuOpen(false)}
                  className="w-full min-h-[42px] flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>Bagikan via WhatsApp</span>
                </a>

                {supportsNativeShare && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleNativeShare}
                    className="w-full min-h-[42px] flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <Share2 className="h-4 w-4 shrink-0 text-[#9A3412] dark:text-[#D4AF37]" />
                    <span>Platform Lainnya...</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopyPortalLink}
                  className="w-full min-h-[42px] flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 shrink-0 text-[#9A3412] dark:text-[#D4AF37]" />
                  )}
                  <span>{copiedLink ? 'Tautan Tersalin' : 'Salin Tautan Portal'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <DriveLogoSyncCard variant="banner" />

      <GlobalSearchBar />

      {/* Main 2-Column Desktop Layout (Left 65% = 8 cols, Right 35% = 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (~65%): Banner Utama + Grid Menu + Rencana Bacaan */}
        <div className="lg:col-span-8 space-y-7">
          {/* Banner Utama */}
          <section className="relative overflow-hidden rounded-2xl bg-[#7C2D12] text-white shadow-sm border border-[#9A3412]">
            <img
              src={CHURCH_IMAGES.sanctuary}
              alt="Ruang Ibadah GKI Efata Malanu Sorong"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#7C2D12] via-[#9A3412]/90 to-[#C2410C]/75" />

            <div className="relative p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#FCE79C]">
                <span>{liturgy.mingguTanggal}</span>
                <span aria-hidden="true">·</span>
                <span>{liturgy.jamIbadah}</span>
              </div>

              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-100/90">
                  Tema Pelayanan GKI
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-snug text-white">
                  {liturgy.temaPelayanan}
                </h2>
              </div>

              <div className="pt-1 border-t border-white/15 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FCE79C] mb-1">
                  Ayat Minggu Ini · {liturgy.ayatReferensi}
                </p>
                <p className="font-serif-reading italic text-sm sm:text-base text-orange-50 leading-relaxed">
                  “{liturgy.ayatMingguIni}”
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('tata-ibadah')}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#431407] hover:bg-[#e1be49] transition-colors shadow-xs whitespace-nowrap"
                >
                  <span>Buka Tata Ibadah Minggu Ini</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('warta')}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors whitespace-nowrap"
                >
                  <span>Baca Warta Jemaat</span>
                </button>
              </div>
            </div>
          </section>

          {/* Grid Menu Utama (10 Menu Ikon: 3 col HP, 4 col Tablet, 5 col Desktop) */}
          <section aria-labelledby="menu-utama-heading">
            <div className="flex items-baseline justify-between mb-4">
              <h2
                id="menu-utama-heading"
                className="font-display text-lg sm:text-xl font-bold text-[#9A3412] dark:text-white"
              >
                Menu Pelayanan Jemaat
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                10 layanan portal
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
              {MAIN_MENUS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className="group flex flex-col items-center text-center rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:shadow-sm transition-all min-h-[108px] focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                  >
                    <div className="h-11 w-11 rounded-xl bg-[#C2410C]/10 dark:bg-[#3F2111] text-[#431407] dark:text-[#E5C158] flex items-center justify-center group-hover:bg-[#9A3412] group-hover:text-[#D4AF37] dark:group-hover:bg-[#D4AF37] dark:group-hover:text-[#431407] transition-colors mb-2.5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                      {item.label}
                    </span>
                    <span className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <BibleReadingPlanCard />
        </div>

        {/* Right Column (~35%): Ayat Harian, Jadwal Ibadah Terdekat, Warta Terbaru & Ayat Minggu Ini */}
        <aside className="lg:col-span-4 space-y-6">
          <DailyVerseCard />

          {/* Panel 1: Jadwal Ibadah Terdekat (Accordion) */}
          <section
            aria-labelledby="jadwal-terdekat-heading"
            className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
          >
            <button
              type="button"
              onClick={() => setIsScheduleExpanded((prev) => !prev)}
              aria-expanded={isScheduleExpanded}
              className="w-full flex items-center justify-between gap-3 text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-[#C2410C]/12 dark:bg-[#D4AF37]/15 text-[#9A3412] dark:text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="jadwal-terdekat-heading"
                    className="font-display text-lg font-bold text-[#9A3412] dark:text-white leading-snug group-hover:text-[#C2410C] dark:group-hover:text-[#E5C158] transition-colors"
                  >
                    Jadwal Ibadah Terdekat
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {upcomingSchedules.length} agenda ibadah minggu & rayon
                  </p>
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#9A3412] group-hover:text-white dark:group-hover:bg-[#D4AF37] dark:group-hover:text-[#431407] transition-colors shrink-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${
                    isScheduleExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isScheduleExpanded && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingSchedules.map((sch) => (
                    <div
                      key={sch.id}
                      className="py-3 first:pt-1 last:pb-1 space-y-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => navigate('jadwal')}
                        className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs font-medium text-[#9A7B16] dark:text-[#E5C158]">
                          <span>
                            {sch.kategori === 'Rayon'
                              ? `Rayon ${sch.rayon}`
                              : sch.unsur || sch.kategori}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{sch.hariTanggal}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
                          {sch.judul}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {sch.waktu}
                          </span>
                          <span className="inline-flex items-center gap-1 truncate max-w-[210px]">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{sch.tempat}</span>
                          </span>
                        </div>
                      </button>
                      <div>
                        <AddToCalendarMenu item={sch} compact />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Bell className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                    <span>
                      {todaySchedules.length > 0
                        ? `${todaySchedules.length} ibadah hari ini`
                        : `Pengingat ${dailyReminderSettings.reminderTime} WIT`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDailyReminder()}
                    className="font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
                  >
                    {dailyReminderSettings.enabled ? 'Pengingat Aktif' : 'Aktifkan Pengingat'}
                  </button>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('jadwal')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
                  >
                    <span>Lihat Semua Jadwal</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Panel 2: Warta Terbaru (Accordion) */}
          <section
            aria-labelledby="warta-terbaru-heading"
            className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
          >
            <button
              type="button"
              onClick={() => setIsWartaExpanded((prev) => !prev)}
              aria-expanded={isWartaExpanded}
              className="w-full flex items-center justify-between gap-3 text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-[#C2410C]/12 dark:bg-[#D4AF37]/15 text-[#9A3412] dark:text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Newspaper className="h-4 w-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="warta-terbaru-heading"
                    className="font-display text-lg font-bold text-[#9A3412] dark:text-white leading-snug group-hover:text-[#C2410C] dark:group-hover:text-[#E5C158] transition-colors"
                  >
                    Warta Terbaru
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {warta.edisi} · {latestWarta.length} pengumuman
                  </p>
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#9A3412] group-hover:text-white dark:group-hover:bg-[#D4AF37] dark:group-hover:text-[#431407] transition-colors shrink-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${
                    isWartaExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isWartaExpanded && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {latestWarta.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Belum ada pengumuman warta jemaat terbaru.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {latestWarta.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate('warta')}
                        className="w-full text-left py-3 first:pt-1 last:pb-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono-nums font-semibold text-[#9A7B16] dark:text-[#E5C158]">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.kategori}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.tanggalTerbit}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
                          {item.judul}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('warta')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
                  >
                    <span>Buka Warta Jemaat</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Panel 3: Ayat Minggu Ini & Pelayan Firman */}
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                Ayat Minggu Ini
              </h2>
              <span className="font-mono-nums text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
                {liturgy.ayatReferensi}
              </span>
            </div>

            <blockquote className="font-serif-reading italic text-base text-slate-800 dark:text-slate-200 leading-relaxed">
              “{liturgy.ayatMingguIni}”
            </blockquote>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Pelayan Firman:</span>{' '}
                {liturgy.pelayanFirman}
              </p>
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Edisi Warta:</span>{' '}
                {warta.edisi} ({warta.pengumuman.length} pengumuman)
              </p>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('alkitab')}
                className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Baca Alkitab
              </button>
              <button
                type="button"
                onClick={() => navigate('nyanyian')}
                className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cari Nyanyian
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Sekilas Warta & Galeri Kegiatan Jemaat */}
      <section className="pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
            Galeri Pelayanan Jemaat
          </h2>
          <button
            type="button"
            onClick={() => navigate('profil')}
            className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline"
          >
            Lihat Profil Gereja
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {gallery.slice(0, 3).map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#9A3412] to-[#EA580C] overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.judul}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-1.5">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.tanggal}</p>
                  <h3 className="text-base font-semibold text-[#9A3412] dark:text-white mt-0.5">
                    {item.judul}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {item.deskripsi}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
