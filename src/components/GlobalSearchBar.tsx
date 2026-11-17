import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Music,
  Newspaper,
  Search,
  X,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import {
  normalizeHymnText,
  searchHymns,
  splitTextBySearchTokens,
} from '../utils/hymnSearch';

type SearchDomainFilter = 'semua' | 'warta' | 'nyanyian' | 'tata-ibadah' | 'jadwal';

interface PortalSearchResult {
  id: string;
  domain: Exclude<SearchDomainFilter, 'semua'>;
  domainLabel: string;
  metaText: string;
  title: string;
  snippet: string;
  score: number;
  onSelect: () => void;
}

const FILTER_TABS: { id: SearchDomainFilter; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'warta', label: 'Warta Jemaat' },
  { id: 'nyanyian', label: 'Nyanyian Rohani' },
  { id: 'tata-ibadah', label: 'Tata Ibadah' },
  { id: 'jadwal', label: 'Jadwal Ibadah' },
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

function computeTextMatchScore(
  fields: Array<{ text: string; weight: number }>,
  normalizedQuery: string,
  tokens: string[]
): { matched: boolean; score: number; snippetSource: string } {
  const combined = normalizeHymnText(fields.map((f) => f.text).join(' '));
  if (!combined || !tokens.every((t) => combined.includes(t))) {
    return { matched: false, score: 0, snippetSource: '' };
  }

  let bestScore = 20;
  let snippetSource = fields[fields.length - 1]?.text || '';

  for (const field of fields) {
    const norm = normalizeHymnText(field.text);
    if (!norm) continue;
    if (norm.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, field.weight + 25);
      snippetSource = field.text;
    } else if (tokens.some((t) => norm.includes(t))) {
      bestScore = Math.max(bestScore, field.weight);
      if (!snippetSource || snippetSource === fields[0]?.text) {
        snippetSource = field.text;
      }
    }
  }

  return { matched: true, score: bestScore, snippetSource };
}

