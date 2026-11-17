import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { ScheduleItem } from '../types/church';
import { parseExplicitIndonesianDateParts, getCurrentWitYmd } from '../utils/calendarExport';

interface MonthlyCalendarViewProps {
  schedules: ScheduleItem[];
  onSelectSchedule?: (item: ScheduleItem) => void;
}

const MONTH_NAMES = [
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

const WEEKDAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  schedules,
  onSelectSchedule,
}) => {
  const witNow = getCurrentWitYmd();
  const [currentYear, setCurrentYear] = useState(witNow.year);
  const [currentMonth, setCurrentMonth] = useState(witNow.month); // 1-12
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<{
    dateKey: string;
    dayNum: number;
    items: ScheduleItem[];
  } | null>(null);

  // Map schedules to YYYY-MM-DD keys in WIT
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const item of schedules) {
      const parsed = parseExplicitIndonesianDateParts(item.hariTanggal);
      if (!parsed) continue;
      const y = parsed.year;
      const m = String(parsed.month).padStart(2, '0');
      const d = String(parsed.day).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [schedules]);

  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay(); // 0 = Sunday
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();

    const cells: Array<{
      dayNum: number | null;
      dateKey?: string;
      items: ScheduleItem[];
    }> = [];

    // Padding for previous month overflow
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNum: null, items: [] });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const yStr = String(currentYear);
      const mStr = String(currentMonth).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateKey = `${yStr}-${mStr}-${dStr}`;
      const items = scheduleMap.get(dateKey) || [];
      cells.push({ dayNum: day, dateKey, items });
    }

    return cells;
  }, [currentYear, currentMonth, scheduleMap]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDaySchedules(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDaySchedules(null);
  };

  return (
    <section
      aria-labelledby="monthly-calendar-heading"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="h-5 w-5 text-[#D4AF37]" />
          <h2
            id="monthly-calendar-heading"
            className="font-display text-lg sm:text-xl font-bold text-[#9A3412] dark:text-white"
          >
            Kalender Jadwal Ibadah Bulanan
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono-nums text-slate-900 dark:text-white min-w-[130px] text-center">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="min-h-[36px] min-w-[36px] rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="min-h-[36px] min-w-[36px] rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-1">
        {WEEKDAY_NAMES.map((w, idx) => (
          <div key={w} className={idx === 0 ? 'text-[#9A3412] dark:text-[#E5C158]' : ''}>
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarGrid.map((cell, idx) => {
          if (cell.dayNum === null) {
            return <div key={`empty-${idx}`} className="aspect-square rounded-xl bg-transparent" />;
          }

          const hasSchedules = cell.items.length > 0;
          const isToday =
            currentYear === witNow.year &&
            currentMonth === witNow.month &&
            cell.dayNum === witNow.day;
          const isSelected = selectedDaySchedules?.dateKey === cell.dateKey;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => {
                if (hasSchedules && cell.dateKey && cell.dayNum !== null) {
                  setSelectedDaySchedules({
                    dateKey: cell.dateKey,
                    dayNum: cell.dayNum,
                    items: cell.items,
                  });
                } else {
                  setSelectedDaySchedules(null);
                }
              }}
              className={`aspect-square rounded-xl p-1.5 flex flex-col items-center justify-between border transition-all relative ${
                isSelected
                  ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407] shadow-sm'
                  : isToday
                  ? 'border-[#D4AF37] bg-[#FAF2E8] dark:bg-[#1E1008] text-slate-900 dark:text-white font-bold'
                  : hasSchedules
                  ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] text-slate-900 dark:text-white hover:border-[#9A3412]'
                  : 'border-transparent bg-slate-50/60 dark:bg-[#1A0E08]/40 text-slate-400 dark:text-slate-500'
              }`}
            >
              <span className={`font-mono-nums text-xs ${isToday ? 'underline font-bold' : ''}`}>
                {cell.dayNum}
              </span>

              {/* Schedule Indicator Dots / Count */}
              {hasSchedules ? (
                <div className="flex flex-col items-center gap-0.5 pb-0.5">
                  <div className="flex items-center gap-1">
                    {cell.items.slice(0, 2).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white dark:bg-[#431407]'
                            : 'bg-[#9A3412] dark:bg-[#D4AF37]'
                        }`}
                      />
                    ))}
                    {cell.items.length > 2 && (
                      <span
                        className={`text-[9px] font-bold font-mono-nums ${
                          isSelected ? 'text-white dark:text-[#431407]' : 'text-[#9A3412] dark:text-[#D4AF37]'
                        }`}
                      >
                        +{cell.items.length - 2}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block text-[9px] truncate max-w-[42px] opacity-85">
                    {cell.items[0]?.judul.split(' ')[0]}
                  </span>
                </div>
              ) : (
                <span className="h-1.5 w-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Popup Drawer */}
      {selectedDaySchedules && (
        <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200 dark:border-slate-700 p-4 space-y-3 mt-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
            <p className="text-xs font-bold text-[#9A3412] dark:text-[#E5C158]">
              Jadwal Tanggal {selectedDaySchedules.dayNum} {MONTH_NAMES[currentMonth - 1]} {currentYear} ({selectedDaySchedules.items.length} ibadah)
            </p>
            <button
              type="button"
              onClick={() => setSelectedDaySchedules(null)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Tutup ✕
            </button>
          </div>

          <div className="space-y-2">
            {selectedDaySchedules.items.map((sch) => (
              <div
                key={sch.id}
                onClick={() => onSelectSchedule?.(sch)}
                className="rounded-lg bg-white dark:bg-[#2B170C] p-3 border border-slate-200 dark:border-slate-700 hover:border-[#9A3412] cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs text-[#9A7B16] dark:text-[#D4AF37] font-semibold">
                  <span>
                    {sch.kategori === 'Rayon' ? `Rayon ${sch.rayon}` : sch.unsur || sch.kategori}
                  </span>
                  <span className="font-mono-nums inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {sch.waktu}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#9A3412] dark:text-white">{sch.judul}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{sch.tempat}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
