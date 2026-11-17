import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Navigation, QrCode, UserCheck } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ScheduleCategory } from '../../types/church';
import { AddToCalendarMenu } from '../AddToCalendarMenu';
import { AttendanceScannerModal } from '../AttendanceScannerModal';
import { DailyReminderCard } from '../DailyReminderCard';
import { MonthlyCalendarView } from '../MonthlyCalendarView';
import { ShareActions } from '../ShareButton';

export const JadwalPage: React.FC = () => {
  const { data } = useChurch();
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | ScheduleCategory>('Semua');
  const [rayonFilter, setRayonFilter] = useState<'Semua' | 1 | 2 | 3 | 4 | 5>('Semua');
  const [selectedId, setSelectedId] = useState<string>(data.schedules[0]?.id || '');
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return data.schedules.filter((item) => {
      if (categoryFilter !== 'Semua' && item.kategori !== categoryFilter) return false;
      if (rayonFilter !== 'Semua') {
        if (item.kategori !== 'Rayon' || item.rayon !== rayonFilter) return false;
      }
      return true;
    });
  }, [data.schedules, categoryFilter, rayonFilter]);

  const activeItem =
    filtered.find((s) => s.id === selectedId) || filtered[0] || null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const jadwalUrl = `${origin}/jadwal`;

  const activeFilterLabel =
    rayonFilter !== 'Semua'
      ? `Rayon ${rayonFilter}`
      : categoryFilter !== 'Semua'
      ? `Kategori ${categoryFilter}`
      : 'Semua Ibadah';

  const listShareText = [
    `*JADWAL IBADAH GKI EFATA MALANU (${activeFilterLabel})*`,
    '',
    filtered.length > 0
      ? filtered
          .slice(0, 6)
          .map(
            (s, i) =>
              `${i + 1}. *${s.judul}*\n   ${s.hariTanggal} · ${s.waktu} · ${s.tempat}`
          )
          .join('\n')
      : 'Belum ada jadwal untuk filter ini.',
    '',
    `Lihat detail lokasi & Google Maps di Portal Jemaat:`,
  ].join('\n');

  const activeItemShareText = activeItem
    ? [
        `*JADWAL IBADAH GKI EFATA MALANU*`,
        `*${activeItem.judul}*`,
        `Hari/Tgl: ${activeItem.hariTanggal}`,
        `Waktu: ${activeItem.waktu}`,
        `Tempat: ${activeItem.tempat} (${activeItem.alamat})`,
        `Pemimpin/Pelayan: ${activeItem.pemimpin}`,
        activeItem.catatan ? `Catatan: ${activeItem.catatan}` : '',
        `Google Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          activeItem.mapsQuery
        )}`,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
            Jadwal Ibadah & Rayon / KSP
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Ibadah Minggu, Unsur (PKB, PW, PAM, PAR), serta Persekutuan Rayon 1–5 di Malanu.
          </p>
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAttendanceModalOpen(true)}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-[#9A3412] dark:bg-[#D4AF37] px-3.5 py-1 text-xs font-bold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              <QrCode className="h-4 w-4 shrink-0" />
              <span>Scan QR Presensi Kehadiran</span>
            </button>
            <ShareActions
              compact
              title={`Jadwal Ibadah GKI Efata Malanu — ${activeFilterLabel}`}
              text={listShareText}
              url={jadwalUrl}
              label="Bagikan Daftar"
            />
          </div>
        )}
      </div>

      <DailyReminderCard variant="banner" />

      <MonthlyCalendarView
        schedules={data.schedules}
        onSelectSchedule={(item) => setSelectedId(item.id)}
      />

      {/* Desktop Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Filters & Schedule List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Category Segmented Controls */}
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#1E1008]">
              {(['Semua', 'Minggu', 'Unsur', 'Rayon'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat);
                    if (cat !== 'Rayon' && cat !== 'Semua') setRayonFilter('Semua');
                  }}
                  className={`min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407] shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#431407] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Rayon 1-5 Filter */}
            {(categoryFilter === 'Semua' || categoryFilter === 'Rayon') && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Filter Wilayah Rayon / KSP:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRayonFilter('Semua');
                    }}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      rayonFilter === 'Semua'
                        ? 'border-[#9A3412] bg-[#C2410C]/12 text-[#431407] dark:border-[#D4AF37] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Semua
                  </button>
                  {([1, 2, 3, 4, 5] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setCategoryFilter('Rayon');
                        setRayonFilter(r);
                      }}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        rayonFilter === r
                          ? 'border-[#9A3412] bg-[#9A3412] text-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-[#431407]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      Rayon {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* List */}
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Belum ada jadwal ibadah pada filter yang dipilih.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 border transition-all space-y-3 ${
                      isSelected
                        ? 'bg-white dark:bg-[#3D2112] border-[#9A3412] dark:border-[#D4AF37] shadow-sm'
                        : 'bg-white dark:bg-[#2B170C] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="w-full text-left focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded-lg"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-[#9A7B16] dark:text-[#E5C158] font-semibold">
                        <span>
                          {item.kategori === 'Rayon'
                            ? `Rayon ${item.rayon}`
                            : item.unsur
                            ? `Unsur ${item.unsur}`
                            : 'Ibadah Minggu'}
                        </span>
                        <span className="font-mono-nums">{item.waktu}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#9A3412] dark:text-white mt-1">
                        {item.judul}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {item.hariTanggal} · {item.tempat}
                      </p>
                    </button>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <AddToCalendarMenu item={item} compact />
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`text-xs font-semibold transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'text-[#9A3412] dark:text-[#D4AF37]'
                            : 'text-slate-500 dark:text-slate-400 hover:text-[#9A3412] dark:hover:text-[#D4AF37]'
                        }`}
                      >
                        {isSelected ? 'Sedang Ditampilkan' : 'Lihat Detail'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Selected Schedule Detail & Google Maps Directions */}
        <div className="lg:col-span-7 lg:sticky lg:top-24">
          {activeItem ? (
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
                  <span>
                    {activeItem.kategori === 'Rayon'
                      ? `Ibadah Rayon ${activeItem.rayon} / KSP`
                      : activeItem.unsur
                      ? `Ibadah Unsur ${activeItem.unsur}`
                      : 'Ibadah Minggu Jemaat'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Klasis Sorong</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#9A3412] dark:text-white">
                  {activeItem.judul}
                </h2>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 space-y-1">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <CalendarDays className="h-4 w-4 text-[#D4AF37]" />
                    Hari & Tanggal
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {activeItem.hariTanggal}
                  </dd>
                </div>

                <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 space-y-1">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="h-4 w-4 text-[#D4AF37]" />
                    Waktu Ibadah
                  </dt>
                  <dd className="font-mono-nums font-semibold text-slate-900 dark:text-white">
                    {activeItem.waktu}
                  </dd>
                </div>

                <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 space-y-1 sm:col-span-2">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-[#D4AF37]" />
                    Tempat & Alamat
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {activeItem.tempat}
                  </dd>
                  <dd className="text-xs text-slate-600 dark:text-slate-300">
                    {activeItem.alamat}
                  </dd>
                </div>

                <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 space-y-1 sm:col-span-2">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <UserCheck className="h-4 w-4 text-[#D4AF37]" />
                    Pemimpin / Pelayan Ibadah
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {activeItem.pemimpin}
                  </dd>
                </div>
              </dl>

              {activeItem.catatan && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-700 dark:text-slate-300">
                  <strong className="text-[#9A3412] dark:text-white">Catatan Pelayanan:</strong>{' '}
                  {activeItem.catatan}
                </div>
              )}

              <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      activeItem.mapsQuery
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Petunjuk Arah Google Maps</span>
                  </a>
                  <AddToCalendarMenu item={activeItem} />
                </div>

                <ShareActions
                  title={`${activeItem.judul} — GKI Efata Malanu`}
                  text={activeItemShareText}
                  url={jadwalUrl}
                  label="Bagikan Jadwal"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Pilih salah satu jadwal ibadah untuk melihat rincian lokasi dan pelayan.
            </div>
          )}
        </div>
      </div>

      <AttendanceScannerModal
        open={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        defaultSchedule={activeItem}
      />
    </div>
  );
};
