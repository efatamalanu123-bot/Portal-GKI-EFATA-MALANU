import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

export const ChurchLogo: React.FC<{ className?: string }> = ({ className = 'h-9 w-9' }) => {
  const { customLogo } = useChurch();

  if (customLogo?.dataUrl) {
    return (
      <img
        src={customLogo.dataUrl}
        alt="Logo GKI Efata Malanu"
        referrerPolicy="no-referrer"
        className={`${className} object-contain rounded-lg select-none`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" fill="#9A3412" />
      <circle cx="24" cy="24" r="17.5" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M22 10H26V20H35V24H26V38H22V24H13V20H22V10Z" fill="#D4AF37" />
      <path
        d="M17.5 34.5C20 32.5 28 32.5 30.5 34.5"
        stroke="#FFFFFF"
        strokeOpacity="0.85"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const ReadingToolbar: React.FC<{ label?: string }> = ({ label = 'Ukuran Teks Bacaan' }) => {
  const { fontScale, increaseFont, decreaseFont, resetFont } = useChurch();
  const pct = Math.round(fontScale * 100);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-2.5 py-1.5 shadow-xs">
      <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
        {label}:
      </span>
      <button
        type="button"
        onClick={decreaseFont}
        disabled={fontScale <= 0.85}
        title="Perkecil ukuran teks (A-)"
        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg px-2 text-xs font-bold text-[#9A3412] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
      >
        <Minus className="h-3.5 w-3.5 mr-0.5" />
        A
      </button>
      <span className="font-mono-nums text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[42px] text-center">
        {pct}%
      </span>
      <button
        type="button"
        onClick={increaseFont}
        disabled={fontScale >= 1.45}
        title="Perbesar ukuran teks (A+)"
        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg px-2 text-xs font-bold text-[#9A3412] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
      >
        A
        <Plus className="h-3.5 w-3.5 ml-0.5" />
      </button>
      {fontScale !== 1 && (
        <button
          type="button"
          onClick={resetFont}
          title="Kembalikan ukuran normal"
          className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
