import { ScheduleItem } from '../types/church';
import {
  getCurrentWitYmd,
  parseExplicitIndonesianDateParts,
  parseTimeRange,
} from './calendarExport';

export const STORAGE_DAILY_REMINDER_KEY = 'gki_efata_daily_reminder_v1';

export type BrowserNotificationState = NotificationPermission | 'unsupported';

export interface DailyReminderSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM WIT
  lastNotifiedDateKey: string | null; // YYYY-MM-DD in WIT
}

export interface TodayScheduleItem {
  item: ScheduleItem;
  startMinutes: number;
  hasPassed: boolean;
}

export const DEFAULT_DAILY_REMINDER_SETTINGS: DailyReminderSettings = {
  enabled: true,
  reminderTime: '06:00',
  lastNotifiedDateKey: null,
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getWitDateKey(now = new Date()): string {
  const { year, month, day } = getCurrentWitYmd(now);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getWitCurrentMinutes(now = new Date()): number {
  const { hour, minute } = getCurrentWitYmd(now);
  return hour * 60 + minute;
}

export function formatWitDateIndonesian(now = new Date()): string {
  const { year, month, day, weekday } = getCurrentWitYmd(now);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${days[weekday]}, ${day} ${months[month - 1]} ${year}`;
}

export function parseReminderMinutes(hhmm: string): number {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 6 * 60;
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return h * 60 + m;
}

export function loadDailyReminderSettings(): DailyReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_DAILY_REMINDER_KEY);
    if (!raw) return DEFAULT_DAILY_REMINDER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DailyReminderSettings>;
    const reminderTime =
      typeof parsed.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.reminderTime)
        ? parsed.reminderTime
        : DEFAULT_DAILY_REMINDER_SETTINGS.reminderTime;
    return {
      enabled:
        typeof parsed.enabled === 'boolean'
          ? parsed.enabled
          : DEFAULT_DAILY_REMINDER_SETTINGS.enabled,
      reminderTime,
      lastNotifiedDateKey:
        typeof parsed.lastNotifiedDateKey === 'string' ? parsed.lastNotifiedDateKey : null,
    };
  } catch {
    return DEFAULT_DAILY_REMINDER_SETTINGS;
  }
}

export function saveDailyReminderSettings(settings: DailyReminderSettings): void {
  try {
    localStorage.setItem(STORAGE_DAILY_REMINDER_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage access errors
  }
}

export function getTodaySchedules(
  schedules: ScheduleItem[],
  now = new Date()
): TodayScheduleItem[] {
  const witToday = getCurrentWitYmd(now);
  const nowMinutes = witToday.hour * 60 + witToday.minute;

  const matched: TodayScheduleItem[] = [];
  for (const item of schedules) {
    const parsed = parseExplicitIndonesianDateParts(item.hariTanggal, now);
    if (!parsed) continue;
    if (
      parsed.year === witToday.year &&
      parsed.month === witToday.month &&
      parsed.day === witToday.day
    ) {
      const { startHour, startMinute } = parseTimeRange(item.waktu);
      const startMinutes = startHour * 60 + startMinute;
      matched.push({
        item,
        startMinutes,
        hasPassed: startMinutes + 90 < nowMinutes,
      });
    }
  }

  return matched.sort((a, b) => a.startMinutes - b.startMinutes);
}

export function buildDailyWorshipReminderPayload(
  todaySchedules: TodayScheduleItem[],
  now = new Date()
): {
  title: string;
  body: string;
  count: number;
  dateLabel: string;
} {
  const dateLabel = formatWitDateIndonesian(now);
  const upcoming = todaySchedules.filter((s) => !s.hasPassed);
  const activeList = upcoming.length > 0 ? upcoming : todaySchedules;

  if (activeList.length === 0) {
    return {
      title: `Jadwal Ibadah · ${dateLabel}`,
      body: 'Belum ada jadwal ibadah khusus yang tercatat untuk hari ini. Lihat agenda pelayanan minggu ini di menu Jadwal.',
      count: 0,
      dateLabel,
    };
  }

  if (activeList.length === 1) {
    const first = activeList[0].item;
    return {
      title: `Pengingat Ibadah Hari Ini (${first.waktu})`,
      body: `${first.judul} di ${first.tempat}. Pelayan: ${first.pemimpin}.`,
      count: 1,
      dateLabel,
    };
  }

  const summaryItems = activeList
    .slice(0, 3)
    .map((entry) => `${entry.item.waktu} · ${entry.item.judul}`)
    .join('; ');
  const moreSuffix = activeList.length > 3 ? ` (+${activeList.length - 3} lainnya)` : '';

  return {
    title: `${activeList.length} Jadwal Ibadah Hari Ini — GKI Efata Malanu`,
    body: `${summaryItems}${moreSuffix}`,
    count: activeList.length,
    dateLabel,
  };
}

export function getBrowserNotificationPermission(): BrowserNotificationState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationState> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

export async function dispatchLocalSystemNotification(payload: {
  title: string;
  body: string;
  tag: string;
}): Promise<'service-worker' | 'browser' | 'in-app'> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'in-app';
  }
  if (Notification.permission !== 'granted') {
    return 'in-app';
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1200)),
      ]);
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: payload.tag,
        });
        return 'service-worker';
      }
    }
  } catch {
    // Fall back to direct Notification constructor
  }

  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      tag: payload.tag,
    });
    return 'browser';
  } catch {
    return 'in-app';
  }
}
