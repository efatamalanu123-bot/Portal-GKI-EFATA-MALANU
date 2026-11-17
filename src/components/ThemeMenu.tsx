import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

interface ThemeMenuProps {
  variant?: 'header' | 'darkHeader' | 'panel';
}

export const ThemeMenu: React.FC<ThemeMenuProps> = ({ variant = 'header' }) => {
  const { themePreference, systemPrefersDark, setThemeMode, cycleThemeMode } = useChurch();

  if (variant === 'panel') {
    const isSystem = themePreference === 'system';
    const isLight = themePreference === 'light';
    const isDark = themePreference === 'dark';

    return (
      <div
        role="group"
        aria-label="Pilih Mode Tampilan Otomatis, Terang, atau Gelap"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <button
          type="button"
          onClick={() => setThemeMode('system')}
          aria-pressed={isSystem}
          className={`min-h-[68px] flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
            isSystem
              ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407] shadow-xs'
              : 'border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              isSystem
                ? 'bg-white/15 text-[#D4AF37] dark:bg-[#431407]/15 dark:text-[#9A3412]'
                : 'bg-white dark:bg-[#2B170C] text-[#9A3412] dark:text-[#D4AF37]'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">Otomatis (Sistem)</p>
            <p
              className={`text-[11px] mt-0.5 leading-tight ${
                isSystem
                  ? 'text-slate-200 dark:text-[#431407]/85'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Ikuti perangkat ({systemPrefersDark ? 'Gelap' : 'Terang'})
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setThemeMode('light')}
          aria-pressed={isLight}
          className={`min-h-[68px] flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
            isLight
              ? 'border-[#9A3412] bg-[#9A3412] text-white shadow-xs'
              : 'border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              isLight
                ? 'bg-white/15 text-[#D4AF37]'
                : 'bg-white dark:bg-[#2B170C] text-[#9A3412] dark:text-[#D4AF37]'
            }`}
          >
            <Sun className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">Mode Terang</p>
            <p
              className={`text-[11px] mt-0.5 leading-tight ${
                isLight ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Jelas di siang hari
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setThemeMode('dark')}
          aria-pressed={isDark}
          className={`min-h-[68px] flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
            isDark
              ? 'border-[#D4AF37] bg-[#D4AF37] text-[#431407] shadow-xs'
              : 'border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-[#431407]/15 text-[#9A3412]'
                : 'bg-white dark:bg-[#2B170C] text-[#9A3412] dark:text-[#D4AF37]'
            }`}
          >
            <Moon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">Mode Gelap</p>
            <p
              className={`text-[11px] mt-0.5 leading-tight ${
                isDark ? 'text-[#431407]/85' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Nyaman di ibadah malam
            </p>
          </div>
        </button>
      </div>
    );
  }

  if (variant === 'darkHeader') {
    return (
      <div
        role="group"
        aria-label="Menu Mode Otomatis, Terang, dan Gelap"
        className="inline-flex items-center rounded-xl bg-white/10 p-0.5 border border-white/15"
      >
        <button
          type="button"
          onClick={() => setThemeMode('system')}
          aria-pressed={themePreference === 'system'}
          title="Otomatis mengikuti pengaturan sistem"
          className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            themePreference === 'system'
              ? 'bg-[#D4AF37] text-[#431407]'
              : 'text-white/85 hover:text-white'
          }`}
        >
          <Monitor className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Auto</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeMode('light')}
          aria-pressed={themePreference === 'light'}
          title="Mode Terang"
          className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            themePreference === 'light'
              ? 'bg-[#D4AF37] text-[#431407]'
              : 'text-white/85 hover:text-white'
          }`}
        >
          <Sun className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Terang</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeMode('dark')}
          aria-pressed={themePreference === 'dark'}
          title="Mode Gelap"
          className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            themePreference === 'dark'
              ? 'bg-[#D4AF37] text-[#431407]'
              : 'text-white/85 hover:text-white'
          }`}
        >
          <Moon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Gelap</span>
        </button>
      </div>
    );
  }

  // Default: 'header'
  const mobileLabel =
    themePreference === 'system'
      ? 'Auto'
      : themePreference === 'dark'
        ? 'Gelap'
        : 'Terang';
  const MobileIcon =
    themePreference === 'system'
      ? Monitor
      : themePreference === 'dark'
        ? Moon
        : Sun;

  return (
    <>
      {/* Mobile compact cycler: Otomatis -> Gelap -> Terang */}
      <button
        type="button"
        onClick={cycleThemeMode}
        title={`Mode tampilan: ${mobileLabel} (ketuk untuk ganti)`}
        aria-label={`Mode tampilan ${mobileLabel}, ketuk untuk mengganti antara Otomatis, Gelap, dan Terang`}
        className="sm:hidden min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#361D10] px-2.5 text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
      >
        <MobileIcon className="h-3.5 w-3.5 shrink-0" />
        <span>{mobileLabel}</span>
      </button>

      {/* Tablet & Desktop segmented Auto / Terang / Gelap menu */}
      <div
        role="group"
        aria-label="Menu Mode Otomatis, Terang, dan Gelap"
        className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#361D10] p-0.5"
      >
        <button
          type="button"
          onClick={() => setThemeMode('system')}
          aria-pressed={themePreference === 'system'}
          title={`Ikuti Sistem (Saat ini: ${systemPrefersDark ? 'Gelap' : 'Terang'})`}
          className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            themePreference === 'system'
              ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407] shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#9A3412] dark:hover:text-white'
          }`}
        >
          <Monitor className="h-3.5 w-3.5 shrink-0" />
          <span>Auto</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeMode('light')}
          aria-pressed={themePreference === 'light'}
          title="Aktifkan Mode Terang"
          className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            themePreference === 'light'
              ? 'bg-[#9A3412] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#9A3412] dark:hover:text-white'
          }`}
        >
          <Sun className="h-3.5 w-3.5 shrink-0" />
          <span>Terang</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeMode('dark')}
          aria-pressed={themePreference === 'dark'}
          title="Aktifkan Mode Gelap"
          className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            themePreference === 'dark'
              ? 'bg-[#D4AF37] text-[#431407] shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#9A3412] dark:hover:text-white'
          }`}
        >
          <Moon className="h-3.5 w-3.5 shrink-0" />
          <span>Gelap</span>
        </button>
      </div>
    </>
  );
};
