import React, { useEffect, useState } from 'react';
import { Send, Sparkles, User, MessageCircle, Heart } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

export interface PrayerRequestItem {
  id: string;
  nama: string; // anonim / nama opsional
  kategori: 'Syukur' | 'Kesehatan' | 'Keluarga' | 'Pekerjaan / Studi' | 'Pergumulan Umum';
  isiPermohonan: string;
  tanggal: string;
  timestamp: number;
}

export const STORAGE_PRAYER_REQUESTS_KEY = 'gki_efata_prayer_requests_v1';

export function loadStoredPrayerRequests(): PrayerRequestItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_PRAYER_REQUESTS_KEY);
    if (!raw) {
      return [
        {
          id: 'pr-1',
          nama: 'Hamba Tuhan (Anonim)',
          kategori: 'Kesehatan',
          isiPermohonan: 'Mohon dukungan doa bagi pemulihan kesehatan jemaat lanjut usia di Rayon 2 yang sedang sakit.',
          tanggal: '15 November 2026',
          timestamp: Date.now() - 3600000 * 4,
        },
        {
          id: 'pr-2',
          nama: 'Keluarga Jemaat',
          kategori: 'Pekerjaan / Studi',
          isiPermohonan: 'Doa syafaat untuk anak-anak muda GKI Efata Malanu yang sedang menghadapi ujian akhir sekolah dan pencarian pekerjaan.',
          tanggal: '15 November 2026',
          timestamp: Date.now() - 3600000 * 12,
        },
      ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredPrayerRequests(items: PrayerRequestItem[]): void {
  try {
    localStorage.setItem(STORAGE_PRAYER_REQUESTS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export const PrayerInboxCard: React.FC = () => {
  const { showToast } = useChurch();
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState<PrayerRequestItem['kategori']>('Pergumulan Umum');
  const [isiPermohonan, setIsIsiPermohonan] = useState('');
  const [isAnonim, setIsAnonim] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentPrayers, setRecentPrayers] = useState<PrayerRequestItem[]>(loadStoredPrayerRequests);

  useEffect(() => {
    saveStoredPrayerRequests(recentPrayers);
  }, [recentPrayers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = isiPermohonan.trim();
    if (!cleanContent) {
      showToast('Silakan tuliskan pokok permohonan doa Anda terlebih dahulu.', {
        title: 'Form Kosong',
        variant: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const authorName = isAnonim || !nama.trim() ? 'Jemaat (Anonim)' : nama.trim();
      const newItem: PrayerRequestItem = {
        id: `pr-${Date.now()}`,
        nama: authorName,
        kategori,
        isiPermohonan: cleanContent,
        tanggal: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        timestamp: Date.now(),
      };

      const updated = [newItem, ...recentPrayers];
      setRecentPrayers(updated);
      saveStoredPrayerRequests(updated);

      // Also trigger a custom event so admin / other instances sync instantly
      window.dispatchEvent(
        new CustomEvent('gki-efata-prayer-submitted', { detail: newItem })
      );

      setIsIsiPermohonan('');
      setNama('');
      showToast(
        'Permohonan doa Anda telah dikirimkan secara anonim ke Kotak Doa Majelis GKI Efata Malanu dan akan didoakan dalam persekutuan.',
        {
          title: 'Permohonan Doa Diterima',
          variant: 'success',
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="kotak-doa-heading"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5"
    >
      <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="h-11 w-11 rounded-xl bg-[#C2410C]/12 dark:bg-[#D4AF37]/15 text-[#9A3412] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
          <Heart className="h-6 w-6 fill-current" />
        </div>
        <div>
          <h2
            id="kotak-doa-heading"
            className="font-display text-xl font-bold text-[#9A3412] dark:text-white"
          >
            Kotak Masuk Doa Jemaat
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            Sampaikan pokok permohonan doa, syukur, atau pergumulan Anda. Majelis Jemaat dan Pelayan Firman GKI Efata Malanu siap mendoakannya. Dikirim secara anonim dan aman.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="prayer-category"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Kategori Pergumulan Doa
            </label>
            <select
              id="prayer-category"
              value={kategori}
              onChange={(e) => setKategori(e.target.value as PrayerRequestItem['kategori'])}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-2 focus:outline-[#9A3412]"
            >
              <option value="Pergumulan Umum">Pergumulan Umum / Syafaat</option>
              <option value="Kesehatan">Kesehatan & Pemulihan</option>
              <option value="Keluarga">Keluarga & Rumah Tangga</option>
              <option value="Pekerjaan / Studi">Pekerjaan, Usaha & Studi</option>
              <option value="Syukur">Ucapan Syukur Berkat Tuhan</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="prayer-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Nama Jemaat / Pengirim (Opsional)
            </label>
            <div className="relative">
              <input
                id="prayer-name"
                type="text"
                disabled={isAnonim}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder={isAnonim ? 'Dikirim secara anonim' : 'Contoh: Keluarga Bpk. Mayor'}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 py-2 pl-9 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-50 focus:outline-2 focus:outline-[#9A3412]"
              />
              <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="checkbox-anonim"
            type="checkbox"
            checked={isAnonim}
            onChange={(e) => setIsAnonim(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#9A3412] focus:ring-[#9A3412]"
          />
          <label
            htmlFor="checkbox-anonim"
            className="text-xs font-medium text-slate-600 dark:text-slate-300 select-none cursor-pointer"
          >
            Kirim sebagai Anonim (Nama disembunyikan dan dicatat sebagai Jemaat GKI Efata)
          </label>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="prayer-content"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Pokok Permohonan Doa / Syafaat <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="prayer-content"
            rows={3}
            required
            value={isiPermohonan}
            onChange={(e) => setIsIsiPermohonan(e.target.value)}
            placeholder="Tuliskan pokok doa, pergumulan, atau ucapan syukur Anda di sini..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-2 focus:outline-[#9A3412]"
          />
        </div>

        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            🔒 Dijaga kerahasiaannya dan langsung masuk ke dashboard Majelis untuk pelayanan doa syafaat.
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white dark:text-[#431407] hover:opacity-95 disabled:opacity-60 transition-opacity whitespace-nowrap shadow-xs"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Mengirim Doa...' : 'Kirim Permohonan Doa'}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
