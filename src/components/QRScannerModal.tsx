import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImageUp,
  QrCode,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { PageId } from '../types/church';

const STORAGE_CHECKINS_KEY = 'gki_efata_checkins_v1';

interface CheckInRecord {
  id: string;
  title: string;
  location: string;
  timestamp: string;
}

type DecodedAction =
  | {
      kind: 'checkin';
      title: string;
      location: string;
      raw: string;
    }
  | {
      kind: 'page';
      page: PageId;
      label: string;
      raw: string;
    }
  | {
      kind: 'url';
      href: string;
      raw: string;
    }
  | {
      kind: 'notice';
      raw: string;
    };

const PAGE_LABELS: Record<PageId, string> = {
  beranda: 'Beranda',
  'tata-ibadah': 'Tata Ibadah Minggu',
  jadwal: 'Jadwal Ibadah & Rayon',
  warta: 'Warta Jemaat',
  nyanyian: 'Nyanyian Rohani & KJ',
  alkitab: 'Alkitab',
  layanan: 'Layanan Jemaat',
  pastoral: 'Layanan Pastoral',
  keuangan: 'Laporan Keuangan',
  statistik: 'Data & Statistik',
  profil: 'Profil & Kontak',
  login: 'Login Pengurus',
  admin: 'Dashboard Admin',
};

function loadCheckIns(): CheckInRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHECKINS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as CheckInRecord[]) : [];
  } catch {
    return [];
  }
}

