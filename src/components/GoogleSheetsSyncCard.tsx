import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudDownload,
  CloudUpload,
  ExternalLink,
  FileSpreadsheet,
  FolderSearch,
  Link2,
  LogOut,
  Plus,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import {
  DriveFileMeta,
  extractSpreadsheetId,
  getDriveAccessToken,
  getDriveCurrentUser,
  googleSignInForDrive,
  initDriveAuth,
  logoutDrive,
  searchDriveSpreadsheets,
} from '../utils/googleDriveAuth';
import {
  ALL_SYNC_TAB_TITLES,
  pullAllDataFromSpreadsheet,
  syncAllDataToSpreadsheet,
} from '../utils/googleSheetsSync';

const STORAGE_SHEET_CONFIG_KEY = 'gki_efata_google_sheet_config_v1';

interface SavedSheetConfig {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  lastSyncedAt?: string;
}

type PendingConfirmAction =
  | { type: 'push-create'; title: string }
  | { type: 'push-existing'; spreadsheetId: string; title: string }
  | { type: 'pull'; spreadsheetId: string; title: string };

function loadSavedSheetConfig(): SavedSheetConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_SHEET_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedSheetConfig>;
    if (parsed && typeof parsed.spreadsheetId === 'string' && parsed.spreadsheetId) {
      return {
        spreadsheetId: parsed.spreadsheetId,
        title: parsed.title || 'Portal Data GKI Efata Malanu',
        spreadsheetUrl:
          parsed.spreadsheetUrl ||
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(parsed.spreadsheetId)}/edit`,
        lastSyncedAt: parsed.lastSyncedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const GoogleSheetsSyncCard: React.FC = () => {
  const { data, applySyncedChurchData, showToast } = useChurch();
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => !getDriveAccessToken());
  const [googleEmail, setGoogleEmail] = useState<string | null>(
    () => getDriveCurrentUser()?.email ?? null
  );
  const [savedConfig, setSavedConfig] = useState<SavedSheetConfig | null>(loadSavedSheetConfig);
  const [sheetLinkInput, setSheetLinkInput] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('Portal Data GKI Efata Malanu');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [driveSheets, setDriveSheets] = useState<DriveFileMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<PendingConfirmAction | null>(null);

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user) => {
        setNeedsAuth(false);
        setGoogleEmail(user.email);
      },
      () => {
        setNeedsAuth(true);
        setGoogleEmail(getDriveCurrentUser()?.email ?? null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      if (savedConfig) {
        localStorage.setItem(STORAGE_SHEET_CONFIG_KEY, JSON.stringify(savedConfig));
      } else {
        localStorage.removeItem(STORAGE_SHEET_CONFIG_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [savedConfig]);

  const moduleCounts = [
    { label: 'Tata Ibadah', count: `${data.liturgy.steps.length} bagian` },
    { label: 'Jadwal Ibadah', count: `${data.schedules.length} jadwal` },
    { label: 'Warta & Doa', count: `${data.warta.pengumuman.length + data.warta.hutJemaat.length + data.warta.beritaDukaSakit.length} item` },
    { label: 'Nyanyian Rohani', count: `${data.hymns.length} lagu` },
    { label: 'Keuangan', count: `${data.finance.penerimaan.length + data.finance.pengeluaran.length} transaksi` },
    { label: 'Statistik & Majelis', count: `${data.statistics.rayonList.length} rayon · ${data.statistics.majelisJemaat.length} majelis` },
    { label: 'Galeri & Profil', count: `${data.gallery.length} foto · ${data.profile.rekeningList.length} rekening` },
    { label: 'Kunjungan Pastoral', count: 'Sheet Baru Kunjungan & Permohonan' },
  ];

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const result = await googleSignInForDrive();
      if (!result) {
        return;
      }
      setGoogleEmail(result.user.email);
      setNeedsAuth(false);
      setStatusMessage(
        'Akun Google terhubung. Pilih spreadsheet yang ada atau buat spreadsheet baru untuk menyinkronkan seluruh data.'
      );
      const existingSheets = await searchDriveSpreadsheets(result.accessToken, '').catch(() => []);
      setDriveSheets(existingSheets);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutDrive();
    setNeedsAuth(true);
    setGoogleEmail(null);
    setDriveSheets([]);
    setStatusMessage(null);
    showToast('Koneksi Google Sheets diputuskan.');
  };

  const handleSearchSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const files = await searchDriveSpreadsheets(token, searchKeyword);
      setDriveSheets(files);
      setStatusMessage(
        files.length > 0
          ? `Ditemukan ${files.length} spreadsheet di Google Drive.`
          : 'Tidak ada spreadsheet yang cocok di Google Drive.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mencari spreadsheet di Google Drive.';
      setErrorMessage(msg);
      if (msg.includes('berakhir')) setNeedsAuth(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseLink = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSpreadsheetId(sheetLinkInput);
    if (!id) {
      setErrorMessage(
        'Link atau ID Google Sheet tidak valid. Contoh: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit'
      );
      return;
    }
    setErrorMessage(null);
    setSavedConfig({
      spreadsheetId: id,
      title: 'Google Sheet Terhubung',
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/edit`,
    });
    setSheetLinkInput('');
    setStatusMessage('Target Google Sheet diperbarui. Tekan Sinkronkan untuk menulis data atau Tarik Data.');
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);

    const token = getDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setErrorMessage('Sesi Google belum aktif. Silakan masuk terlebih dahulu dengan Google.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (action.type === 'push-create' || action.type === 'push-existing') {
        setStatusMessage(
          action.type === 'push-create'
            ? `Membuat spreadsheet "${action.title}" dan menulis 9 tab data...`
            : `Menyinkronkan seluruh data portal ke "${action.title}"...`
        );

        const result = await syncAllDataToSpreadsheet(token, data, {
          spreadsheetId: action.type === 'push-existing' ? action.spreadsheetId : undefined,
          newSpreadsheetTitle: action.type === 'push-create' ? action.title : undefined,
        });

        setSavedConfig({
          spreadsheetId: result.spreadsheetId,
          title: result.title,
          spreadsheetUrl: result.spreadsheetUrl,
          lastSyncedAt: result.syncedAt,
        });

        const msg = `Berhasil menyinkronkan ${result.totalRows} baris ke ${result.tabsUpdated} tab di "${result.title}".`;
        setStatusMessage(msg);
        showToast(msg, { title: 'Google Sheets Tersinkron', variant: 'success' });
      } else if (action.type === 'pull') {
        setStatusMessage(`Mengambil data dari "${action.title}"...`);
        const pullResult = await pullAllDataFromSpreadsheet(token, action.spreadsheetId, data);
        const nowText = new Date().toLocaleString('id-ID');
        setSavedConfig({
          spreadsheetId: pullResult.spreadsheetId,
          title: pullResult.title,
          spreadsheetUrl: pullResult.spreadsheetUrl,
          lastSyncedAt: nowText,
        });

        const summaryMsg = `Data diperbarui dari "${pullResult.title}" (${pullResult.summary.liturgySteps} liturgi, ${pullResult.summary.schedules} jadwal, ${pullResult.summary.announcements} warta, ${pullResult.summary.hymns} nyanyian).`;
        applySyncedChurchData(pullResult.updatedData, summaryMsg);
        setStatusMessage(summaryMsg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal berkomunikasi dengan Google Sheets.';
      setErrorMessage(msg);
      setStatusMessage(null);
      if (msg.includes('berakhir')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="google-sheets-sync-heading"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#C2410C]/10 dark:bg-[#3F2111] text-[#9A3412] dark:text-[#E5C158] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="google-sheets-sync-heading"
              className="font-display text-lg sm:text-xl font-bold text-[#9A3412] dark:text-white"
            >
              Sinkronisasi Data ke Google Sheets
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              Ekspor dan perbarui seluruh data portal gereja (9 lembar kerja) ke Google Sheets atau tarik pembaruan langsung dari spreadsheet.
            </p>
          </div>
        </div>

        {savedConfig?.spreadsheetUrl && (
          <a
            href={savedConfig.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 py-2 text-xs font-semibold text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] whitespace-nowrap self-start sm:self-center"
          >
            <span>Buka Google Sheet</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Data Coverage Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {moduleCounts.map((m) => (
          <div
            key={m.label}
            className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200/70 dark:border-slate-800 p-2.5"
          >
            <p className="text-[11px] font-semibold text-[#9A3412] dark:text-[#E5C158] truncate">
              {m.label}
            </p>
            <p className="font-mono-nums text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
              {m.count}
            </p>
          </div>
        ))}
      </div>

      {/* Status & Errors */}
      {statusMessage && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Auth / Workspace Controls */}
      {needsAuth ? (
        <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#9A3412] dark:text-white">
              Masuk dengan Google untuk Sinkronisasi Spreadsheet
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hubungkan akun Google Anda agar dapat membuat spreadsheet baru, menulis 9 tab data gereja, dan menarik pembaruan dari Google Sheets.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="gsi-material-button inline-flex items-center justify-center gap-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
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
            <span className="gsi-material-button-contents">
              {isLoading ? 'Menghubungkan...' : 'Sign in with Google'}
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Account Bar */}
          <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
              <p>
                Terhubung sebagai:{' '}
                <strong className="text-[#9A3412] dark:text-[#E5C158]">
                  {googleEmail || 'Akun Google'}
                </strong>
              </p>
              {savedConfig && (
                <p className="font-mono-nums text-[11px] text-slate-500 dark:text-slate-400">
                  Target aktif: <strong>{savedConfig.title}</strong> ({savedConfig.spreadsheetId})
                  {savedConfig.lastSyncedAt ? ` · Terakhir: ${savedConfig.lastSyncedAt}` : ''}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap self-start sm:self-center"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Putuskan Akun</span>
            </button>
          </div>

          {/* Primary Sync Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Sync to Active Sheet or Pull */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#9A3412] dark:text-white">
                {savedConfig ? 'Sinkronisasi Dua Arah (Sheet Aktif)' : 'Target Spreadsheet'}
              </h3>
              {savedConfig ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Menulis ulang 9 tab di <strong>{savedConfig.title}</strong> dengan data terbaru dari aplikasi, atau menarik isi Google Sheet kembali ke aplikasi.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        setConfirmAction({
                          type: 'push-existing',
                          spreadsheetId: savedConfig.spreadsheetId,
                          title: savedConfig.title,
                        })
                      }
                      className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407] hover:opacity-95 disabled:opacity-60 whitespace-nowrap"
                    >
                      <CloudUpload className="h-4 w-4" />
                      <span>Sinkronkan Semua Data ke Sheet</span>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        setConfirmAction({
                          type: 'pull',
                          spreadsheetId: savedConfig.spreadsheetId,
                          title: savedConfig.title,
                        })
                      }
                      className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3.5 py-2 text-xs font-semibold text-[#9A3412] dark:text-[#E5C158] hover:border-[#9A3412] dark:hover:border-[#D4AF37] disabled:opacity-60 whitespace-nowrap"
                    >
                      <CloudDownload className="h-4 w-4" />
                      <span>Tarik Data dari Sheet</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Belum ada Google Sheet yang dipilih. Buat spreadsheet baru di sebelah kanan atau pilih dari Drive / tempel link spreadsheet di bawah.
                </p>
              )}
            </div>

            {/* Option B: Create New Spreadsheet */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#9A3412] dark:text-white">
                Buat Google Sheet Baru &amp; Sinkronkan
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Nama Spreadsheet baru..."
                  className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    setConfirmAction({
                      type: 'push-create',
                      title: newSheetTitle.trim() || 'Portal Data GKI Efata Malanu',
                    })
                  }
                  className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#431407] hover:bg-[#e1be49] disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat &amp; Sinkronkan</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Otomatis membuat 9 tab terstruktur: {ALL_SYNC_TAB_TITLES.slice(0, 4).join(', ')}, dll.
              </p>
            </div>
          </div>

          {/* Link Existing Spreadsheet by URL or Drive Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <form onSubmit={handleUseLink} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Hubungkan via Link atau ID Google Sheet:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetLinkInput}
                  onChange={(e) => setSheetLinkInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!sheetLinkInput.trim()}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3.5 text-xs font-semibold text-[#9A3412] dark:text-slate-100 disabled:opacity-50 whitespace-nowrap"
                >
                  <Link2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Pilih Sheet</span>
                </button>
              </div>
            </form>

            <form onSubmit={handleSearchSheets} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Cari Spreadsheet di Google Drive Anda:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Cari nama spreadsheet (kosongkan untuk semua)..."
                  className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3.5 text-xs font-semibold text-[#9A3412] dark:text-slate-100 whitespace-nowrap"
                >
                  <FolderSearch className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Cari</span>
                </button>
              </div>
            </form>
          </div>

          {driveSheets.length > 0 && (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#FAF2E8] dark:bg-[#1E1008] overflow-hidden max-h-56 overflow-y-auto">
              {driveSheets.map((file) => {
                const isSelected = savedConfig?.spreadsheetId === file.id;
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#9A3412] dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="font-mono-nums text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        ID: {file.id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSavedConfig({
                          spreadsheetId: file.id,
                          title: file.name,
                          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${encodeURIComponent(file.id)}/edit`,
                        });
                        setStatusMessage(`Spreadsheet "${file.name}" dipilih sebagai target sinkronisasi.`);
                      }}
                      className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#9A3412] dark:bg-[#D4AF37] text-white dark:text-[#431407]'
                      }`}
                    >
                      {isSelected ? 'Target Aktif' : 'Pilih'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mandatory Confirmation Dialog Before Mutating User Data */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheets-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <h3
              id="sheets-confirm-title"
              className="font-display text-lg font-bold text-[#9A3412] dark:text-white"
            >
              {confirmAction.type === 'pull'
                ? 'Konfirmasi Tarik Data dari Google Sheet'
                : confirmAction.type === 'push-create'
                  ? 'Konfirmasi Buat & Sinkronkan Google Sheet'
                  : 'Konfirmasi Pembaruan Google Sheet'}
            </h3>

            {confirmAction.type === 'pull' ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tindakan ini akan membaca data dari spreadsheet{' '}
                <strong>{confirmAction.title}</strong> dan menimpa data lokal aplikasi (Tata Ibadah, Jadwal, Warta Jemaat, Nyanyian, Keuangan, Statistik, Galeri, dan Profil).
              </p>
            ) : (
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  {confirmAction.type === 'push-create' ? (
                    <>
                      Aplikasi akan membuat spreadsheet baru bernama{' '}
                      <strong>{confirmAction.title}</strong> di Google Drive Anda dan menulis seluruh 9 lembar kerja data portal.
                    </>
                  ) : (
                    <>
                      Aplikasi akan menghapus isi lama dan menulis ulang 9 lembar kerja pada spreadsheet{' '}
                      <strong>{confirmAction.title}</strong> dengan seluruh data portal saat ini.
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mencakup: {ALL_SYNC_TAB_TITLES.join(', ')}. (Kata sandi akun admin tidak pernah diekspor).
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="min-h-[40px] rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407] hover:opacity-95"
              >
                {confirmAction.type === 'pull'
                  ? 'Ya, Muat Data ke Aplikasi'
                  : 'Ya, Sinkronkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
