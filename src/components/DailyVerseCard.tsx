import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Copy,
  Heart,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { BIBLE_BOOKS } from '../data/initialData';
import { DailyVerseTopic } from '../types/church';

export type { DailyVerseTopic };

interface DailyVersePayload {
  date: string;
  topic: DailyVerseTopic;
  referensi: string;
  kitab: string;
  tema: string;
  isiAyat: string;
  refleksiSingkat: string;
  doaSingkat: string;
}

const TOPIC_OPTIONS: { id: DailyVerseTopic; label: string }[] = [
  { id: 'harian', label: 'Hari Ini' },
  { id: 'pengharapan', label: 'Pengharapan' },
  { id: 'kekuatan', label: 'Kekuatan' },
  { id: 'syukur', label: 'Syukur' },
  { id: 'damai', label: 'Damai' },
  { id: 'pelayanan', label: 'Pelayanan' },
];

const TOPIC_LABEL_MAP: Record<DailyVerseTopic, string> = {
  harian: 'Hari Ini',
  pengharapan: 'Pengharapan',
  kekuatan: 'Kekuatan',
  syukur: 'Syukur',
  damai: 'Damai',
  pelayanan: 'Pelayanan',
};

const STORAGE_DAILY_VERSE_KEY = 'gki_efata_daily_verse_v1';

function getTodayKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jayapura',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function readCachedVerse(topic: DailyVerseTopic): DailyVersePayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_DAILY_VERSE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, DailyVersePayload>;
    const key = `${getTodayKey()}:${topic}`;
    const item = map[key];
    if (item && item.referensi && item.isiAyat) {
      return item;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCachedVerse(verse: DailyVersePayload) {
  try {
    const raw = localStorage.getItem(STORAGE_DAILY_VERSE_KEY);
    const existing = raw ? (JSON.parse(raw) as Record<string, DailyVersePayload>) : {};
    const todayPrefix = `${verse.date}:`;
    const nextMap: Record<string, DailyVersePayload> = {};
    for (const [k, v] of Object.entries(existing)) {
      if (k.startsWith(todayPrefix)) {
        nextMap[k] = v;
      }
    }
    nextMap[`${verse.date}:${verse.topic}`] = verse;
    localStorage.setItem(STORAGE_DAILY_VERSE_KEY, JSON.stringify(nextMap));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function matchLocalBiblePassage(
  referensi: string,
  kitabHint?: string
): { bookId: string; chapter: number } | null {
  const haystack = `${kitabHint || ''} ${referensi}`.toLowerCase();
  const matchedBook = BIBLE_BOOKS.find((b) => haystack.includes(b.name.toLowerCase()));
  if (!matchedBook) return null;

  const chapterMatch = referensi.match(/(\d+)\s*:/);
  const requestedChapter = chapterMatch ? Number(chapterMatch[1]) : 1;
  const hasChapter = matchedBook.chapters.some((c) => c.chapter === requestedChapter);
  return {
    bookId: matchedBook.id,
    chapter: hasChapter ? requestedChapter : matchedBook.chapters[0]?.chapter || 1,
  };
}

export const DailyVerseCard: React.FC = () => {
  const {
    fontScale,
    showToast,
    openBiblePassage,
    navigate,
    favoriteDailyVerses,
    toggleFavoriteDailyVerse,
    removeFavoriteDailyVerse,
    isDailyVerseFavorited,
  } = useChurch();

  const [topic, setTopic] = useState<DailyVerseTopic>('harian');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [verse, setVerse] = useState<DailyVersePayload | null>(() => readCachedVerse('harian'));
  const [loading, setLoading] = useState<boolean>(() => !readCachedVerse('harian'));
  const [error, setError] = useState<string | null>(null);
  const [showPrayer, setShowPrayer] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'favorites'>('daily');
  const [expandedFavPrayerId, setExpandedFavPrayerId] = useState<string | null>(null);

  const loadVerse = useCallback(
    async (targetTopic: DailyVerseTopic, options?: { forceRefresh?: boolean; avoid?: string }) => {
      if (!options?.forceRefresh) {
        const cached = readCachedVerse(targetTopic);
        if (cached) {
          setVerse(cached);
          setError(null);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ topic: targetTopic });
        if (options?.forceRefresh) params.set('refresh', '1');
        if (options?.avoid) params.set('avoid', options.avoid);

        const res = await fetch(`/api/daily-verse?${params.toString()}`);
        const payload = (await res.json().catch(() => ({}))) as Partial<DailyVersePayload> & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(payload.error || 'Gagal memuat ayat inspirasi harian.');
        }
        if (!payload.referensi || !payload.isiAyat) {
          throw new Error('Data ayat harian tidak lengkap.');
        }

        const completePayload: DailyVersePayload = {
          date: payload.date || getTodayKey(),
          topic: targetTopic,
          referensi: payload.referensi,
          kitab: payload.kitab || '',
          tema: payload.tema || 'Firman Hari Ini',
          isiAyat: payload.isiAyat,
          refleksiSingkat: payload.refleksiSingkat || '',
          doaSingkat: payload.doaSingkat || '',
        };

        writeCachedVerse(completePayload);
        setVerse(completePayload);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Tidak dapat terhubung ke layanan ayat harian saat ini.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadVerse(topic);
  }, [topic, loadVerse]);

  const handleCopyPayload = (target: {
    referensi: string;
    isiAyat: string;
    refleksiSingkat: string;
  }) => {
    const text = `${target.referensi} — "${target.isiAyat}"\n\nRenungan: ${target.refleksiSingkat}\n\n— Portal Jemaat GKI Efata Malanu`;
    navigator.clipboard?.writeText(text);
    showToast(`Ayat harian ${target.referensi} disalin.`, {
      title: 'Ayat Disalin',
      variant: 'success',
    });
  };

  const handleSharePayload = async (target: {
    referensi: string;
    isiAyat: string;
    refleksiSingkat: string;
  }) => {
    const shareText = `Ayat Harian · ${target.referensi}\n"${target.isiAyat}"\n\n${target.refleksiSingkat}\n\nGKI Efata Malanu Klasis Sorong`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Ayat Harian · ${target.referensi}`,
          text: shareText,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    navigator.clipboard?.writeText(shareText);
    showToast('Teks ayat harian disalin ke clipboard untuk dibagikan.');
  };

  const handleOpenBible = (referensi?: string, kitab?: string) => {
    if (!referensi) {
      navigate('alkitab');
      return;
    }
    const target = matchLocalBiblePassage(referensi, kitab);
    if (target) {
      openBiblePassage(target.bookId, target.chapter);
    } else {
      navigate('alkitab');
    }
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const currentFavorited = verse ? isDailyVerseFavorited(verse.referensi) : false;

  return (
    <section
      aria-labelledby="daily-verse-heading"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between gap-3 text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#C2410C]/12 dark:bg-[#D4AF37]/15 text-[#9A3412] dark:text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4 shrink-0" />
          </div>
          <div className="min-w-0">
            <h2
              id="daily-verse-heading"
              className="font-display text-lg font-bold text-[#9A3412] dark:text-white leading-snug group-hover:text-[#C2410C] dark:group-hover:text-[#E5C158] transition-colors"
            >
              Ayat Harian Jemaat
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {formattedDate}
              {verse?.tema ? ` · ${verse.tema}` : ''}
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#9A3412] group-hover:text-white dark:group-hover:bg-[#D4AF37] dark:group-hover:text-[#431407] transition-colors shrink-0">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#9A7B16] dark:text-[#E5C158]">
              {viewMode === 'favorites'
                ? `Ayat Favorit (${favoriteDailyVerses.length})`
                : 'Inspirasi Firman Harian'}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) => (prev === 'favorites' ? 'daily' : 'favorites'))
                }
                aria-pressed={viewMode === 'favorites'}
                aria-label={`Lihat ayat favorit tersimpan (${favoriteDailyVerses.length})`}
                title="Ayat favorit tersimpan"
                className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  viewMode === 'favorites'
                    ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                    : 'border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] text-[#9A3412] dark:text-[#E5C158] hover:border-[#D4AF37]'
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 shrink-0 ${
                    favoriteDailyVerses.length > 0 ? 'fill-current' : ''
                  }`}
                />
                <span className="font-mono-nums">{favoriteDailyVerses.length}</span>
              </button>

              {viewMode === 'daily' && (
                <button
                  type="button"
                  onClick={() =>
                    loadVerse(topic, {
                      forceRefresh: true,
                      avoid: verse?.referensi,
                    })
                  }
                  disabled={loading}
                  title="Muat ayat inspirasi baru"
                  aria-label="Muat ayat inspirasi baru"
                  className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] text-[#9A3412] dark:text-[#E5C158] hover:border-[#D4AF37] disabled:opacity-50 transition-colors shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {viewMode === 'favorites' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Ayat Hari Ini</span>
            </button>
          </div>

          {favoriteDailyVerses.length === 0 ? (
            <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-5 text-center space-y-2.5">
              <Heart className="h-7 w-7 text-[#D4AF37] mx-auto" />
              <p className="text-sm font-semibold text-[#9A3412] dark:text-white">
                Belum Ada Ayat Favorit
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ketuk tombol <strong>Favorit</strong> pada Ayat Harian untuk menyimpannya di perangkat Anda dan dibaca kembali sebagai renungan.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className="min-h-[38px] inline-flex items-center justify-center rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-1.5 text-xs font-semibold text-white dark:text-[#431407]"
              >
                Lihat Ayat Hari Ini
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto pr-1">
              {favoriteDailyVerses.map((fav) => {
                const prayerOpen = expandedFavPrayerId === fav.id;
                return (
                  <article key={fav.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono-nums text-xs font-bold text-[#9A7B16] dark:text-[#E5C158]">
                          {fav.referensi}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {TOPIC_LABEL_MAP[fav.topic] || fav.topic}
                          {fav.tema ? ` · ${fav.tema}` : ''}
                          {' · '}
                          {fav.savedAt}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFavoriteDailyVerse(fav.id)}
                        aria-label={`Hapus ${fav.referensi} dari favorit`}
                        title="Hapus dari favorit"
                        className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <blockquote
                      style={{ fontSize: `${Math.round(14 * fontScale)}px` }}
                      className="font-serif-reading italic text-slate-800 dark:text-slate-100 leading-relaxed"
                    >
                      “{fav.isiAyat}”
                    </blockquote>

                    {fav.refleksiSingkat && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {fav.refleksiSingkat}
                      </p>
                    )}

                    {fav.doaSingkat && (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFavPrayerId((prev) =>
                              prev === fav.id ? null : fav.id
                            )
                          }
                          className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline"
                        >
                          {prayerOpen ? 'Sembunyikan Doa' : 'Lihat Doa Singkat'}
                        </button>
                        {prayerOpen && (
                          <p className="mt-1.5 rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-2.5 text-xs italic text-slate-700 dark:text-slate-200 leading-relaxed">
                            {fav.doaSingkat}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenBible(fav.referensi, fav.kitab)}
                        className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#D4AF37] whitespace-nowrap"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Buka Alkitab</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyPayload(fav)}
                          aria-label={`Salin ${fav.referensi}`}
                          title="Salin ayat"
                          className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#D4AF37]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSharePayload(fav)}
                          aria-label={`Bagikan ${fav.referensi}`}
                          title="Bagikan ayat"
                          className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#D4AF37]"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Topic Selector */}
          <div
            role="tablist"
            aria-label="Tema ayat harian"
            className="flex flex-wrap gap-1.5"
          >
            {TOPIC_OPTIONS.map((opt) => {
              const active = topic === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTopic(opt.id)}
                  className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                      : 'bg-[#FAF2E8] dark:bg-[#1E1008] text-slate-600 dark:text-slate-300 hover:text-[#431407] dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Verse Body */}
          {loading && !verse ? (
            <div className="space-y-3 py-2" aria-busy="true" aria-label="Memuat ayat harian">
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3.5 w-11/12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            </div>
          ) : error && !verse ? (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 space-y-2.5">
              <div className="flex items-start gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadVerse(topic, { forceRefresh: true })}
                  className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-[#9A3412] dark:bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-white dark:text-[#431407]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Coba Lagi</span>
                </button>
                {favoriteDailyVerses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode('favorites')}
                    className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3 py-1.5 text-xs font-semibold text-[#9A3412] dark:text-[#E5C158]"
                  >
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    <span>Buka Favorit ({favoriteDailyVerses.length})</span>
                  </button>
                )}
              </div>
            </div>
          ) : verse ? (
            <div className="space-y-3">
              {error && (
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  Menampilkan ayat tersimpan: {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-nums text-xs font-bold text-[#9A7B16] dark:text-[#E5C158]">
                  {verse.referensi}
                </span>
                {loading && (
                  <span className="text-[11px] text-slate-400">Memperbarui...</span>
                )}
              </div>

              <blockquote
                style={{ fontSize: `${Math.round(15 * fontScale)}px` }}
                className="font-serif-reading italic text-slate-800 dark:text-slate-100 leading-relaxed"
              >
                “{verse.isiAyat}”
              </blockquote>

              {verse.refleksiSingkat && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {verse.refleksiSingkat}
                </p>
              )}

              {verse.doaSingkat && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPrayer((prev) => !prev)}
                    className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline"
                  >
                    {showPrayer ? 'Sembunyikan Doa Singkat' : 'Lihat Doa Singkat'}
                  </button>
                  {showPrayer && (
                    <p className="mt-2 rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-3 text-xs italic text-slate-700 dark:text-slate-200 leading-relaxed">
                      {verse.doaSingkat}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenBible(verse.referensi, verse.kitab)}
                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#D4AF37] transition-colors whitespace-nowrap"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>Buka Alkitab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFavoriteDailyVerse(verse)}
                    aria-pressed={currentFavorited}
                    aria-label={
                      currentFavorited
                        ? `Hapus ${verse.referensi} dari favorit`
                        : `Simpan ${verse.referensi} ke favorit`
                    }
                    className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      currentFavorited
                        ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                        : 'border-slate-200 dark:border-slate-700 text-[#9A3412] dark:text-slate-100 hover:border-[#D4AF37]'
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${currentFavorited ? 'fill-current' : 'text-[#D4AF37]'}`}
                    />
                    <span>{currentFavorited ? 'Tersimpan' : 'Favorit'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyPayload(verse)}
                    aria-label="Salin ayat harian"
                    title="Salin ayat harian"
                    className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#D4AF37] hover:text-[#9A3412] dark:hover:text-[#E5C158] transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSharePayload(verse)}
                    aria-label="Bagikan ayat harian"
                    title="Bagikan ayat harian"
                    className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#D4AF37] hover:text-[#9A3412] dark:hover:text-[#E5C158] transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
        </div>
      )}
    </section>
  );
};
