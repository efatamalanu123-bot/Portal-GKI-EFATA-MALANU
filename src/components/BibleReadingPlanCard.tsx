import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronDown, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

export interface BibleReadingPlanDay {
  day: number;
  tanggalLabel: string;
  bacaan1: { bookId: string; bookName: string; chapter: number; display: string };
  bacaan2: { bookId: string; bookName: string; chapter: number; display: string };
  temaPerenungan: string;
}

export const ANNUAL_BIBLE_READING_PLAN: BibleReadingPlanDay[] = [
  {
    day: 1,
    tanggalLabel: '15 November 2026',
    bacaan1: { bookId: 'kej', bookName: 'Kejadian', chapter: 1, display: 'Kejadian 1' },
    bacaan2: { bookId: 'mat', bookName: 'Matius', chapter: 1, display: 'Matius 1' },
    temaPerenungan: 'Penciptaan Allah & Silsilah Yesus Kristus Sang Mesias',
  },
  {
    day: 2,
    tanggalLabel: '16 November 2026',
    bacaan1: { bookId: 'kej', bookName: 'Kejadian', chapter: 2, display: 'Kejadian 2' },
    bacaan2: { bookId: 'mat', bookName: 'Matius', chapter: 2, display: 'Matius 2' },
    temaPerenungan: 'Taman Eden, Pernikahan Pertama & Orang Majus dari Timur',
  },
  {
    day: 3,
    tanggalLabel: '17 November 2026',
    bacaan1: { bookId: 'kej', bookName: 'Kejadian', chapter: 3, display: 'Kejadian 3' },
    bacaan2: { bookId: 'mat', bookName: 'Matius', chapter: 3, display: 'Matius 3' },
    temaPerenungan: 'Jatuhnya Manusia dalam Dosa & Baptisan Yesus oleh Yohanes Pembaptis',
  },
  {
    day: 4,
    tanggalLabel: '18 November 2026',
    bacaan1: { bookId: 'kej', bookName: 'Kejadian', chapter: 4, display: 'Kejadian 4' },
    bacaan2: { bookId: 'mat', bookName: 'Matius', chapter: 4, display: 'Matius 4' },
    temaPerenungan: 'Kain dan Habel serta Pencobaan Yesus di Padang Gurun',
  },
  {
    day: 5,
    tanggalLabel: '19 November 2026',
    bacaan1: { bookId: 'kej', bookName: 'Kejadian', chapter: 5, display: 'Kejadian 5' },
    bacaan2: { bookId: 'mat', bookName: 'Matius', chapter: 5, display: 'Matius 5' },
    temaPerenungan: 'Keturunan Adam hingga Nuh & Khotbah di Bukit (Bahagia)',
  },
  {
    day: 6,
    tanggalLabel: '20 November 2026',
    bacaan1: { bookId: 'maz', bookName: 'Mazmur', chapter: 1, display: 'Mazmur 1' },
    bacaan2: { bookId: 'yoh', bookName: 'Yohanes', chapter: 1, display: 'Yohanes 1' },
    temaPerenungan: 'Jalan Orang Benar & Firman yang Telah Menjadi Manusia',
  },
  {
    day: 7,
    tanggalLabel: '21 November 2026',
    bacaan1: { bookId: 'maz', bookName: 'Mazmur', chapter: 23, display: 'Mazmur 23' },
    bacaan2: { bookId: 'yoh', bookName: 'Yohanes', chapter: 3, display: 'Yohanes 3' },
    temaPerenungan: 'Tuhan Adalah Gembalaku & Lahir Baru oleh Air dan Roh',
  },
];

export const STORAGE_READING_PLAN_KEY = 'gki_efata_bible_reading_progress_v1';

export function loadStoredReadingProgress(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_READING_PLAN_KEY);
    if (!raw) return [1]; // Day 1 completed by default for demo
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [1];
  } catch {
    return [1];
  }
}

export function saveStoredReadingProgress(completedDays: number[]): void {
  try {
    localStorage.setItem(STORAGE_READING_PLAN_KEY, JSON.stringify(completedDays));
  } catch {
    // Ignore storage errors
  }
}

