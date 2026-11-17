import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FolderSearch,
  Image as ImageIcon,
  Link2,
  LogOut,
  RefreshCw,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import {
  blobToOptimizedLogoDataUrl,
  downloadDriveImageAsDataUrl,
  DriveFileMeta,
  extractGoogleDriveFileId,
  findDriveFileByName,
  getDriveAccessToken,
  getDriveCurrentUser,
  getPublicDriveImageCandidates,
  googleSignInForDrive,
  initDriveAuth,
  logoutDrive,
  searchDriveImageFiles,
} from '../utils/googleDriveAuth';
import { ChurchLogo } from './ChurchLogo';

interface GoogleSignInButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  disabled = false,
  label = 'Sign in with Google',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="gsi-material-button inline-flex items-center justify-center gap-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
  >
    <span className="gsi-material-button-icon h-5 w-5 shrink-0">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="block h-full w-full"
        aria-hidden="true"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
    </span>
    <span className="gsi-material-button-contents">{label}</span>
  </button>
);

function probeImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const timer = window.setTimeout(() => resolve(false), 7000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img.naturalWidth > 0);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}

export const DriveLogoSyncCard: React.FC<{ variant?: 'banner' | 'panel' }> = ({
  variant = 'panel',
}) => {
  const { customLogo, applyCustomLogo, resetCustomLogo, showToast } = useChurch();
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => !getDriveAccessToken());
  const [driveEmail, setDriveEmail] = useState<string | null>(
    () => getDriveCurrentUser()?.email ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [foundFiles, setFoundFiles] = useState<DriveFileMeta[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('Logo_GKI');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [driveLinkInput, setDriveLinkInput] = useState('');

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user) => {
        setNeedsAuth(false);
        setDriveEmail(user.email);
      },
      () => {
        setNeedsAuth(true);
        setDriveEmail(getDriveCurrentUser()?.email ?? null);
      }
    );
    return () => unsubscribe();
  }, []);

  const applyDriveFile = async (token: string, file: DriveFileMeta) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(`Mengunduh ${file.name} dari Google Drive...`);
    try {
      const dataUrl = await downloadDriveImageAsDataUrl(token, file.id);
      applyCustomLogo({
        dataUrl,
        fileName: file.name,
        driveFileId: file.id,
        source: 'drive',
        updatedAt: new Date().toLocaleString('id-ID'),
      });
      setStatusMessage(`Logo "${file.name}" aktif di seluruh halaman & ikon tab.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunduh file dari Google Drive.';
      setErrorMessage(msg);
      if (msg.includes('berakhir')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const syncLogoFromDriveWithToken = async (token: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Mencari Logo_GKI_Big.png di Google Drive...');
    try {
      const exactMatches = await findDriveFileByName(token, 'Logo_GKI_Big.png');
      if (exactMatches.length > 0) {
        setFoundFiles(exactMatches);
        await applyDriveFile(token, exactMatches[0]);
        return;
      }

      const fallbackMatches = await searchDriveImageFiles(token, 'Logo_GKI');
      const allLogoImages =
        fallbackMatches.length > 0 ? fallbackMatches : await searchDriveImageFiles(token, '');
      setFoundFiles(allLogoImages);

      if (allLogoImages.length === 0) {
        setStatusMessage(null);
        setErrorMessage(
          'File "Logo_GKI_Big.png" tidak ditemukan di My Drive akun ini. Pastikan file tersimpan di Google Drive Anda atau unggah manual.'
        );
      } else {
        setStatusMessage(
          `File persis "Logo_GKI_Big.png" belum ditemukan, ditemukan ${allLogoImages.length} file gambar di Drive. Pilih salah satu di bawah.`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membaca file dari Google Drive.';
      setErrorMessage(msg);
      setStatusMessage(null);
      if (msg.includes('berakhir')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const authResult = await googleSignInForDrive();
      if (!authResult) {
        // User closed/cancelled login popup; keep UI stable without error banner
        return;
      }
      setDriveEmail(authResult.user.email);
      setNeedsAuth(false);
      await syncLogoFromDriveWithToken(authResult.accessToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan Google.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDriveShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileId = extractGoogleDriveFileId(driveLinkInput);
    if (!fileId) {
      setErrorMessage(
        'Link atau ID Google Drive tidak valid. Contoh: https://drive.google.com/file/d/FILE_ID/view'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Memverifikasi gambar dari link Google Drive...');
    try {
      const candidates = getPublicDriveImageCandidates(fileId);
      let workingUrl: string | null = null;
      for (const candidate of candidates) {
        const ok = await probeImageUrl(candidate);
        if (ok) {
          workingUrl = candidate;
          break;
        }
      }

      if (!workingUrl) {
        setStatusMessage(null);
        setErrorMessage(
          'Gambar dari link Google Drive gagal dimuat. Pastikan akses file disetel ke "Siapa saja yang memiliki link" (Anyone with the link) atau pilih file PNG langsung dari perangkat.'
        );
        return;
      }

      applyCustomLogo({
        dataUrl: workingUrl,
        fileName: 'Logo_GKI_Big.png',
        driveFileId: fileId,
        source: 'drive',
        updatedAt: new Date().toLocaleString('id-ID'),
      });
      setStatusMessage('Logo dari link Google Drive berhasil diterapkan ke seluruh aplikasi.');
      setDriveLinkInput('');
      setShowLinkInput(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const files = await searchDriveImageFiles(token, searchKeyword);
      setFoundFiles(files);
      setStatusMessage(
        files.length > 0
          ? `Ditemukan ${files.length} file gambar di Google Drive.`
          : 'Tidak ada file gambar yang cocok dengan kata kunci tersebut.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mencari file di Drive.';
      setErrorMessage(msg);
      if (msg.includes('berakhir')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Pilih file gambar (.png, .jpg, .svg, atau .webp).');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const dataUrl = await blobToOptimizedLogoDataUrl(file);
      applyCustomLogo({
        dataUrl,
        fileName: file.name,
        source: 'upload',
        updatedAt: new Date().toLocaleString('id-ID'),
      });
      setStatusMessage(`Logo "${file.name}" berhasil diterapkan.`);
    } catch {
      setErrorMessage('Gagal memproses file gambar logo.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleSignOutDrive = async () => {
    await logoutDrive();
    setDriveEmail(null);
    setNeedsAuth(true);
    setFoundFiles([]);
    setStatusMessage(null);
    showToast('Koneksi Google Drive diputuskan.');
  };

  if (variant === 'banner') {
    if (customLogo || bannerDismissed) return null;

    return (
      <section
        aria-label="Sinkronisasi Logo GKI dari Google Drive"
        className="rounded-2xl bg-white dark:bg-[#2B170C] border border-[#D4AF37]/50 p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <ChurchLogo className="h-8 w-8" />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="font-display text-base font-bold text-[#9A3412] dark:text-white">
                Muat Logo_GKI_Big.png dari Google Drive
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Masuk dengan akun Google Anda agar aplikasi dapat mengambil file{' '}
                <strong className="font-mono-nums">Logo_GKI_Big.png</strong> dari My Drive, atau gunakan link share Google Drive / pilih file PNG langsung.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {needsAuth ? (
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                label={isLoading ? 'Mengambil Logo...' : 'Sign in with Google'}
              />
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  const token = getDriveAccessToken();
                  if (token) syncLogoFromDriveWithToken(token);
                }}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407] hover:opacity-95 disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Memuat...' : 'Ambil Logo_GKI_Big.png'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowLinkInput((prev) => !prev)}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 py-2 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] whitespace-nowrap"
            >
              <Link2 className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Link Drive</span>
            </button>

            <label className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 py-2 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] cursor-pointer whitespace-nowrap">
              <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Pilih File PNG</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLocalUpload}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Sembunyikan banner sementara"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showLinkInput && (
          <form
            onSubmit={handleApplyDriveShareLink}
            className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <input
              type="text"
              value={driveLinkInput}
              onChange={(e) => setDriveLinkInput(e.target.value)}
              placeholder="Tempel link Google Drive Logo_GKI_Big.png (https://drive.google.com/file/d/.../view)"
              className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isLoading || !driveLinkInput.trim()}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407] disabled:opacity-50 whitespace-nowrap"
            >
              <span>Terapkan Link</span>
            </button>
          </form>
        )}

        {errorMessage && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && !errorMessage && (
          <p className="text-xs font-medium text-[#9A3412] dark:text-[#E5C158]">
            {statusMessage}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-14 w-14 rounded-2xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0">
            <ChurchLogo className="h-11 w-11" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
              Logo Gereja · Google Drive
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {customLogo ? (
                <>
                  Aktif: <strong className="text-[#9A3412] dark:text-[#E5C158]">{customLogo.fileName}</strong>
                  {' · '}
                  {customLogo.source === 'drive' ? 'Google Drive' : 'Unggahan Lokal'}
                </>
              ) : (
                'Menggunakan ikon vektor bawaan · Hubungkan Google Drive untuk memuat Logo_GKI_Big.png'
              )}
            </p>
          </div>
        </div>

        {customLogo && (
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800/70 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors whitespace-nowrap self-start sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Logo Bawaan</span>
          </button>
        )}
      </div>

      {/* Status & Error Alerts */}
      {statusMessage && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Auth / Sync Controls */}
      <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 space-y-4">
        {needsAuth ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#9A3412] dark:text-white">
                Hubungkan Akun Google Drive
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Masuk dengan akun Google pemilik file <span className="font-mono-nums font-semibold">Logo_GKI_Big.png</span> untuk mengambil logo secara otomatis.
              </p>
            </div>
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              label={isLoading ? 'Menghubungkan...' : 'Sign in with Google'}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Terhubung dengan Google Drive:{' '}
                <strong className="text-[#9A3412] dark:text-[#E5C158]">
                  {driveEmail || 'Akun Google'}
                </strong>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    const token = getDriveAccessToken();
                    if (token) syncLogoFromDriveWithToken(token);
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-3.5 py-2 text-xs font-semibold text-white dark:text-[#431407] hover:opacity-95 disabled:opacity-60 whitespace-nowrap"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Sinkronkan Logo_GKI_Big.png</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOutDrive}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>
            </div>

            {/* Search Drive image files */}
            <form onSubmit={handleSearchDrive} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari nama file logo di My Drive (misal: Logo_GKI_Big)..."
                className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3.5 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#2B170C] px-4 py-2 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] whitespace-nowrap"
              >
                <FolderSearch className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Cari di Drive</span>
              </button>
            </form>

            {foundFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  File Gambar Ditemukan di Drive ({foundFiles.length})
                </p>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] overflow-hidden">
                  {foundFiles.map((file) => {
                    const isActive = customLogo?.driveFileId === file.id;
                    return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ImageIcon className="h-4 w-4 text-[#D4AF37] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#9A3412] dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-nums">
                              {file.mimeType}
                              {file.size ? ` · ${Math.max(1, Math.round(Number(file.size) / 1024))} KB` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => {
                            const token = getDriveAccessToken();
                            if (token) applyDriveFile(token, file);
                          }}
                          className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#9A3412] dark:bg-[#D4AF37] text-white dark:text-[#431407] hover:opacity-90'
                          }`}
                        >
                          {isActive ? 'Sedang Dipakai' : 'Gunakan Logo'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alternate Drive Share Link input */}
      <form onSubmit={handleApplyDriveShareLink} className="space-y-2">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          Alternatif Link Share Google Drive (jika pop-up login dibatasi browser):
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={driveLinkInput}
            onChange={(e) => setDriveLinkInput(e.target.value)}
            placeholder="https://drive.google.com/file/d/.../view"
            className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading || !driveLinkInput.trim()}
            className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1E1008] px-4 py-2 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] disabled:opacity-50 whitespace-nowrap"
          >
            <Link2 className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Muat dari Link</span>
          </button>
        </div>
      </form>

      {/* Fallback local file selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Atau pilih file <span className="font-mono-nums">Logo_GKI_Big.png</span> langsung dari perangkat Anda:
        </span>
        <label className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3.5 py-2 text-xs font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] cursor-pointer whitespace-nowrap">
          <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span>Pilih File PNG Lokal</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLocalUpload}
            className="sr-only"
          />
        </label>
      </div>

      {/* Custom Confirmation Modal before resetting active logo */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
              Kembalikan Logo Bawaan?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Tindakan ini akan menghapus logo aktif ({customLogo?.fileName}) dari tampilan seluruh halaman dan mengembalikan ikon salib bawaan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetCustomLogo();
                  setStatusMessage(null);
                  setConfirmResetOpen(false);
                }}
                className="min-h-[40px] rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Ya, Reset Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
