import React from 'react';
import { Home, MapPin, Shield, Users } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

export const StatistikPage: React.FC = () => {
  const { data } = useChurch();
  const { statistics } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
          {statistics.tahunData}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white mt-0.5">
          Data Jemaat, Rayon Malanu & Majelis
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Rekapitulasi jumlah Kepala Keluarga (KK), pembagian 5 Rayon pelayanan di Malanu, dan struktur Pelayan Harian Majelis Jemaat (PHMJ).
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#9A3412] text-white p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <span>Total Kepala Keluarga</span>
            <Home className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <p className="font-mono-nums text-3xl font-bold">{statistics.totalKK}</p>
          <p className="text-xs text-slate-300">KK terdaftar di 5 Rayon</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Jiwa Jemaat</span>
            <Users className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <p className="font-mono-nums text-3xl font-bold text-[#9A3412] dark:text-white">
            {statistics.totalJiwa}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Anggota sidi, baptis & anak</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Laki-Laki</span>
          <p className="font-mono-nums text-3xl font-bold text-[#9A3412] dark:text-white">
            {statistics.pria}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {Math.round((statistics.pria / Math.max(1, statistics.totalJiwa)) * 100)}% dari jemaat
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Perempuan</span>
          <p className="font-mono-nums text-3xl font-bold text-[#9A3412] dark:text-white">
            {statistics.wanita}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {Math.round((statistics.wanita / Math.max(1, statistics.totalJiwa)) * 100)}% dari jemaat
          </p>
        </div>
      </div>

      {/* Pembagian Rayon/Wijk 1-5 */}
      <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <MapPin className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
            Pembagian Wilayah Rayon / Wijk Malanu
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4">Rayon</th>
                <th className="py-3 pr-4">Wilayah Pelayanan</th>
                <th className="py-3 pr-4">Koordinator Rayon</th>
                <th className="py-3 pr-4 text-right">Jumlah KK</th>
                <th className="py-3 text-right">Jumlah Jiwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {statistics.rayonList.map((r) => (
                <tr key={r.rayon} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 pr-4 font-bold text-[#9A3412] dark:text-[#D4AF37] whitespace-nowrap">
                    Rayon {r.rayon}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-800 dark:text-slate-200">
                    {r.namaWilayah}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-600 dark:text-slate-300">
                    {r.koordinator}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-mono-nums font-semibold text-slate-900 dark:text-white">
                    {r.jumlahKK}
                  </td>
                  <td className="py-3.5 text-right font-mono-nums font-semibold text-slate-900 dark:text-white">
                    {r.jumlahJiwa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Struktur Majelis Jemaat */}
      <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Shield className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
            Struktur Pelayan Harian Majelis Jemaat (PHMJ)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statistics.majelisJemaat.map((m) => (
            <div
              key={m.id}
              className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 space-y-1"
            >
              <p className="text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
                {m.jabatan}
              </p>
              <h3 className="text-base font-bold text-[#9A3412] dark:text-white">
                {m.nama}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{m.bidang}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
