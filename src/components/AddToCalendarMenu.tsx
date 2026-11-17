import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { ScheduleItem } from '../types/church';
import { buildGoogleCalendarUrl, downloadScheduleIcs } from '../utils/calendarExport';

interface AddToCalendarMenuProps {
  item: ScheduleItem;
  compact?: boolean;
  align?: 'left' | 'right';
}

export const AddToCalendarMenu: React.FC<AddToCalendarMenuProps> = ({
  item,
  compact = false,
  align = 'left',
}) => {
  const { showToast } = useChurch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const googleCalendarUrl = useMemo(() => buildGoogleCalendarUrl(item), [item]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
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

  const handleDownloadIcs = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    downloadScheduleIcs(item);
    setOpen(false);
    showToast(
      `File pengingat (.ics) untuk "${item.judul}" telah diunduh. Buka file untuk menyimpannya ke aplikasi kalender perangkat Anda.`,
      {
        title: 'Pengingat Kalender Diunduh',
        variant: 'success',
      }
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={
          compact
            ? 'min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-2.5 py-1 text-xs font-semibold text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap'
            : 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#9A3412]/30 dark:border-[#D4AF37]/40 bg-[#FAF2E8] dark:bg-[#1E1008] px-4 py-2.5 text-sm font-semibold text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap'
        }
      >
        <CalendarPlus className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} />
        <span>Tambahkan ke Kalender</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Simpan ${item.judul} ke kalender`}
          className={`absolute z-30 mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] p-1.5 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <a
            role="menuitem"
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-[#FAF2E8] dark:hover:bg-[#3D2112] transition-colors"
          >
            <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-[#9A3412] dark:text-[#D4AF37]" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Google Calendar
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Simpan & aktifkan pengingat di akun Google
              </p>
            </div>
          </a>

          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadIcs}
            className="w-full flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-[#FAF2E8] dark:hover:bg-[#3D2112] transition-colors"
          >
            <Download className="h-4 w-4 mt-0.5 shrink-0 text-[#9A3412] dark:text-[#D4AF37]" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Kalender Ponsel (.ics)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Apple, Android, Samsung & Outlook (pengingat 30 mnt)
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