function shortenSnippet(text: string, maxLen = 140): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3)}...`;
}

export const GlobalSearchBar: React.FC = () => {
  const { data, navigate, openHymn, openLiturgyStep } = useChurch();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchDomainFilter>('semua');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current && query) {
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [query]);

  const allResults = useMemo<PortalSearchResult[]>(() => {
    const trimmed = query.trim();
    const normalizedQuery = normalizeHymnText(trimmed);
    if (!normalizedQuery) return [];
    const tokens = normalizedQuery.split(' ').filter(Boolean);
    const items: PortalSearchResult[] = [];

    // 1. Warta Jemaat (Pengumuman, HUT, Berita Duka/Sakit)
    for (const ann of data.warta.pengumuman) {
      const match = computeTextMatchScore(
        [
          { text: ann.judul, weight: 75 },
          { text: ann.kategori, weight: 40 },
          { text: ann.isi, weight: 55 },
        ],
        normalizedQuery,
        tokens
      );
      if (match.matched) {
        items.push({
          id: `warta-${ann.id}`,
          domain: 'warta',
          domainLabel: 'Warta Jemaat',
          metaText: `${ann.kategori} · ${ann.tanggalTerbit}`,
          title: ann.judul,
          snippet: shortenSnippet(ann.isi),
          score: match.score,
          onSelect: () => navigate('warta'),
        });
      }
    }

    for (const hut of data.warta.hutJemaat) {
      const match = computeTextMatchScore(
        [
          { text: `HUT Ulang Tahun ${hut.nama}`, weight: 60 },
          { text: hut.rayon, weight: 40 },
          { text: hut.tanggal, weight: 35 },
        ],
        normalizedQuery,
        tokens
      );
      if (match.matched) {
        items.push({
          id: `hut-${hut.id}`,
          domain: 'warta',
          domainLabel: 'Warta Jemaat',
          metaText: `HUT Jemaat · ${hut.rayon} · ${hut.tanggal}`,
          title: hut.nama,
          snippet: `Ucapan syukur ulang tahun jemaat ${hut.rayon} pada ${hut.tanggal}.`,
          score: match.score,
          onSelect: () => navigate('warta'),
        });
      }
    }

    for (const care of data.warta.beritaDukaSakit) {
      const match = computeTextMatchScore(
        [
          { text: `${care.jenis} ${care.nama}`, weight: 65 },
          { text: care.rayon, weight: 40 },
          { text: care.keterangan, weight: 50 },
        ],
        normalizedQuery,
        tokens
      );
      if (match.matched) {
        items.push({
          id: `care-${care.id}`,
          domain: 'warta',
          domainLabel: 'Warta Jemaat',
          metaText: `Pokok Doa ${care.jenis} · ${care.rayon}`,
          title: care.nama,
          snippet: shortenSnippet(care.keterangan),
          score: match.score,
          onSelect: () => navigate('warta'),
        });
      }
    }

    // 2. Nyanyian Rohani (reuses Smart Search across nomor, judul & bait)
    const hymnHits = searchHymns(data.hymns, trimmed);
    for (const hit of hymnHits) {
      const { hymn, score, matchedVerseNumber, matchedSnippet } = hit;
      const snippetText =
        matchedSnippet || shortenSnippet(hymn.bait[0]?.replace(/\n/g, ' / ') || '');
      items.push({
        id: `hymn-${hymn.id}`,
        domain: 'nyanyian',
        domainLabel: 'Nyanyian Rohani',
        metaText: `${hymn.kategori} No. ${hymn.nomor} · Nada ${hymn.nadaDasar}${
          matchedVerseNumber ? ` · Bait ${matchedVerseNumber}` : ''
        }`,
        title: `${hymn.kategori} ${hymn.nomor} — ${hymn.judul}`,
        snippet: snippetText,
        score,
        onSelect: () => openHymn(hymn.id, trimmed),
      });
    }

    // 3. Tata Ibadah (Tema Minggu + setiap bagian liturgi)
    const liturgyOverview = computeTextMatchScore(
      [
        { text: data.liturgy.temaPelayanan, weight: 75 },
        { text: data.liturgy.ayatReferensi, weight: 70 },
        { text: data.liturgy.ayatMingguIni, weight: 60 },
        { text: data.liturgy.pelayanFirman, weight: 50 },
      ],
      normalizedQuery,
      tokens
    );
    if (liturgyOverview.matched) {
      items.push({
        id: 'liturgy-overview',
        domain: 'tata-ibadah',
        domainLabel: 'Tata Ibadah',
        metaText: `${data.liturgy.mingguTanggal} · ${data.liturgy.pelayanFirman}`,
        title: data.liturgy.temaPelayanan,
        snippet: `${data.liturgy.ayatReferensi}: "${shortenSnippet(data.liturgy.ayatMingguIni, 115)}"`,
        score: liturgyOverview.score,
        onSelect: () => navigate('tata-ibadah'),
      });
    }

    for (const step of data.liturgy.steps) {
      const stepMatch = computeTextMatchScore(
        [
          { text: step.bagian, weight: 78 },
          { text: step.nyanyianJudul || '', weight: 68 },
          { text: step.nyanyianKode || '', weight: 65 },
          { text: step.petugas, weight: 45 },
          { text: step.isi, weight: 55 },
          { text: step.nyanyianLirik || '', weight: 50 },
        ],
        normalizedQuery,
        tokens
      );
      if (stepMatch.matched) {
        const snippetCandidate =
          step.nyanyianLirik &&
          normalizeHymnText(step.nyanyianLirik).includes(tokens[0] || '')
            ? step.nyanyianLirik
            : step.isi;
        items.push({
          id: `lit-${step.id}`,
          domain: 'tata-ibadah',
          domainLabel: 'Tata Ibadah',
          metaText: `Urutan ${String(step.urutan).padStart(2, '0')} · ${step.petugas}${
            step.nyanyianKode ? ` · ${step.nyanyianKode}` : ''
          }`,
          title: step.nyanyianJudul
            ? `${step.bagian} (${step.nyanyianKode || ''} ${step.nyanyianJudul})`.trim()
            : step.bagian,
          snippet: shortenSnippet(snippetCandidate),
          score: stepMatch.score,
          onSelect: () => openLiturgyStep(step.id),
        });
      }
    }

    // 4. Jadwal Ibadah & Rayon
    for (const sch of data.schedules) {
      const schMatch = computeTextMatchScore(
        [
          { text: sch.judul, weight: 72 },
          {
            text: sch.kategori === 'Rayon' ? `Rayon ${sch.rayon}` : sch.unsur || sch.kategori,
            weight: 60,
          },
          { text: sch.tempat, weight: 55 },
          { text: sch.hariTanggal, weight: 45 },
          { text: sch.pemimpin, weight: 45 },
        ],
        normalizedQuery,
        tokens
      );
      if (schMatch.matched) {
        items.push({
          id: `sch-${sch.id}`,
          domain: 'jadwal',
          domainLabel: 'Jadwal Ibadah',
          metaText: `${
            sch.kategori === 'Rayon' ? `Rayon ${sch.rayon}` : sch.unsur || sch.kategori
          } · ${sch.hariTanggal} · ${sch.waktu}`,
          title: sch.judul,
          snippet: `${sch.tempat} (${sch.alamat}) · Pemimpin: ${sch.pemimpin}`,
          score: schMatch.score,
          onSelect: () => navigate('jadwal'),
        });
      }
    }

    return items.sort((a, b) => b.score - a.score);
  }, [data, query, navigate, openHymn, openLiturgyStep]);

  const counts = useMemo<Record<SearchDomainFilter, number>>(() => {
    const map: Record<SearchDomainFilter, number> = {
      semua: allResults.length,
      warta: 0,
      nyanyian: 0,
      'tata-ibadah': 0,
      jadwal: 0,
    };
    for (const r of allResults) {
      map[r.domain] += 1;
    }
    return map;
  }, [allResults]);

  const filteredResults = useMemo(() => {
    if (filter === 'semua') return allResults;
    return allResults.filter((r) => r.domain === filter);
  }, [allResults, filter]);

  const hasQuery = query.trim().length > 0;

  const getDomainIcon = (domain: PortalSearchResult['domain']) => {
    switch (domain) {
      case 'warta':
        return Newspaper;
      case 'nyanyian':
        return Music;
      case 'tata-ibadah':
        return BookOpen;
      case 'jadwal':
        return CalendarDays;
    }
  };

  return (
    <section
      aria-label="Pencarian Cepat Portal Jemaat"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs space-y-3"
    >
      <div className="relative">
        <Search className="h-4 w-4 text-[#9A3412] dark:text-[#E5C158] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) setFilter('semua');
          }}
          placeholder="Cari di portal jemaat..."
          aria-label="Cari di seluruh portal GKI Efata Malanu"
          className="w-full min-h-[44px] rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-[#FAF2E8]/70 dark:bg-[#1E1008] pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#1E1008] transition-colors"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilter('semua');
              inputRef.current?.focus();
            }}
            aria-label="Hapus kata kunci pencarian"
            className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtered Search Results */}
      {hasQuery && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Interactive Category Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Filter hasil pencarian portal"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
            >
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.id;
                const count = counts[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(tab.id)}
                    className={`min-h-[34px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                        : 'bg-[#FAF2E8] dark:bg-[#1E1008] text-slate-600 dark:text-slate-300 hover:text-[#9A3412] dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="font-mono-nums opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums shrink-0">
              {filteredResults.length} hasil ditemukan
            </p>
          </div>

          {/* Results List */}
          {filteredResults.length === 0 ? (
            <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-5 text-center space-y-2.5">
              <p className="text-sm font-semibold text-[#9A3412] dark:text-white">
                Tidak ada hasil untuk “{query}”
                {filter !== 'semua' ? ` pada kategori ini` : ''}.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Coba gunakan kata kunci lebih singkat (misal nama rayon, judul lagu, nomor KJ/NR, atau bagian liturgi).
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {filter !== 'semua' && (
                  <button
                    type="button"
                    onClick={() => setFilter('semua')}
                    className="min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3.5 py-1.5 text-xs font-semibold text-[#9A3412] dark:text-[#E5C158]"
                  >
                    Tampilkan Semua Kategori
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setFilter('semua');
                  }}
                  className="min-h-[36px] rounded-lg bg-[#9A3412] dark:bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-white dark:text-[#431407]"
                >
                  Reset Pencarian
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
              {filteredResults.map((item) => {
                const Icon = getDomainIcon(item.domain);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onSelect}
                    className="w-full text-left py-3 px-2.5 -mx-2.5 rounded-xl hover:bg-[#FAF2E8] dark:hover:bg-[#1E1008] transition-colors flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-[#C2410C]/10 dark:bg-[#3F2111] text-[#9A3412] dark:text-[#E5C158] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-[#9A3412] dark:text-[#E5C158]">
                            {item.domainLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.metaText}</span>
                        </div>
                        <p className="text-sm font-bold text-[#9A3412] dark:text-white leading-snug">
                          <HighlightedText text={item.title} query={query} />
                        </p>
                        {item.snippet && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            <HighlightedText text={item.snippet} query={query} />
                          </p>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#9A3412] dark:group-hover:text-[#D4AF37] shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
