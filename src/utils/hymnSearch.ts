import { HymnItem } from '../types/church';

export type HymnMatchSource = 'nomor' | 'judul' | 'lirik';

export interface HymnSearchResult {
  hymn: HymnItem;
  score: number;
  matchSource: HymnMatchSource | null;
  matchedVerseNumber: number | null;
  matchedSnippet: string | null;
}

/**
 * Normalizes Indonesian hymnal text so searches ignore punctuation, line breaks,
 * and apostrophes commonly used in NR/KJ/Mazmur (e.g. "kar'na", "'ku", "t'rima").
 */
export function normalizeHymnText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’‘'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLyricSnippet(stanzas: string[], normalizedQuery: string, tokens: string[]): {
  verseNumber: number;
  snippet: string;
  exactPhrase: boolean;
} | null {
  let fallbackMatch: { verseNumber: number; snippet: string } | null = null;

  for (let i = 0; i < stanzas.length; i++) {
    const stanza = stanzas[i];
    const lines = stanza
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const normalizedStanza = normalizeHymnText(stanza);

    // 1. Exact phrase match on a single line
    for (const line of lines) {
      if (normalizeHymnText(line).includes(normalizedQuery)) {
        return {
          verseNumber: i + 1,
          snippet: line,
          exactPhrase: true,
        };
      }
    }

    // 2. Exact phrase match spanning consecutive lines within the same stanza
    if (normalizedStanza.includes(normalizedQuery)) {
      const joined = lines.join(' / ');
      return {
        verseNumber: i + 1,
        snippet: joined.length > 110 ? `${joined.slice(0, 107)}...` : joined,
        exactPhrase: true,
      };
    }

    // 3. Multi-word token match within a line or stanza
    if (tokens.length > 1 && tokens.every((t) => normalizedStanza.includes(t))) {
      const bestLine =
        lines.find((line) => {
          const normLine = normalizeHymnText(line);
          return tokens.some((t) => normLine.includes(t));
        }) || lines[0] || stanza;

      if (!fallbackMatch) {
        fallbackMatch = {
          verseNumber: i + 1,
          snippet: bestLine,
        };
      }
    }
  }

  if (fallbackMatch) {
    return {
      ...fallbackMatch,
      exactPhrase: false,
    };
  }

  return null;
}

export function searchHymns(hymns: HymnItem[], rawQuery: string): HymnSearchResult[] {
  const trimmed = rawQuery.trim();
  const normalizedQuery = normalizeHymnText(trimmed);

  if (!normalizedQuery) {
    return hymns.map((hymn) => ({
      hymn,
      score: 0,
      matchSource: null,
      matchedVerseNumber: null,
      matchedSnippet: null,
    }));
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const results: HymnSearchResult[] = [];

  for (const hymn of hymns) {
    const normTitle = normalizeHymnText(hymn.judul);
    const normCategory = normalizeHymnText(hymn.kategori);
    const numStr = String(hymn.nomor);
    const codeWithNum = `${normCategory} ${numStr}`;
    const shortCodeWithNum =
      hymn.kategori === 'Suara Gembira'
        ? `sg ${numStr}`
        : hymn.kategori === 'Mazmur'
        ? `mzm ${numStr}`
        : codeWithNum;

    const fullCombined = normalizeHymnText(
      `${hymn.kategori} ${hymn.nomor} ${hymn.judul} ${hymn.bait.join(' ')}`
    );

    const exactNumberMatch =
      numStr === normalizedQuery ||
      codeWithNum === normalizedQuery ||
      shortCodeWithNum === normalizedQuery;
    const prefixNumberMatch =
      numStr.startsWith(normalizedQuery) || codeWithNum.includes(normalizedQuery);
    const titleExactPhrase = normTitle.includes(normalizedQuery);
    const titleAllTokens = tokens.every((t) => normTitle.includes(t));
    const lyricHit = extractLyricSnippet(hymn.bait, normalizedQuery, tokens);
    const crossFieldMatch = tokens.every((t) => fullCombined.includes(t));

    if (!exactNumberMatch && !prefixNumberMatch && !titleExactPhrase && !titleAllTokens && !lyricHit && !crossFieldMatch) {
      continue;
    }

    let score = 10;
    let matchSource: HymnMatchSource = 'lirik';

    if (exactNumberMatch) {
      score = 100;
      matchSource = 'nomor';
    } else if (titleExactPhrase) {
      score = 85;
      matchSource = 'judul';
    } else if (prefixNumberMatch) {
      score = 75;
      matchSource = 'nomor';
    } else if (lyricHit?.exactPhrase) {
      score = 65;
      matchSource = 'lirik';
    } else if (titleAllTokens) {
      score = 50;
      matchSource = 'judul';
    } else if (lyricHit) {
      score = 40;
      matchSource = 'lirik';
    } else {
      score = 25;
      matchSource = lyricHit ? 'lirik' : 'judul';
    }

    results.push({
      hymn,
      score,
      matchSource,
      matchedVerseNumber: lyricHit?.verseNumber ?? null,
      matchedSnippet: lyricHit?.snippet ?? null,
    });
  }

  return results.sort((a, b) => b.score - a.score || a.hymn.nomor - b.hymn.nomor);
}

/**
 * Splits text so occurrences of query tokens can be rendered inside <mark> tags,
 * including words containing Indonesian hymnal apostrophes (e.g. "kar'na", "'ku").
 */
export function splitTextBySearchTokens(
  text: string,
  rawQuery: string
): Array<{ text: string; highlight: boolean }> {
  const normalized = normalizeHymnText(rawQuery);
  if (!normalized) return [{ text, highlight: false }];

  const tokens = Array.from(
    new Set(normalized.split(' ').filter((t) => t.length >= 2 || /^\d+$/.test(t)))
  );
  if (tokens.length === 0) return [{ text, highlight: false }];

  // Allow optional apostrophes between letters so "karna" matches "kar’na" and "ku" matches "‘ku"
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patternParts = tokens
    .sort((a, b) => b.length - a.length)
    .map((token) =>
      token
        .split('')
        .map((ch) => `${escapeRegex(ch)}[’‘'\`]?`)
        .join('')
    );

  const regex = new RegExp(`(${patternParts.join('|')})`, 'gi');
  const segments: Array<{ text: string; highlight: boolean }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      segments.push({ text: text.slice(lastIndex, idx), highlight: false });
    }
    if (match[0]) {
      segments.push({ text: match[0], highlight: true });
      lastIndex = idx + match[0].length;
    }
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false });
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }];
}
