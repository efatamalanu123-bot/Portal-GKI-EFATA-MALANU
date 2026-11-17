import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const HeaderConnectionIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
        isOnline
          ? 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
          : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
      }`}
      title={
        isOnline
          ? 'Koneksi Online — Data sinkron dengan server & Google Sheets'
          : 'Mode Offline — Menggunakan data cache lokal'
      }
    >
      {isOnline ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-400" />
          </span>
          <Wifi className="h-3.5 w-3.5 hidden sm:inline" />
          <span>Online</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600 dark:bg-amber-400 animate-pulse" />
          </span>
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};
