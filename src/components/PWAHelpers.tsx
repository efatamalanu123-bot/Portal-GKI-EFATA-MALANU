import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'full' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'compact'
            ? 'inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#431407] hover:bg-[#c49f2c] transition-colors whitespace-nowrap shrink-0 min-h-[40px]'
            : 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap min-h-[44px]'
        }
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Pasang Aplikasi (PWA)</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className={
          variant === 'compact'
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 min-h-[40px]'
            : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap min-h-[44px]'
        }
      >
        <Smartphone className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        <span>{isIOS ? 'Pasang di iPhone / iPad' : 'Panduan Pasang Aplikasi'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-[#9A3412] dark:text-white">
                Pasang Aplikasi GKI Efata Malanu
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isIOS ? (
                <>
                  <p>1. Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah browser Safari.</p>
                  <p>2. Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</p>
                  <p>3. Ketuk <strong>Tambah</strong> untuk membuka Tata Ibadah & Nyanyian secara offline.</p>
                </>
              ) : (
                <>
                  <p>1. Buka menu browser (ikon titik tiga di pojok kanan atas Chrome/Edge).</p>
                  <p>2. Pilih <strong>Tambahkan ke Layar Utama</strong> atau <strong>Instal Aplikasi</strong>.</p>
                  <p>3. Aplikasi akan terpasang di perangkat untuk akses cepat saat ibadah di gereja.</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] py-2.5 text-sm font-semibold text-white dark:text-[#431407]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Mode Offline — Tata Ibadah, Warta Jemaat, Jadwal &amp; Nyanyian tetap tersedia dari cache.</span>
    </div>
  );
};
