import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { formatWitDateIndonesian } from '../utils/dailyWorshipReminder';

interface DailyReminderCardProps {
  variant?: 'banner' | 'panel';
}

const PRESET_REMINDER_TIMES = ['05:30', '06:00', '07:00', '08:00'];

export const DailyReminderCard: React.FC<DailyReminderCardProps> = ({
  variant = 'banner',
}) => {
  const {
    dailyReminderSettings,
    browserNotificationPermission,
    todaySchedules,
    toggleDailyReminder,
    updateDailyReminderTime,
    requestSystemNotificationAccess,
    sendTestDailyReminder,
    navigate,
  } = useChurch();

  const [testing, setTesting] = useState(false);
  const todayLabel = formatWitDateIndonesian();
  const upcomingCount = todaySchedules.filter((s) => !s.hasPassed).length;

  const handleTest = async () => {
    setTesting(true);
    try {
      await sendTestDailyReminder();
    } finally {
      setTesting(false);
    }
  };

  return (
    <section
      aria-labelledby="daily-reminder-heading"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              dailyReminderSettings.enabled
                ? 'bg-[#C2410C]/12 dark:bg-[#D4AF37]/15 text-[#9A3412] dark:text-[#D4AF37]'
                : 'bg-slate-100 dark:bg-[#1E1008] text-slate-500 dark:text-slate-400'
            }`}
          >
            {dailyReminderSettings.enabled ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="daily-reminder-heading"
                className="font-display text-lg font-bold text-[#9A3412] dark:text-white"
              >
                Pengingat Harian Jadwal Ibadah
              </h2>
              <span className="text-xs font-semibold text-[#9A7B16] dark:text-[#E5C158]">
                · {todayLabel}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {todaySchedules.length > 0
                ? `${todaySchedules.length} jadwal ibadah tercatat hari ini${
                    upcomingCount > 0 ? ` (${upcomingCount} akan datang)` : ''
                  }. Pengingat lokal berbunyi otomatis saat aplikasi dibuka sesuai jam pilihan Anda.`
                : 'Belum ada jadwal ibadah khusus hari ini. Aktifkan pengingat agar aplikasi memberi tahu saat ada ibadah pada hari tersebut.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleDailyReminder()}
          aria-pressed={dailyReminderSettings.enabled}
          className={`min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            dailyReminderSettings.enabled
              ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
              : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] text-slate-700 dark:text-slate-200 hover:border-[#9A3412] dark:hover:border-[#D4AF37]'
          }`}
        >
          {dailyReminderSettings.enabled ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Pengingat Aktif</span>
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 shrink-0" />
              <span>Aktifkan Pengingat</span>
            </>
          )}
        </button>
      </div>

      {/* Today's worship schedules summary */}
      {todaySchedules.length > 0 && (
        <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#9A3412] dark:text-[#E5C158]">
              Jadwal Ibadah Hari Ini (WIT)
            </span>
            {variant === 'panel' && (
              <button
                type="button"
                onClick={() => navigate('jadwal')}
                className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
              >
                Buka Halaman Jadwal →
              </button>
            )}
          </div>
          <ul className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {todaySchedules.map(({ item, hasPassed }) => (
              <li
                key={item.id}
                className="py-2 first:pt-0.5 last:pb-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
              >
                <div className="min-w-0">
                  <p
                    className={`font-semibold ${
                      hasPassed
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.judul}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.tempat}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono-nums font-semibold text-[#9A3412] dark:text-[#D4AF37]">
                    {item.waktu}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    · {hasPassed ? 'Selesai' : 'Akan datang'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reminder time & notification controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Jam Pengingat Harian (WIT):</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_REMINDER_TIMES.map((timeOpt) => {
              const active = dailyReminderSettings.reminderTime === timeOpt;
              return (
                <button
                  key={timeOpt}
                  type="button"
                  onClick={() => updateDailyReminderTime(timeOpt)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg font-mono-nums text-xs font-semibold border transition-colors whitespace-nowrap ${
                    active
                      ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#9A3412] dark:hover:border-[#D4AF37]'
                  }`}
                >
                  {timeOpt}
                </button>
              );
            })}
            <label className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="sr-only">Pilih jam pengingat khusus</span>
              <input
                type="time"
                value={dailyReminderSettings.reminderTime}
                onChange={(e) => {
                  if (e.target.value) updateDailyReminderTime(e.target.value);
                }}
                className="min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-2 py-1 font-mono-nums text-xs font-semibold text-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {browserNotificationPermission === 'default' && (
            <button
              type="button"
              onClick={() => requestSystemNotificationAccess()}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#9A3412]/40 dark:border-[#D4AF37]/50 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 py-1.5 text-xs font-semibold text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Izinkan Notifikasi Browser</span>
            </button>
          )}

          <button
            type="button"
            disabled={testing}
            onClick={handleTest}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#9A3412] dark:hover:border-[#D4AF37] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <BellRing className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>{testing ? 'Mengirim...' : 'Uji Pengingat Sekarang'}</span>
          </button>
        </div>
      </div>

      {browserNotificationPermission === 'denied' && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Izin notifikasi sistem browser saat ini diblokir. Anda tetap menerima pengingat ibadah harian langsung melalui banner notifikasi di dalam aplikasi saat portal dibuka.
        </p>
      )}
    </section>
  );
};

export const ReminderBellButton: React.FC = () => {
  const {
    dailyReminderSettings,
    todaySchedules,
    toggleDailyReminder,
    sendTestDailyReminder,
    navigate,
  } = useChurch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const upcomingCount = todaySchedules.filter((s) => !s.hasPassed).length;
  const badgeCount = upcomingCount > 0 ? upcomingCount : todaySchedules.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Pengingat jadwal ibadah hari ini"
        title="Pengingat Jadwal Ibadah Hari Ini"
        className="relative min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#361D10] text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors"
      >
        {dailyReminderSettings.enabled ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4 text-slate-400" />
        )}
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#9A3412] dark:bg-[#D4AF37] text-[10px] font-bold font-mono-nums text-white dark:text-[#431407] flex items-center justify-center leading-none">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Ringkasan pengingat ibadah harian"
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] p-4 shadow-xl z-50 space-y-3"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-[#9A3412] dark:text-white">
                Pengingat Ibadah Hari Ini
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatWitDateIndonesian()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleDailyReminder()}
              className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                dailyReminderSettings.enabled
                  ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {dailyReminderSettings.enabled ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          {todaySchedules.length === 0 ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tidak ada jadwal ibadah tercatat pada hari ini. Cek agenda pelayanan berikutnya di menu Jadwal.
            </p>
          ) : (
            <ul className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
              {todaySchedules.map(({ item, hasPassed }) => (
                <li
                  key={item.id}
                  className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-2.5 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-nums font-bold text-[#9A3412] dark:text-[#D4AF37]">
                      {item.waktu}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {hasPassed ? 'Selesai' : 'Akan datang'}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                    {item.judul}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.tempat}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await sendTestDailyReminder();
              }}
              className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#9A3412] dark:hover:border-[#D4AF37] whitespace-nowrap"
            >
              <BellRing className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Uji Pengingat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('jadwal');
              }}
              className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
            >
              Atur & Lihat Jadwal →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
