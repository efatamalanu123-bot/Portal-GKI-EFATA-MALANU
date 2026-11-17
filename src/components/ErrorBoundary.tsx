import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kesalahan saat memuat halaman.',
    };
  }

  handleRecover = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
    } catch {
      // Ignore cleanup errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF2E8] dark:bg-[#180D07] p-6">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-center space-y-4">
            <h1 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
              Portal GKI Efata Malanu Perlu Dimuat Ulang
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Terjadi kendala saat merender tampilan ({this.state.errorMessage}). Silakan segarkan cache aplikasi.
            </p>
            <button
              type="button"
              onClick={this.handleRecover}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Muat Ulang & Bersihkan Cache</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
