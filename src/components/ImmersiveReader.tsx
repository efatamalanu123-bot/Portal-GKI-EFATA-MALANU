import React, { useEffect, useState } from 'react';
import {
  Aperture,
  Check,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
  Type,
  X,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

export type ReaderThemeMode = 'sepia' | 'ivory' | 'dark' | 'emerald';
export type ReaderLineSpacing = 'relaxed' | 'loose' | 'normal';

export interface ImmersiveReaderSettings {
  activeTheme: ReaderThemeMode;
  lineSpacing: ReaderLineSpacing;
  focusMode: boolean; // dims sidebars/nav when reading
  fontScaleMultiplier: number;
}

export const STORAGE_IMMERSIVE_READER_KEY = 'gki_efata_immersive_reader_settings_v1';

export const DEFAULT_IMMERSIVE_READER_SETTINGS: ImmersiveReaderSettings = {
  activeTheme: 'sepia',
  lineSpacing: 'relaxed',
  focusMode: false,
  fontScaleMultiplier: 1.1,
};

export function loadImmersiveReaderSettings(): ImmersiveReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_IMMERSIVE_READER_KEY);
    if (!raw) return DEFAULT_IMMERSIVE_READER_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      activeTheme: parsed.activeTheme || DEFAULT_IMMERSIVE_READER_SETTINGS.activeTheme,
      lineSpacing: parsed.lineSpacing || DEFAULT_IMMERSIVE_READER_SETTINGS.lineSpacing,
      focusMode: typeof parsed.focusMode === 'boolean' ? parsed.focusMode : false,
      fontScaleMultiplier:
        typeof parsed.fontScaleMultiplier === 'number'
          ? Math.min(1.6, Math.max(0.85, parsed.fontScaleMultiplier))
          : DEFAULT_IMMERSIVE_READER_SETTINGS.fontScaleMultiplier,
    };
  } catch {
    return DEFAULT_IMMERSIVE_READER_SETTINGS;
  }
}

export function saveImmersiveReaderSettings(settings: ImmersiveReaderSettings): void {
  try {
    localStorage.setItem(STORAGE_IMMERSIVE_READER_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

const THEME_PRESETS: Array<{ id: ReaderThemeMode; label: string; bgClass: string; textClass: string }> = [
  {
    id: 'sepia',
    label: 'Sepia Hangat',
    bgClass: 'bg-[#FDF6EC] dark:bg-[#251810]',
    textClass: 'text-[#3D2314] dark:text-[#F3E5D8]',
  },
  {
    id: 'ivory',
    label: 'Gading Bersih',
    bgClass: 'bg-[#FFFFFF] dark:bg-[#1A1A1A]',
    textClass: 'text-slate-900 dark:text-slate-100',
  },
  {
    id: 'dark',
    label: 'Malam Gelap',
    bgClass: 'bg-[#121212] dark:bg-[#0D0D0D]',
    textClass: 'text-slate-200 dark:text-slate-100',
  },
  {
    id: 'emerald',
    label: 'Zaitun Tenang',
    bgClass: 'bg-[#F2F7F4] dark:bg-[#122018]',
    textClass: 'text-[#102A1C] dark:text-[#D1E7DD]',
  },
];

interface ImmersiveReaderToolbarProps {
  settings: ImmersiveReaderSettings;
  onChange: (settings: ImmersiveReaderSettings) => void;
  onClose?: () => void;
  compact?: boolean;
}

export const ImmersiveReaderToolbar: React.FC<ImmersiveReaderToolbarProps> = ({
  settings,
  onChange,
  onClose,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);

  const update = (partial: Partial<ImmersiveReaderSettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#9A3412]/30 dark:border-[#D4AF37]/40 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 py-1.5 text-xs font-semibold text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap shadow-xs"
        title="Immersive Reader — Pengaturan Bacaan"
      >
        <Aperture className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        <span>Immersive Reader</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] p-4 shadow-2xl z-50 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <p className="text-xs font-bold text-[#9A3412] dark:text-white">
                Pengaturan Pembacaan Immersive
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[28px] min-w-[28px] rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Theme Palette */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tema Latar Belakang & Kertas
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {THEME_PRESETS.map((p) => {
                const active = settings.activeTheme === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update({ activeTheme: p.id })}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                      active
                        ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1008] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{p.label}</span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Scale Multiplier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Ukuran Font Lirik & Teks</span>
              <span className="font-mono-nums">
                {Math.round(settings.fontScaleMultiplier * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  update({
                    fontScaleMultiplier: Math.max(0.85, settings.fontScaleMultiplier - 0.1),
                  })
                }
                className="min-h-[36px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1008] text-xs font-bold text-[#9A3412] dark:text-slate-200 hover:bg-slate-100"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => update({ fontScaleMultiplier: 1.1 })}
                className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1008] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() =>
                  update({
                    fontScaleMultiplier: Math.min(1.6, settings.fontScaleMultiplier + 0.1),
                  })
                }
                className="min-h-[36px] flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1008] text-xs font-bold text-[#9A3412] dark:text-slate-200 hover:bg-slate-100"
              >
                A+
              </button>
            </div>
          </div>

          {/* Line Spacing */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Jarak Antar Baris (Line Spacing)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'normal', label: 'Rapat', val: 'normal' },
                  { id: 'relaxed', label: 'Luas', val: 'relaxed' },
                  { id: 'loose', label: 'Sangat Longgar', val: 'loose' },
                ] as const
              ).map((sp) => {
                const active = settings.lineSpacing === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => update({ lineSpacing: sp.id as ReaderLineSpacing })}
                    className={`min-h-[36px] px-2 py-1.5 rounded-xl text-xs font-semibold border text-center transition-colors ${
                      active
                        ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1008] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sp.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus Mode Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Fokus Membaca</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sembunyikan menu samping untuk konsentrasi penuh
              </p>
            </div>
            <button
              type="button"
              onClick={() => update({ focusMode: !settings.focusMode })}
              className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                settings.focusMode
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {settings.focusMode ? 'Aktif' : 'Standar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export function getReaderThemeClass(theme: ReaderThemeMode): string {
  switch (theme) {
    case 'sepia':
      return 'bg-[#FDF6EC] dark:bg-[#20150E] text-[#3D2314] dark:text-[#F3E5D8] border-[#EAD7C3] dark:border-[#3D2517]';
    case 'ivory':
      return 'bg-[#FFFFFF] dark:bg-[#181818] text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800';
    case 'dark':
      return 'bg-[#121212] dark:bg-[#0A0A0A] text-slate-100 dark:text-slate-200 border-slate-800 dark:border-slate-900';
    case 'emerald':
      return 'bg-[#F2F7F4] dark:bg-[#101C15] text-[#102A1C] dark:text-[#D1E7DD] border-[#D1E7DD] dark:border-[#1A3324]';
  }
}

export function getReaderLineHeight(spacing: ReaderLineSpacing): number {
  switch (spacing) {
    case 'normal':
      return 1.55;
    case 'relaxed':
      return 1.85;
    case 'loose':
      return 2.15;
  }
}