function parseChurchQrPayload(rawData: string): DecodedAction {
  const trimmed = rawData.trim();

  // 1. JSON payload: { "type": "checkin", "title": "...", "location": "..." }
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as {
        type?: string;
        title?: string;
        ibadah?: string;
        location?: string;
        page?: PageId;
      };
      if (obj.type === 'checkin') {
        return {
          kind: 'checkin',
          title: obj.title || obj.ibadah || 'Ibadah Jemaat GKI Efata Malanu',
          location: obj.location || 'Gedung Gereja GKI Efata Malanu',
          raw: trimmed,
        };
      }
      if (obj.page && obj.page in PAGE_LABELS) {
        return {
          kind: 'page',
          page: obj.page,
          label: PAGE_LABELS[obj.page],
          raw: trimmed,
        };
      }
    } catch {
      // Fall through to string parsing
    }
  }

  // 2. Custom efata://checkin?ibadah=...&lokasi=...
  if (trimmed.toLowerCase().startsWith('efata://checkin')) {
    try {
      const queryPart = trimmed.split('?')[1] || '';
      const params = new URLSearchParams(queryPart);
      return {
        kind: 'checkin',
        title: params.get('ibadah') || params.get('title') || 'Ibadah Minggu GKI Efata Malanu',
        location: params.get('lokasi') || params.get('rayon') || 'Gedung Gereja Efata Malanu',
        raw: trimmed,
      };
    } catch {
      return {
        kind: 'checkin',
        title: 'Ibadah Jemaat GKI Efata Malanu',
        location: 'Gedung Gereja Efata Malanu',
        raw: trimmed,
      };
    }
  }

  // 3. Portal path or URL pointing to an internal page (e.g. /tata-ibadah, /warta, https://.../jadwal)
  try {
    if (trimmed.startsWith('/')) {
      const slug = trimmed.replace(/^\/+|\/+$/g, '') as PageId;
      if (slug in PAGE_LABELS) {
        return {
          kind: 'page',
          page: slug,
          label: PAGE_LABELS[slug],
          raw: trimmed,
        };
      }
    }
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const queryPage = url.searchParams.get('page') as PageId | null;
      if (queryPage && queryPage in PAGE_LABELS) {
        return {
          kind: 'page',
          page: queryPage,
          label: PAGE_LABELS[queryPage],
          raw: trimmed,
        };
      }
      const slug = url.pathname.replace(/^\/+|\/+$/g, '') as PageId;
      if (
        slug &&
        slug in PAGE_LABELS &&
        (typeof window === 'undefined' || url.origin === window.location.origin || url.hostname.includes('efata'))
      ) {
        return {
          kind: 'page',
          page: slug,
          label: PAGE_LABELS[slug],
          raw: trimmed,
        };
      }
      return {
        kind: 'url',
        href: url.toString(),
        raw: trimmed,
      };
    }
  } catch {
    // Fall through
  }

  // 4. Plain text check-in keywords
  if (/\b(check[\s-]?in|hadir|ibadah)\b/i.test(trimmed) && trimmed.length < 140) {
    return {
      kind: 'checkin',
      title: trimmed,
      location: 'GKI Efata Malanu — Klasis Sorong',
      raw: trimmed,
    };
  }

  return {
    kind: 'notice',
    raw: trimmed,
  };
}

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ open, onClose }) => {
  const { navigate, showToast } = useChurch();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedAction | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(loadCheckIns);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const handleDecodedRaw = useCallback(
    (rawValue: string) => {
      stopCamera();
      const parsed = parseChurchQrPayload(rawValue);
      setDecoded(parsed);

      if (parsed.kind === 'checkin') {
        const entry: CheckInRecord = {
          id: `ci-${Date.now()}`,
          title: parsed.title,
          location: parsed.location,
          timestamp: new Date().toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setCheckIns((prev) => {
          const updated = [entry, ...prev].slice(0, 6);
          try {
            localStorage.setItem(STORAGE_CHECKINS_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage quota errors
          }
          return updated;
        });
        showToast(`Kehadiran tercatat untuk ${parsed.title}.`, {
          title: 'Check-In Berhasil',
          variant: 'success',
        });
      } else {
        showToast('Kode QR berhasil dipindai.', {
          title: 'QR Terbaca',
          variant: 'success',
        });
      }
    },
    [showToast, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setDecoded(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Browser atau perangkat ini tidak mendukung akses kamera langsung. Gunakan tombol Unggah Gambar QR di bawah.'
      );
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
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (result?.data) {
          handleDecodedRaw(result.data);
        }
      }, 180);
    } catch {
      stopCamera();
      setCameraError(
        'Izin kamera ditolak atau kamera sedang tidak tersedia. Anda tetap dapat mengunggah foto/screenshot QR di bawah.'
      );
    }
  }, [handleDecodedRaw, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    startCamera();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopCamera();
    };
  }, [open, onClose, startCamera, stopCamera]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code?.data) {
          handleDecodedRaw(code.data);
        } else {
          showToast('Tidak ditemukan kode QR yang terbaca pada gambar tersebut.', {
            title: 'QR Tidak Terdeteksi',
            variant: 'warning',
          });
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearCheckIns = () => {
    setCheckIns([]);
    try {
      localStorage.removeItem(STORAGE_CHECKINS_KEY);
    } catch {
      // Ignore
    }
    showToast('Riwayat check-in pada perangkat ini dihapus.');
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
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
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="qr-scanner-title"
                className="font-display text-lg font-bold text-[#9A3412] dark:text-white leading-tight"
              >
                Scan QR Check-In & Warta
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pindai QR di pintu masuk gereja atau papan pengumuman
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemindai QR"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Scanner Viewport or Decoded Result */}
          {!decoded ? (
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

              {/* Upload QR Image Fallback + Quick Sample Test */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-4 py-2 text-xs sm:text-sm font-semibold text-[#9A3412] dark:text-slate-100 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap"
                >
                  <ImageUp className="h-4 w-4 text-[#D4AF37]" />
                  <span>Unggah Gambar / Foto QR</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Uji cepat:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleDecodedRaw(
                        'efata://checkin?ibadah=Ibadah+Minggu+Pagi&lokasi=Gedung+Gereja+Efata+Malanu'
                      )
                    }
                    className="font-semibold text-[#9A3412] dark:text-[#E5C158] hover:underline whitespace-nowrap"
                  >
                    QR Check-In
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => handleDecodedRaw('/warta')}
                    className="font-semibold text-[#9A3412] dark:text-[#E5C158] hover:underline whitespace-nowrap"
                  >
                    QR Warta
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {decoded.kind === 'checkin'
                      ? 'Check-In Kehadiran Jemaat Tercatat'
                      : decoded.kind === 'page'
                      ? 'Tautan Halaman Portal Gereja'
                      : decoded.kind === 'url'
                      ? 'Tautan Eksternal Terdeteksi'
                      : 'Informasi Pengumuman Gereja'}
                  </p>
                  <h3 className="text-base font-bold text-[#9A3412] dark:text-white break-words">
                    {decoded.kind === 'checkin'
                      ? decoded.title
                      : decoded.kind === 'page'
                      ? decoded.label
                      : decoded.kind === 'url'
                      ? decoded.href
                      : decoded.raw}
                  </h3>
                  {decoded.kind === 'checkin' && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Lokasi: {decoded.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {decoded.kind === 'page' && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate(decoded.page);
                      onClose();
                    }}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap"
                  >
                    <span>Buka {decoded.label}</span>
                  </button>
                )}

                {decoded.kind === 'url' && (
                  <a
                    href={decoded.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Buka Tautan</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(decoded.raw);
                    showToast('Isi kode QR disalin ke clipboard.');
                  }}
                  className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#9A3412] transition-colors whitespace-nowrap"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3.5 py-2 text-xs font-semibold text-[#9A3412] dark:text-[#D4AF37] hover:border-[#D4AF37] transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Pindai Lagi</span>
                </button>
              </div>
            </div>
          )}

          {/* Riwayat Check-In Perangkat */}
          {checkIns.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Riwayat Check-In Terbaru (<span className="font-mono-nums">{checkIns.length}</span>)
                </p>
                <button
                  type="button"
                  onClick={clearCheckIns}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {checkIns.slice(0, 3).map((ci) => (
                  <li key={ci.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#9A3412] dark:text-white truncate">
                        {ci.title}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 truncate">{ci.location}</p>
                    </div>
                    <span className="font-mono-nums text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                      {ci.timestamp}
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
