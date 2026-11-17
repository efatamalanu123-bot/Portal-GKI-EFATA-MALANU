import React, { useState } from 'react';
import { Cake, FileDown, HardDriveDownload, HeartPulse, Lock, Megaphone } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ReadingToolbar } from '../ChurchLogo';
import { ShareActions } from '../ShareButton';

export const WartaPage: React.FC = () => {
  const { data, fontScale, syncOfflineWorshipCache } = useChurch();
  const { warta } = data;
  const [savingOffline, setSavingOffline] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const wartaUrl = `${origin}/warta`;

  const wartaSummaryText = [
    `*WARTA JEMAAT GKI EFATA MALANU*`,
    `${warta.edisi} (${warta.tanggalMinggu})`,
    '',
    warta.pengumuman.length > 0
      ? `Pengumuman Utama:\n${warta.pengumuman
          .slice(0, 4)
          .map((p, i) => `${i + 1}. ${p.judul} (${p.kategori})`)
          .join('\n')}`
      : 'Belum ada pengumuman minggu ini.',
    '',
    `Baca warta lengkap, daftar HUT, dan pokok doa jemaat di Portal GKI Efata Malanu:`,
  ].join('\n');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & PDF Download Control */}
      <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
              <span>{warta.edisi}</span>
              <span aria-hidden="true">·</span>
              <span>{warta.tanggalMinggu}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
              Warta Jemaat GKI Efata Malanu
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Informasi pelayanan, pengumuman mingguan, daftar ulang tahun, dan pokok doa jemaat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ReadingToolbar label="Huruf" />
            <button
              type="button"
              disabled={savingOffline}
              onClick={async () => {
                setSavingOffline(true);
                try {
                  await syncOfflineWorshipCache();
                } finally {
                  setSavingOffline(false);
                }
              }}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              <HardDriveDownload className="h-4 w-4 text-[#D4AF37]" />
              <span>{savingOffline ? 'Menyimpan...' : 'Simpan Offline'}</span>
            </button>
            {warta.allowPdfDownload ? (
              <a
                href={warta.pdfUrl || '/warta-minggu-ini.pdf'}
                download={warta.pdfFileName || 'Warta-Jemaat-GKI-Efata-Malanu.pdf'}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                <FileDown className="h-4 w-4" />
                <span>Unduh PDF Warta</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Unduhan PDF belum diaktifkan oleh Sekretaris / Admin"
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed whitespace-nowrap"
              >
                <Lock className="h-4 w-4" />
                <span>Unduh PDF Dinonaktifkan Admin</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bagikan ringkasan Warta Jemaat ke grup WhatsApp Rayon atau media sosial:
          </p>
          <ShareActions
            title={`Warta Jemaat GKI Efata Malanu — ${warta.edisi}`}
            text={wartaSummaryText}
            url={wartaUrl}
            label="Bagikan Warta"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pengumuman Mingguan */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
              Pengumuman Mingguan
            </h2>
          </div>

          {warta.pengumuman.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500">
              Belum ada pengumuman untuk minggu ini.
            </div>
          ) : (
            <div className="space-y-3.5">
              {warta.pengumuman.map((item, idx) => {
                const announcementShareText = [
                  `*${item.judul}*`,
                  `Warta Jemaat GKI Efata Malanu · ${item.kategori} · ${item.tanggalTerbit}`,
                  '',
                  item.isi,
                ].join('\n');

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono-nums font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {item.kategori}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.tanggalTerbit}</span>
                      </div>

                      <ShareActions
                        compact
                        title={item.judul}
                        text={announcementShareText}
                        url={wartaUrl}
                        label="Bagikan"
                      />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#9A3412] dark:text-white">
                      {item.judul}
                    </h3>
                    <p
                      className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line"
                      style={{ fontSize: `${0.95 * fontScale}rem`, lineHeight: 1.7 }}
                    >
                      {item.isi}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Sidebar: HUT Jemaat & Berita Duka/Sakit */}
        <aside className="lg:col-span-4 space-y-6">
          {/* HUT Jemaat */}
          <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <Cake className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                Jemaat Berulang Tahun
              </h2>
            </div>

            {warta.hutJemaat.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tidak ada daftar HUT minggu ini.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {warta.hutJemaat.map((h) => (
                  <li key={h.id} className="py-2.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {h.nama}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{h.rayon}</p>
                    </div>
                    <span className="font-mono-nums text-xs font-semibold text-[#9A7B16] dark:text-[#E5C158] shrink-0">
                      {h.tanggal}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Berita Duka & Sakit */}
          <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <HeartPulse className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                Berita Sakit & Duka
              </h2>
            </div>

            {warta.beritaDukaSakit.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tidak ada berita sakit atau duka minggu ini.
              </p>
            ) : (
              <div className="space-y-3">
                {warta.beritaDukaSakit.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-3.5 space-y-1"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span
                        className={
                          b.jenis === 'Duka'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }
                      >
                        Berita {b.jenis}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400">{b.rayon}</span>
                    </div>
                    <p className="text-sm font-bold text-[#9A3412] dark:text-white">{b.nama}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {b.keterangan}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
