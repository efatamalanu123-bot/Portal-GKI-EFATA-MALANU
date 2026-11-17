import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Lock, ShieldCheck, UserCog } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ChurchLogo } from '../ChurchLogo';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, navigate } = useChurch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(username, password);
    if (!res.ok) {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-4 sm:py-8 space-y-6">
      <button
        type="button"
        onClick={() => navigate('beranda')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#9A3412] dark:hover:text-[#D4AF37]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali ke Halaman Jemaat</span>
      </button>

      <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <ChurchLogo className="h-11 w-11 shrink-0" />
          <div>
            <h1 className="font-display text-2xl font-bold text-[#9A3412] dark:text-white">
              Login Majelis & Pengurus
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Portal Manajemen Konten GKI Efata Malanu
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Nama Pengguna (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              placeholder="superuser / admin1 / admin2"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Masukkan kata sandi"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity"
          >
            <Lock className="h-4 w-4" />
            <span>Masuk ke Dashboard</span>
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <KeyRound className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Akses Cepat Demo Pengujian Multi-User:</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => demoLogin('superuser')}
              className="min-h-[44px] flex items-center justify-between rounded-xl border border-[#D4AF37]/60 bg-[#D4AF37]/10 px-4 py-2.5 text-left hover:bg-[#D4AF37]/20 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-[#9A3412] dark:text-[#E5C158]">
                  Masuk Demo Super User
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Ketua Majelis / IT · Akses penuh termasuk Keuangan, Statistik & Akun
                </p>
              </div>
              <ShieldCheck className="h-4 w-4 text-[#9A7B16] dark:text-[#D4AF37] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => demoLogin('admin1')}
              className="min-h-[44px] flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-4 py-2.5 text-left hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-[#9A3412] dark:text-white">
                  Masuk Demo Admin 1
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sekretaris / Warta · Kelola Warta, Jadwal, Liturgi & Galeri
                </p>
              </div>
              <UserCog className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => demoLogin('admin2')}
              className="min-h-[44px] flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-4 py-2.5 text-left hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-[#9A3412] dark:text-white">
                  Masuk Demo Admin 2
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Urusan Ibadah · Kelola Tata Ibadah, Jadwal, Warta & Galeri
                </p>
              </div>
              <UserCog className="h-4 w-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
