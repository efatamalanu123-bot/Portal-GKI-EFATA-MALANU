import { ScheduleItem } from '../types/church';

const WIT_OFFSET_MS = 9 * 60 * 60 * 1000; // Asia/Jayapura (UTC+9, no DST)
const DEFAULT_DURATION_MINUTES = 90;

const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  feb: 2,
  pebruari: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agu: 8,
  agt: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  desember: 12,
  des: 12,
  dec: 12,
};

const INDONESIAN_WEEKDAYS: Record<string, number> = {
  minggu: 0,
  ahad: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
};

export interface ParsedScheduleWindow {
  startUtc: Date;
  endUtc: Date;
  startUtcStamp: string;
  endUtcStamp: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatUtcIcsStamp(date: Date): string {
  return (
    date.getUTCFullYear() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    'T' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    'Z'
  );
}

export function getCurrentWitYmd(
  now = new Date()
): { year: number; month: number; day: number; weekday: number; hour: number; minute: number } {
  const witNow = new Date(now.getTime() + WIT_OFFSET_MS);
  return {
    year: witNow.getUTCFullYear(),
    month: witNow.getUTCMonth() + 1,
    day: witNow.getUTCDate(),
    weekday: witNow.getUTCDay(),
    hour: witNow.getUTCHours(),
    minute: witNow.getUTCMinutes(),
  };
}

export function parseExplicitIndonesianDateParts(
  hariTanggal: string,
  now = new Date()
): { year: number; month: number; day: number; isRecurringWeekday?: boolean } | null {
  const cleaned = hariTanggal.trim().toLowerCase();
  if (!cleaned) return null;

  // 1. ISO YYYY-MM-DD
  const isoMatch = cleaned.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // 2. Numeric DD/MM/YYYY or DD-MM-YYYY
  const dmyNumeric = cleaned.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (dmyNumeric) {
    const day = Number(dmyNumeric[1]);
    const month = Number(dmyNumeric[2]);
    const year = Number(dmyNumeric[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // 3. Indonesian textual date: e.g. "Minggu, 15 November 2026" or "15 Nov"
  const textMatch = cleaned.match(/\b(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?\b/);
  if (textMatch) {
    const day = Number(textMatch[1]);
    const monthName = textMatch[2];
    const month = INDONESIAN_MONTHS[monthName];
    if (month && day >= 1 && day <= 31) {
      const currentWit = getCurrentWitYmd(now);
      const year = textMatch[3] ? Number(textMatch[3]) : currentWit.year;
      return { year, month, day };
    }
  }

  // 4. Fallback: match weekday name in string -> next occurrence in WIT
  const currentWit = getCurrentWitYmd(now);
  for (const [label, targetDow] of Object.entries(INDONESIAN_WEEKDAYS)) {
    if (cleaned.includes(label)) {
      const deltaDays = (targetDow - currentWit.weekday + 7) % 7;
      const target = new Date(
        Date.UTC(currentWit.year, currentWit.month - 1, currentWit.day + deltaDays)
      );
      return {
        year: target.getUTCFullYear(),
        month: target.getUTCMonth() + 1,
        day: target.getUTCDate(),
        isRecurringWeekday: true,
      };
    }
  }

  return null;
}

function parseIndonesianDateParts(
  hariTanggal: string,
  now = new Date()
): { year: number; month: number; day: number } {
  const explicit = parseExplicitIndonesianDateParts(hariTanggal, now);
  if (explicit) {
    return { year: explicit.year, month: explicit.month, day: explicit.day };
  }

  const currentWit = getCurrentWitYmd(now);
  return {
    year: currentWit.year,
    month: currentWit.month,
    day: currentWit.day,
  };
}

export function parseTimeRange(waktu: string): {
  startHour: number;
  startMinute: number;
  endHour?: number;
  endMinute?: number;
} {
  const matches = Array.from(waktu.matchAll(/(\d{1,2})[:.](\d{2})/g));
  if (matches.length === 0) {
    return { startHour: 9, startMinute: 0 };
  }

  const clampHour = (h: number) => Math.min(23, Math.max(0, h));
  const clampMinute = (m: number) => Math.min(59, Math.max(0, m));

  const startHour = clampHour(Number(matches[0][1]));
  const startMinute = clampMinute(Number(matches[0][2]));

  if (matches.length >= 2) {
    const endHour = clampHour(Number(matches[1][1]));
    const endMinute = clampMinute(Number(matches[1][2]));
    return { startHour, startMinute, endHour, endMinute };
  }

  return { startHour, startMinute };
}

export function getScheduleTimeWindow(
  item: ScheduleItem,
  now = new Date()
): ParsedScheduleWindow {
  const { year, month, day } = parseIndonesianDateParts(item.hariTanggal, now);
  const { startHour, startMinute, endHour, endMinute } = parseTimeRange(item.waktu);

  const startUtcMs =
    Date.UTC(year, month - 1, day, startHour, startMinute, 0) - WIT_OFFSET_MS;
  const startUtc = new Date(startUtcMs);

  let endUtcMs: number;
  if (typeof endHour === 'number' && typeof endMinute === 'number') {
    const candidateEndMs =
      Date.UTC(year, month - 1, day, endHour, endMinute, 0) - WIT_OFFSET_MS;
    endUtcMs =
      candidateEndMs > startUtcMs
        ? candidateEndMs
        : candidateEndMs + 24 * 60 * 60 * 1000;
  } else {
    endUtcMs = startUtcMs + DEFAULT_DURATION_MINUTES * 60 * 1000;
  }

  const endUtc = new Date(endUtcMs);

  return {
    startUtc,
    endUtc,
    startUtcStamp: formatUtcIcsStamp(startUtc),
    endUtcStamp: formatUtcIcsStamp(endUtc),
  };
}

function getScheduleCategoryLabel(item: ScheduleItem): string {
  if (item.kategori === 'Rayon') {
    return `Ibadah Rayon ${item.rayon ?? ''}`.trim();
  }
  if (item.unsur) {
    return `Ibadah Unsur ${item.unsur}`;
  }
  return 'Ibadah Minggu Jemaat';
}

function buildEventLocation(item: ScheduleItem): string {
  return [item.tempat, item.alamat].filter(Boolean).join(', ');
}

function buildEventDetails(item: ScheduleItem): string {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    item.mapsQuery || buildEventLocation(item)
  )}`;

  const lines = [
    `GKI Efata Malanu — Klasis Sorong`,
    `Kategori: ${getScheduleCategoryLabel(item)}`,
    `Jadwal: ${item.hariTanggal} · ${item.waktu}`,
    `Pelayan / Pemimpin: ${item.pemimpin}`,
    item.catatan ? `Catatan: ${item.catatan}` : '',
    `Petunjuk Arah: ${mapsUrl}`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildGoogleCalendarUrl(item: ScheduleItem): string {
  const { startUtcStamp, endUtcStamp } = getScheduleTimeWindow(item);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${item.judul} — GKI Efata Malanu`,
    dates: `${startUtcStamp}/${endUtcStamp}`,
    ctz: 'Asia/Jayapura',
    location: buildEventLocation(item),
    details: buildEventDetails(item),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function foldIcsLine(line: string): string {
  const maxLen = 72;
  if (line.length <= maxLen) return line;
  const chunks: string[] = [];
  let offset = 0;
  chunks.push(line.slice(0, maxLen));
  offset = maxLen;
  while (offset < line.length) {
    chunks.push(' ' + line.slice(offset, offset + maxLen - 1));
    offset += maxLen - 1;
  }
  return chunks.join('\r\n');
}

export function buildScheduleIcsContent(item: ScheduleItem, now = new Date()): string {
  const { startUtcStamp, endUtcStamp } = getScheduleTimeWindow(item, now);
  const dtStamp = formatUtcIcsStamp(now);
  const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const uid = `${safeId || 'jadwal'}-${startUtcStamp}@efatamalanu.gki`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GKI Efata Malanu//Portal Jemaat//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${startUtcStamp}`,
    `DTEND:${endUtcStamp}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(`${item.judul} — GKI Efata Malanu`)}`),
    foldIcsLine(`LOCATION:${escapeIcsText(buildEventLocation(item))}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(buildEventDetails(item))}`),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    foldIcsLine(
      `DESCRIPTION:${escapeIcsText(`Pengingat Ibadah: ${item.judul} (${item.waktu})`)}`
    ),
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
}

export function buildScheduleIcsFileName(item: ScheduleItem): string {
  const slug = item.judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `ibadah-${slug || 'gki-efata-malanu'}.ics`;
}

export function downloadScheduleIcs(item: ScheduleItem): string {
  const icsContent = buildScheduleIcsContent(item);
  const fileName = buildScheduleIcsFileName(item);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1500);

  return fileName;
}
