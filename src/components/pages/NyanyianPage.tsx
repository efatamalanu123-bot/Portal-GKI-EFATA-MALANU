import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Music, Search, X } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { HymnCategory } from '../../types/church';
import {
  HymnSearchResult,
  searchHymns,
  splitTextBySearchTokens,
} from '../../utils/hymnSearch';
import { ReadingToolbar } from '../ChurchLogo';
import {
  ImmersiveReaderToolbar,
  ImmersiveReaderSettings,
  loadImmersiveReaderSettings,
  saveImmersiveReaderSettings,
  getReaderThemeClass,
  getReaderLineHeight,
} from '../ImmersiveReader';

const CATEGORY_OPTIONS: Array<{ id: 'Semua' | HymnCategory; label: string }> = [
  { id: 'Semua', label: 'Semua' },
  { id: 'KJ', label: 'KJ' },
  { id: 'NR', label: 'NR' },
  { id: 'Mazmur', label: 'Mazmur' },
  { id: 'Suara Gembira', label: 'Suara Gembira' },
];

const LYRIC_SNIPPET_SUGGESTIONS = [
  'Sungguh besar Kau',
  'Batu Karang',
  'Lembah kekelaman',
  'Tabuhlah tifa',
];

const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const parts = useMemo(() => splitTextBySearchTokens(text, query), [text, query]);
  return (
    <>
      {parts.map((part, idx) =>
        part.highlight ? (
          <mark
            key={idx}
            className="rounded px-0.5 bg-[#D4AF37]/30 text-[#431407] dark:bg-[#D4AF37]/35 dark:text-[#FCE79C] font-semibold"
          >
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
};

export const NyanyianPage: React.FC = () => {
  const { data, fontScale, showToast, activeHymnTarget, clearActiveHymnTarget } = useChurch();
  const [category, setCategory] = useState<'Semua' | HymnCategory>('Semua');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(data.hymns[0]?.id || '');
  const [readerSettings, setReaderSettings] = useState<ImmersiveReaderSettings>(
    loadImmersiveReaderSettings
  );

  useEffect(() => {
    saveImmersiveReaderSettings(readerSettings);
  }, [readerSettings]);

  useEffect(() => {
    if (activeHymnTarget) {
      setCategory('Semua');
      if (activeHymnTarget.query) {
        setQuery(activeHymnTarget.query);
      }
      setSelectedId(activeHymnTarget.id);
      clearActiveHymnTarget();
    }
  }, [activeHymnTarget, clearActiveHymnTarget]);

  const allSearchResults = useMemo<HymnSearchResult[]>(() => {
    return searchHymns(data.hymns, query);
  }, [data.hymns, query]);

  const categoryCounts = useMemo(() => {
    const counts: Record<'Semua' | HymnCategory, number> = {
      Semua: allSearchResults.length,
      KJ: 0,
      NR: 0,
      Mazmur: 0,
      'Suara Gembira': 0,
    };
    for (const item of allSearchResults) {
      counts[item.hymn.kategori] += 1;
    }
    return counts;
  }, [allSearchResults]);

  const filtered = useMemo(() => {
    if (category === 'Semua') return allSearchResults;
    return allSearchResults.filter((r) => r.hymn.kategori === category);
  }, [allSearchResults, category]);

  const activeResult =
    filtered.find((r) => r.hymn.id === selectedId) || filtered[0] || null;
  const activeHymn = activeResult?.hymn ?? null;

  const copyLyrics = () => {
    if (!activeHymn) return;
    const text = `${activeHymn.kategori} No. ${activeHymn.nomor} — ${activeHymn.judul}\n\n${activeHymn.bait.join('\n\n')}`;
    navigator.clipboard?.writeText(text);
    showToast(`Lirik ${activeHymn.kategori} No. ${activeHymn.nomor} disalin.`);
  };

  const hasQuery = query.trim().length > 0;
  const readerThemeClass = getReaderThemeClass(readerSettings.activeTheme);
  const readerLineHeight = getReaderLineHeight(readerSettings.lineSpacing);
  const finalFontSize = `${1.05 * fontScale * readerSettings.fontScaleMultiplier}rem`;

  return (
    <div className={`space-y-6 ${readerSettings.focusMode ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
            Nyanyian Rohani & Kidung Jemaat
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Smart Search berdasarkan cuplikan lirik, judul, atau nomor lagu pada KJ, NR, Mazmur, dan Suara Gembira.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImmersiveReaderToolbar
            settings={readerSettings}
            onChange={setReaderSettings}
          />
          <ReadingToolbar label="Ukuran Lirik" />
        </div>
      </div>

      {/* Desktop Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Smart Search & Results */}
        {!readerSettings.focusMode && (
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Smart Search lagu berdasarkan lirik, judul, atau nomor"
                    placeholder="Ketik cuplikan lirik, judul, atau nomor..."
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#9A3412]"
                  />
                  {hasQuery && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Hapus pencarian"
                      className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {!hasQuery && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>Contoh lirik:</span>
                    {LYRIC_SNIPPET_SUGGESTIONS.map((snippet, index) => (
                      <React.Fragment key={snippet}>
                        <button
                          type="button"
                          onClick={() => setQuery(snippet)}
                          className="text-left font-medium text-[#9A3412] dark:text-[#E5C158] hover:underline"
                        >
                          “{snippet}”
                        </button>
                        {index < LYRIC_SNIPPET_SUGGESTIONS.length - 1 && (
                          <span aria-hidden="true">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Filter Kategori</span>
                  <span className="font-mono-nums">
                    {filtered.length} dari {data.hymns.length} lagu
                  </span>
                </div>
                <div
                  role="tablist"
                  aria-label="Filter kategori nyanyian"
                  className="flex flex-wrap gap-1.5"
                >
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isActive = category === cat.id;
                    const count = categoryCounts[cat.id];
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setCategory(cat.id)}
                        className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="font-mono-nums text-[11px] opacity-85">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-600 dark:text-slate-300">
                  Tidak ada lagu yang cocok dengan pencarian Anda.
                </div>
              ) : (
                filtered.map((result) => {
                  const { hymn, matchSource, matchedSnippet, matchedVerseNumber } = result;
                  const selected = activeHymn?.id === hymn.id;
                  return (
                    <button
                      key={hymn.id}
                      type="button"
                      onClick={() => setSelectedId(hymn.id)}
                      className={`w-full text-left rounded-xl p-3.5 border transition-colors flex items-start gap-3.5 ${
                        selected
                          ? 'bg-white dark:bg-[#3D2112] border-[#9A3412] dark:border-[#D4AF37] shadow-xs'
                          : 'bg-white dark:bg-[#2B170C] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-[54px] h-11 rounded-lg bg-[#C2410C]/10 dark:bg-[#3F2111] flex flex-col items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold uppercase text-[#9A7B16] dark:text-[#E5C158] leading-none">
                          {hymn.kategori === 'Suara Gembira' ? 'SG' : hymn.kategori}
                        </span>
                        <span className="font-mono-nums text-sm font-bold text-[#9A3412] dark:text-white leading-tight">
                          {hymn.nomor}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {hasQuery ? <HighlightedText text={hymn.judul} query={query} /> : hymn.judul}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {hymn.nadaDasar} · <span className="font-mono-nums">{hymn.bait.length}</span> bait
                        </p>
                        {hasQuery && matchedSnippet && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic leading-relaxed">
                            “<HighlightedText text={matchedSnippet} query={query} />”
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Panel: Immersive Lyrics Reader */}
        <div className={readerSettings.focusMode ? 'col-span-12' : 'lg:col-span-7 lg:sticky lg:top-24'}>
          {activeHymn ? (
            <article
              className={`rounded-2xl border p-6 sm:p-8 shadow-xs space-y-6 transition-colors ${readerThemeClass}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-current/15">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold opacity-90">
                    <Music className="h-3.5 w-3.5" />
                    <span>
                      {activeHymn.kategori} No.{' '}
                      <span className="font-mono-nums">{activeHymn.nomor}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeHymn.nadaDasar}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold">
                    {hasQuery ? (
                      <HighlightedText text={activeHymn.judul} query={query} />
                    ) : (
                      activeHymn.judul
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={copyLyrics}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-current/25 bg-current/5 px-3.5 py-2 text-xs font-semibold hover:bg-current/10 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Lirik</span>
                </button>
              </div>

              <div
                className="space-y-6"
                style={{ fontSize: finalFontSize, lineHeight: readerLineHeight }}
              >
                {activeHymn.bait.map((verse, idx) => (
                  <pre
                    key={idx}
                    className="whitespace-pre-wrap font-sans leading-relaxed"
                  >
                    {hasQuery ? <HighlightedText text={verse} query={query} /> : verse}
                  </pre>
                ))}
              </div>
            </article>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
              Pilih lagu di panel kiri untuk menampilkan lirik lengkap.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
