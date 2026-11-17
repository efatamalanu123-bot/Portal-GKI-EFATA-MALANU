export const STORAGE_DAILY_PRAYER_COUNTER_KEY = 'gki_efata_daily_prayer_counter_v1';
export const PRAYER_COUNT_UPDATED_EVENT = 'gki-efata-prayer-count-updated';

interface DailyPrayerCounterRecord {
  date: string;
  count: number;
}

export function getTodayWITDateKey(): string {
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

export function getTodayPrayerCount(): number {
  const todayKey = getTodayWITDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_DAILY_PRAYER_COUNTER_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Partial<DailyPrayerCounterRecord>;
    if (parsed.date === todayKey && typeof parsed.count === 'number' && parsed.count >= 0) {
      return parsed.count;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function incrementTodayPrayerCount(): number {
  const todayKey = getTodayWITDateKey();
  const nextCount = getTodayPrayerCount() + 1;
  try {
    const payload: DailyPrayerCounterRecord = {
      date: todayKey,
      count: nextCount,
    };
    localStorage.setItem(STORAGE_DAILY_PRAYER_COUNTER_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(PRAYER_COUNT_UPDATED_EVENT, { detail: { count: nextCount } })
    );
  }
  return nextCount;
}