export const BibleReadingPlanCard: React.FC = () => {
  const { openBiblePassage, showToast } = useChurch();
  const [completedDays, setCompletedDays] = useState<number[]>(loadStoredReadingProgress);
  const [selectedDayNum, setSelectedDayNum] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    saveStoredReadingProgress(completedDays);
  }, [completedDays]);

  const activeDayPlan =
    ANNUAL_BIBLE_READING_PLAN.find((d) => d.day === selectedDayNum) ||
    ANNUAL_BIBLE_READING_PLAN[0];

  const isCompleted = (dayNum: number) => completedDays.includes(dayNum);

  const toggleDayCompleted = (dayNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let next: number[];
    if (completedDays.includes(dayNum)) {
      next = completedDays.filter((d) => d !== dayNum);
      showToast(`Hari ke-${dayNum} ditandai belum selesai.`, {
        title: 'Progres Diperbarui',
        variant: 'info',
      });
    } else {
      next = [...completedDays, dayNum];
      showToast(`Puji Tuhan! Pembacaan Alkitab Hari ke-${dayNum} telah diselesaikan.`, {
        title: 'Pembacaan Selesai',
        variant: 'success',
      });
    }
    setCompletedDays(next);
  };

  const progressPercent = Math.round(
    (completedDays.length / ANNUAL_BIBLE_READING_PLAN.length) * 100
  );

  return (
    <section
      aria-labelledby="rencana-bacaan-heading"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-xl group"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#C2410C]/12 dark:bg-[#D4AF37]/15 text-[#9A3412] dark:text-[#D4AF37] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="rencana-bacaan-heading"
              className="font-display text-lg sm:text-xl font-bold text-[#9A3412] dark:text-white group-hover:text-[#C2410C] dark:group-hover:text-[#E5C158] transition-colors"
            >
              Rencana Bacaan Alkitab Harian
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Panduan pembacaan Alkitab setahun GKI Efata Malanu (Minggu Ini)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <p className="text-xs font-bold text-[#9A3412] dark:text-[#E5C158] font-mono-nums">
              {completedDays.length} / {ANNUAL_BIBLE_READING_PLAN.length} Hari ({progressPercent}%)
            </p>
            <div className="w-28 h-2 rounded-full bg-slate-100 dark:bg-[#1E1008] mt-1 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-[#9A3412] dark:bg-[#D4AF37] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#9A3412] group-hover:text-white dark:group-hover:bg-[#D4AF37] dark:group-hover:text-[#431407] transition-colors">
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Selected Day Active View */}
          <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407] text-xs font-bold font-mono-nums">
              Hari ke-{activeDayPlan.day}
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {activeDayPlan.tanggalLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => toggleDayCompleted(activeDayPlan.day, e)}
            className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              isCompleted(activeDayPlan.day)
                ? 'bg-emerald-700 text-white dark:bg-emerald-800'
                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] text-slate-700 dark:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{isCompleted(activeDayPlan.day) ? 'Selesai Dibaca ✓' : 'Tandai Selesai'}</span>
          </button>
        </div>

        <p className="text-xs italic text-slate-600 dark:text-slate-300">
          ✨ <strong>Tema Renungan:</strong> {activeDayPlan.temaPerenungan}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() =>
              openBiblePassage(activeDayPlan.bacaan1.bookId, activeDayPlan.bacaan1.chapter)
            }
            className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-700 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-all text-left"
          >
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Bacaan Bagian 1</p>
              <p className="text-sm font-bold text-[#9A3412] dark:text-white group-hover:underline">
                {activeDayPlan.bacaan1.display}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() =>
              openBiblePassage(activeDayPlan.bacaan2.bookId, activeDayPlan.bacaan2.chapter)
            }
            className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-700 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-all text-left"
          >
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Bacaan Bagian 2</p>
              <p className="text-sm font-bold text-[#9A3412] dark:text-white group-hover:underline">
                {activeDayPlan.bacaan2.display}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Days Selector Pills */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Pilih Hari Pembacaan:
        </span>
        <div className="flex flex-wrap gap-2">
          {ANNUAL_BIBLE_READING_PLAN.map((item) => {
            const active = item.day === selectedDayNum;
            const done = isCompleted(item.day);
            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDayNum(item.day)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                  active
                    ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407] shadow-xs'
                    : done
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1008] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span>Hari {item.day}</span>
                {done && <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
        </div>
      )}
    </section>
  );
};
