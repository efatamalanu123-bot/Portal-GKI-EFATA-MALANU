import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Building2, Wallet } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

function formatIDR(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export const KeuanganPage: React.FC = () => {
  const { data } = useChurch();
  const { finance } = data;

  const progressPct = Math.min(
    100,
    Math.round((finance.terkumpulPembangunan / Math.max(1, finance.targetPembangunan)) * 100)
  );
  const totalMasuk = finance.penerimaan.reduce((acc, cur) => acc + cur.jumlah, 0);
  const totalKeluar = finance.pengeluaran.reduce((acc, cur) => acc + cur.jumlah, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
          {finance.periodeLaporan}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white mt-0.5">
          Laporan Transparansi Keuangan Jemaat
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Ringkasan posisi kas jemaat, persembahan ibadah mingguan, dan progres aksi pembangunan gereja.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#9A3412] text-white p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Saldo Kas Jemaat Saat Ini</span>
            <Wallet className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <p className="font-mono-nums text-2xl sm:text-3xl font-bold text-white">
            {formatIDR(finance.kasJemaat)}
          </p>
          <p className="text-xs text-slate-300">Tercatat oleh Bendahara PHMJ</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Persembahan Minggu Lalu
            </span>
            <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-mono-nums text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
            {formatIDR(finance.persembahanMingguLalu)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Minggu, Unsur, Rayon & Syukur
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aksi Pembangunan
            </span>
            <Building2 className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <p className="font-mono-nums text-2xl font-bold text-[#9A3412] dark:text-white">
            {progressPct}% Tercapai
          </p>
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D4AF37]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
            {formatIDR(finance.terkumpulPembangunan)} / {formatIDR(finance.targetPembangunan)}
          </p>
        </div>
      </div>

      {/* Proyek Pembangunan Banner */}
      <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
          Proyek Berjalan: {finance.namaProyekPembangunan}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Dukungan persembahan pembangunan dapat disalurkan melalui kotak aksi pembangunan pada Ibadah Minggu atau transfer ke rekening resmi Panitia Pembangunan di halaman Profil & Kontak.
        </p>
      </section>

      {/* Penerimaan & Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                Rincian Penerimaan
              </h2>
            </div>
            <span className="font-mono-nums text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {formatIDR(totalMasuk)}
            </span>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {finance.penerimaan.map((item) => (
              <li key={item.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.uraian}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.tanggal}</p>
                </div>
                <span className="font-mono-nums text-sm font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  + {formatIDR(item.jumlah)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                Rincian Pengeluaran
              </h2>
            </div>
            <span className="font-mono-nums text-sm font-bold text-rose-700 dark:text-rose-400">
              {formatIDR(totalKeluar)}
            </span>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {finance.pengeluaran.map((item) => (
              <li key={item.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.uraian}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.tanggal}</p>
                </div>
                <span className="font-mono-nums text-sm font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  - {formatIDR(item.jumlah)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
