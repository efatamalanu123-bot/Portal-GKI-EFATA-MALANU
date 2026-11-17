import React, { useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  Copy,
  HardDriveDownload,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { CHURCH_IMAGES } from '../../utils/churchAssets';
import { ReadingToolbar } from '../ChurchLogo';
import { ChurchInteractiveMapCard } from '../ChurchInteractiveMapCard';
import { DailyReminderCard } from '../DailyReminderCard';
import { DriveLogoSyncCard } from '../DriveLogoSyncCard';
import { GoogleSheetsSyncCard } from '../GoogleSheetsSyncCard';
import { PWAInstallButton } from '../PWAHelpers';
import { QRScannerModal } from '../QRScannerModal';
import { ThemeMenu } from '../ThemeMenu';

export const ProfilPage: React.FC = () => {
  const {
    data,
    navigate,
    currentUser,
    showToast,
    bookmarkedVerses,
    removeBookmarkVerse,
    openBiblePassage,
    syncOfflineWorshipCache,
  } = useChurch();
  const { profile, gallery } = data;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const handleCopyAccount = (id: string, nomor: string, bank: string) => {
    navigator.clipboard?.writeText(nomor.replace(/-/g, ''));
    setCopiedId(id);
    showToast(`Nomor rekening ${bank} disalin.`);
    window.setTimeout(() => setCopiedId(null), 2200);
  };

  const handleCopyVerse = (refTitle: string, text: string) => {
    navigator.clipboard?.writeText(`${refTitle} — "${text}"`);
    showToast(`Ayat ${refTitle} disalin.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Sejarah & Identitas */}
      <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 relative min-h-[240px] bg-[#9A3412]">
          <img
            src={CHURCH_IMAGES.fellowship}
            alt="Persekutuan Jemaat GKI Efata Malanu Sorong"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
              {profile.sinode} · {profile.klasis}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
              Profil & Sejarah {profile.namaGereja}
            </h1>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              {profile.sejarahSingkat}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <PWAInstallButton variant="full" />
            <button
              type="button"
              disabled={syncingOffline}
              onClick={async () => {
                setSyncingOffline(true);
                try {
                  await syncOfflineWorshipCache();
                } finally {
                  setSyncingOffline(false);
                }
              }}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-4 py-2 text-sm font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] disabled:opacity-60 transition-colors"
            >
              <HardDriveDownload className="h-4 w-4 text-[#D4AF37]" />
              <span>{syncingOffline ? 'Menyimpan Cache...' : 'Simpan Cache Offline Portal'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(currentUser ? 'admin' : 'login')}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors"
            >
              {currentUser ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                  <span>Buka Dashboard Admin</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-[#D4AF37]" />
                  <span>Login Majelis / Admin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content + Sidebar Profil Jemaat (Desktop 2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (8 cols): Tampilan, Lokasi & Kontak, Rekening, Galeri */}
        <div className="lg:col-span-8 space-y-6">
          {/* Fitur Presensi Ibadah & Pasang Aplikasi Portal */}
          <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9A7B16] dark:text-[#E5C158]">
                  <QrCode className="h-4 w-4" />
                  <span>Akses Presensi & Pasang Aplikasi</span>
                </div>
                <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                  Scan Presensi QR & Panduan Pasang Aplikasi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pindai QR kehadiran ibadah dan pasang aplikasi portal jemaat langsung ke layar utama HP Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
              <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-[#9A3412]/20 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-[#9A3412] dark:text-[#D4AF37]" />
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      Scan QR Presensi Ibadah
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Scan kode QR ibadah minggu atau rayon saat tiba di gedung gereja untuk mencatat kehadiran persekutuan Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-white dark:text-[#431407] hover:opacity-95 transition-opacity shadow-xs"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Buka Kamera Scan QR</span>
                </button>
              </div>

              <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-[#9A3412]/20 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-[#9A3412] dark:text-[#D4AF37]" />
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      Pasang Aplikasi di Layar Utama
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Pasang portal GKI Efata Malanu sebagai Progressive Web App (PWA) agar dapat dibuka instan secara offline layaknya aplikasi native.
                  </p>
                </div>
                <div>
                  <PWAInstallButton variant="full" />
                </div>
              </div>
            </div>
          </section>

          {/* Menu Tampilan Terang / Gelap & Ukuran Huruf */}
          <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                  Menu Tampilan Terang / Gelap & Aksesibilitas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sesuaikan tema layar dan ukuran huruf bacaan agar nyaman digunakan di dalam gedung gereja.
                </p>
              </div>
              <ReadingToolbar label="Ukuran Huruf" />
            </div>
            <ThemeMenu variant="panel" />
          </section>

          <DailyReminderCard variant="panel" />

          <ChurchInteractiveMapCard />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Lokasi & Kontak */}
            <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                Lokasi & Kontak Sekretariat
              </h2>

              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">Alamat Gereja</dt>
                    <dd className="text-slate-600 dark:text-slate-300">{profile.alamat}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">Telepon & WhatsApp</dt>
                    <dd className="text-slate-600 dark:text-slate-300 font-mono-nums">
                      {profile.teleponSekretariat} · WA +{profile.whatsappSekretariat}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-slate-900 dark:text-white">Email Resmi</dt>
                    <dd className="text-slate-600 dark:text-slate-300">{profile.email}</dd>
                  </div>
                </div>
              </dl>

              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    profile.mapsQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Buka Lokasi di Google Maps</span>
                </a>
              </div>
            </section>

            {/* Info Rekening Persembahan + Salin Nomor Rekening */}
            <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                  Rekening Persembahan
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Persembahan syukur, persepuluhan, maupun dukungan pembangunan dapat ditransfer ke rekening resmi berikut.
              </p>

              <div className="space-y-3">
                {profile.rekeningList.map((rek) => {
                  const isCopied = copiedId === rek.id;
                  return (
                    <div
                      key={rek.id}
                      className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200 dark:border-slate-700 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#9A3412] dark:text-[#E5C158]">
                          {rek.bank}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount(rek.id, rek.nomor, rek.bank)}
                          className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#D4AF37] transition-colors shrink-0"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono-nums text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                        {rek.nomor}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        a.n. <strong>{rek.atasNama}</strong> · {rek.peruntukan}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Galeri Lengkap */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
              Galeri Foto Pelayanan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {gallery.map((g) => (
                <figure
                  key={g.id}
                  className="overflow-hidden rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 shadow-xs"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#9A3412] to-[#EA580C]">
                    <img
                      src={g.imageUrl}
                      alt={g.judul}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <figcaption className="p-4 space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{g.tanggal}</p>
                    <p className="text-sm font-bold text-[#9A3412] dark:text-white">{g.judul}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{g.deskripsi}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <GoogleSheetsSyncCard />
        </div>

        {/* Sidebar Profil Jemaat (4 cols): Panel Khusus Bookmark Ayat Favorit */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <section
            aria-labelledby="bookmark-ayat-heading"
            className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-[#D4AF37] fill-current shrink-0" />
                <div>
                  <h2
                    id="bookmark-ayat-heading"
                    className="font-display text-lg font-bold text-[#9A3412] dark:text-white leading-tight"
                  >
                    Bookmark Ayat Favorit
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono-nums font-semibold">{bookmarkedVerses.length}</span> ayat tersimpan di perangkat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('alkitab')}
                className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
              >
                Buka Alkitab
              </button>
            </div>

            {bookmarkedVerses.length === 0 ? (
              <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-5 text-center space-y-3">
                <BookOpen className="h-7 w-7 text-[#D4AF37] mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#9A3412] dark:text-white">
                    Belum Ada Bookmark Ayat
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ketuk ikon bookmark pada ayat di halaman Alkitab untuk menyimpan ayat penguatan atau hafalan keluarga Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('alkitab')}
                  className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Cari Ayat di Alkitab</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto pr-1">
                {bookmarkedVerses.map((item) => {
                  const refTitle = `${item.bookName} ${item.chapter}:${item.verse}`;
                  return (
                    <article key={item.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openBiblePassage(item.bookId, item.chapter)}
                          className="text-left group"
                        >
                          <span className="text-sm font-bold text-[#9A3412] dark:text-[#E5C158] group-hover:underline">
                            {refTitle}
                          </span>
                          <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {item.testament} · {item.savedAt}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyVerse(refTitle, item.text)}
                            aria-label={`Salin ${refTitle}`}
                            title="Salin ayat"
                            className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-[#9A3412] dark:hover:text-[#D4AF37]"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBookmarkVerse(item.id)}
                            aria-label={`Hapus bookmark ${refTitle}`}
                            title="Hapus bookmark"
                            className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="font-serif-reading text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        “{item.text}”
                      </p>

                      <button
                        type="button"
                        onClick={() => openBiblePassage(item.bookId, item.chapter)}
                        className="text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:underline"
                      >
                        Baca Pasal {item.chapter} →
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <DriveLogoSyncCard variant="panel" />
        </aside>
      </div>

      <QRScannerModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
};
