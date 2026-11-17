import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { ScheduleItem } from '../types/church';
import {
  AttendanceRecord,
  getOrCreateDeviceUuid,
  loadStoredAttendanceLogs,
  saveStoredAttendanceLogs,
  appendAttendanceToGoogleSheet,
} from '../utils/attendanceSync';
import { getDriveAccessToken } from '../utils/googleDriveAuth';

interface AttendanceScannerModalProps {
  open: boolean;
  onClose: () => void;
  defaultSchedule?: ScheduleItem | null;
}

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
  open,
  onClose,
  defaultSchedule,
}) => {
  const { data, showToast } = useChurch();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>(loadStoredAttendanceLogs);
  const [checkedInSchedule, setCheckedInSchedule] = useState<ScheduleItem | null>(null);
  const [syncingSheet, setSyncingSheet] = useState(false);

  useEffect(() => {
    saveStoredAttendanceLogs(logs);
  }, [logs]);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleSuccessfulCheckIn = async (targetSchedule: ScheduleItem) => {
    stopCamera();
    setCheckedInSchedule(targetSchedule);

    const nowText = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    const deviceUuid = getOrCreateDeviceUuid();

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      scheduleId: targetSchedule.id,
      scheduleTitle: targetSchedule.judul,
      hariTanggal: targetSchedule.hariTanggal,
      waktu: targetSchedule.waktu,
      tempat: targetSchedule.tempat,
      scannedAt: nowText,
      deviceUuid,
    };

    setLogs((prev) => [record, ...prev]);

    // Attempt real-time Google Sheets sync if connected
    const token = getDriveAccessToken();
    let syncedToSheet = false;
    if (token) {
      try {
        setSyncingSheet(true);
        const configRaw = localStorage.getItem('gki_efata_google_sheet_config_v1');
        const config = configRaw ? JSON.parse(configRaw) : null;
        if (config?.spreadsheetId) {
          syncedToSheet = await appendAttendanceToGoogleSheet(
            token,
            config.spreadsheetId,
            record
          );
        }
      } catch {
        // Fallback silently if offline or token expired
      } finally {
        setSyncingSheet(false);
      }
    }

    showToast(
      syncedToSheet
        ? `Presensi "${targetSchedule.judul}" berhasil dicatat ke perangkat & Google Sheets!`
        : `Presensi "${targetSchedule.judul}" berhasil dicatat di perangkat (tersimpan offline).`,
      {
        title: 'Check-In Ibadah Sukses',
        variant: 'success',
      }
    );
  };

  const startCamera = async () => {
    setCameraError(null);
    setCheckedInSchedule(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Kamera tidak didukung oleh peramban ini.');
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      scanTimerRef.current = window.setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
          return;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (result?.data) {
          const raw = result.data.trim();
          // Match schedule id or checkin url
          const matchedSch =
            data.schedules.find((s) => raw.includes(s.id) || raw.includes(s.judul)) ||
            defaultSchedule ||
            data.schedules[0];
          if (matchedSch) {
            handleSuccessfulCheckIn(matchedSch);
          }
        }
      }, 200);
    } catch {
      stopCamera();
      setCameraError('Izin kamera ditolak atau tidak tersedia.');
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    startCamera();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopCamera();
    };
  }, [open, onClose]);

  const clearLogs = () => {
    setLogs([]);
    try {
      localStorage.removeItem('gki_efata_attendance_logs_v1');
    } catch {
      // Ignore
    }
    showToast('Riwayat presensi dibersihkan.');
  };

  if (!open) return null;

  const targetForManualCheckIn = defaultSchedule || data.schedules[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-scanner-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#9A3412] text-[#D4AF37] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="attendance-scanner-title"
                className="font-display text-lg font-bold text-[#9A3412] dark:text-white leading-tight"
              >
                Scan Presensi Kehadiran Ibadah
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pindai QR pintu masuk gereja untuk mencatat kehadiran ke Google Sheets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemindai"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {!checkedInSchedule ? (
            <div className="space-y-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#180D07] border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`h-full w-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {cameraActive ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-44 w-44 rounded-2xl border-2 border-[#D4AF37] shadow-[0_0_0_9999px_rgba(9,19,34,0.45)]" />
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-3 max-w-xs">
                    <CameraOff className="h-8 w-8 text-[#D4AF37] mx-auto" />
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {cameraError || 'Mengaktifkan kamera perangkat...'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#431407] hover:bg-[#e1be49] transition-colors whitespace-nowrap"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Coba Nyalakan Kamera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick simulation for testing without physical QR */}
              {targetForManualCheckIn && (
                <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#9A3412] dark:text-[#E5C158]">
                      Simulasi Check-In Cepat:
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {targetForManualCheckIn.judul}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSuccessfulCheckIn(targetForManualCheckIn)}
                    className="min-h-[38px] rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-1.5 text-xs font-bold text-white dark:text-[#431407] hover:opacity-95 whitespace-nowrap shrink-0"
                  >
                    Check-In Sekarang
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 space-y-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Presensi Berhasil Dicatat
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {checkedInSchedule.judul}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {checkedInSchedule.hariTanggal} · {checkedInSchedule.waktu}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tempat: {checkedInSchedule.tempat}
                </p>
              </div>

              {syncingSheet && (
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 animate-pulse">
                  Menyinkronkan presensi secara real-time ke Google Sheets...
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCheckedInSchedule(null);
                    startCamera();
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white dark:text-[#431407]"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Scan Presensi Lain</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Riwayat Presensi Perangkat (<span className="font-mono-nums">{logs.length}</span>)
                </p>
                <button
                  type="button"
                  onClick={clearLogs}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto pr-1">
                {logs.map((item) => (
                  <li key={item.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#9A3412] dark:text-white truncate">
                        {item.scheduleTitle}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 truncate">{item.tempat}</p>
                    </div>
                    <span className="font-mono-nums text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                      {item.scannedAt}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
