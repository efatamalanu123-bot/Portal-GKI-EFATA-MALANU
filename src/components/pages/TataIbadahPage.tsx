import React, { useEffect, useState } from 'react';
import { BookOpen, HardDriveDownload, Music, Printer } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ReadingToolbar } from '../ChurchLogo';
import { LiturgyAudioPlayer } from '../LiturgyAudioPlayer';
import {
  ImmersiveReaderToolbar,
  ImmersiveReaderSettings,
  loadImmersiveReaderSettings,
  saveImmersiveReaderSettings,
  getReaderThemeClass,
  getReaderLineHeight,
} from '../ImmersiveReader';

export const TataIbadahPage: React.FC = () => {
  const {
    data,
    fontScale,
    activeLiturgyStepId,
    clearActiveLiturgyStep,
    syncOfflineWorshipCache,
  } = useChurch();
  const { liturgy } = data;
  const [savingOffline, setSavingOffline] = useState(false);
  const [readerSettings, setReaderSettings] = useState<ImmersiveReaderSettings>(
    loadImmersiveReaderSettings
  );

  useEffect(() => {
    saveImmersiveReaderSettings(readerSettings);
  }, [readerSettings]);

  useEffect(() => {
    if (!activeLiturgyStepId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(activeLiturgyStepId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      clearActiveLiturgyStep();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeLiturgyStepId, clearActiveLiturgyStep]);

  const sortedSteps = [...liturgy.steps].sort((a, b) => a.urutan - b.urutan);
  const readerThemeClass = getReaderThemeClass(readerSettings.activeTheme);
  const readerLineHeight = getReaderLineHeight(readerSettings.lineSpacing);
  const finalFontSize = `${1 * fontScale * readerSettings.fontScaleMultiplier}rem`;
  const finalSongFontSize = `${0.98 * fontScale * readerSettings.fontScaleMultiplier}rem`;

  return (
    <div className={`mx-auto space-y-6 ${readerSettings.focusMode ? 'max-w-3xl' : 'max-w-4xl'}`}>
      {/* Header Card (Hidden in Focus Mode) */}
      {!readerSettings.focusMode && (
        <section className="rounded-2xl bg-[#9A3412] text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#E5C158]">
                <span>{liturgy.mingguTanggal}</span>
                <span aria-hidden="true">·</span>
                <span>{liturgy.tahunGerejawi}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                Tata Ibadah Minggu GKI Efata Malanu
              </h1>
              <p className="text-sm text-slate-200 max-w-2xl">
                Tema Pelayanan: <strong className="text-white">{liturgy.temaPelayanan}</strong>
              </p>
              <div className="pt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300">
                <span>Pelayan Firman: {liturgy.pelayanFirman}</span>
                <span>Waktu: {liturgy.jamIbadah}</span>
                <span>Nas: {liturgy.ayatReferensi}</span>
              </div>
            </div>

            <div className="no-print self-start flex flex-wrap items-center gap-2 shrink-0">
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
                className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#431407] hover:bg-[#e1be49] disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <HardDriveDownload className="h-4 w-4" />
                <span>{savingOffline ? 'Menyimpan...' : 'Simpan Offline'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Liturgi</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Liturgy Audio Guide Player */}
      <LiturgyAudioPlayer />

      {/* Reading Accessibility, Immersive Reader & Quick Jump */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-14 md:top-16 z-20 bg-[#FAF2E8]/95 dark:bg-[#180D07]/95 backdrop-blur-sm py-2.5 border-b border-slate-200 dark:border-slate-800">
        {!readerSettings.focusMode && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {sortedSteps.map((step) => (
              <a
                key={step.id}
                href={`#${step.id}`}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#D4AF37] whitespace-nowrap shrink-0 transition-colors"
              >
                <span className="font-mono-nums mr-1 text-[#9A7B16] dark:text-[#D4AF37]">
                  {step.urutan}.
                </span>
                {step.bagian.split(' ')[0]}
              </a>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <ImmersiveReaderToolbar settings={readerSettings} onChange={setReaderSettings} />
          <ReadingToolbar label="Huruf" />
        </div>
      </div>

      {/* Continuous Scrollable Liturgy with Immersive Reader Theme */}
      <div className="space-y-4">
        {sortedSteps.map((step) => (
          <article
            key={step.id}
            id={step.id}
            className={`scroll-mt-32 rounded-2xl border p-5 sm:p-7 shadow-xs space-y-4 transition-colors ${readerThemeClass}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-current/15">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono-nums text-sm font-bold opacity-75">
                  {String(step.urutan).padStart(2, '0')}.
                </span>
                <h2 className="font-display text-lg sm:text-xl font-bold">
                  {step.bagian}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs opacity-80">
                <span>{step.petugas}</span>
                {step.sikapJemaat && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold">
                      Jemaat {step.sikapJemaat}
                    </span>
                  </>
                )}
              </div>
            </div>

            {step.keterangan && (
              <p className="text-xs italic opacity-70">
                {step.keterangan}
              </p>
            )}

            <div
              className="whitespace-pre-line leading-relaxed"
              style={{ fontSize: finalFontSize, lineHeight: readerLineHeight }}
            >
              {step.isi}
            </div>

            {step.nyanyianJudul && (
              <div className="mt-4 rounded-xl border border-current/20 bg-current/5 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Music className="h-4 w-4 shrink-0" />
                  <span>
                    {step.nyanyianKode} — {step.nyanyianJudul}
                  </span>
                </div>
                {step.nyanyianLirik && (
                  <pre
                    className="whitespace-pre-wrap font-sans leading-relaxed opacity-95"
                    style={{ fontSize: finalSongFontSize, lineHeight: readerLineHeight }}
                  >
                    {step.nyanyianLirik}
                  </pre>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className={`rounded-2xl border p-5 flex items-center gap-3 text-sm ${readerThemeClass}`}>
        <BookOpen className="h-5 w-5 shrink-0" />
        <p>
          Liturgi disiapkan untuk mendukung kekhusyukan ibadah di gedung gereja maupun jemaat yang mengikuti dari rumah. Gunakan tombol <strong>Immersive Reader</strong> di atas untuk menyesuaikan tema kertas, jarak baris, dan ukuran huruf.
        </p>
      </div>
    </div>
  );
};
