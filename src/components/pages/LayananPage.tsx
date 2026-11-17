import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, HeartHandshake, MessageCircle, Users } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { incrementTodayPrayerCount } from '../../utils/prayerCounter';
import { NotificationToast, ToastPayload } from '../NotificationToast';

type ServiceType = 'Pokok Doa' | 'Lapor Sakit' | 'Baptis / Sidi / Nikah';
type TouchedFields = {
  nama: boolean;
  rayon: boolean;
  telepon: boolean;
  detail: boolean;
};

export const LayananPage: React.FC = () => {
  const { data, navigate } = useChurch();
  const [serviceType, setServiceType] = useState<ServiceType>('Pokok Doa');
  const [nama, setNama] = useState('');
  const [rayon, setRayon] = useState('Rayon 1 (Malanu Kampung)');
  const [telepon, setTelepon] = useState('');
  const [subLayanan, setSubLayanan] = useState('Baptisan Kudus');
  const [detail, setDetail] = useState('');
  const [touched, setTouched] = useState<TouchedFields>({
    nama: false,
    rayon: false,
    telepon: false,
    detail: false,
  });
  const [submittedPreview, setSubmittedPreview] = useState<string | null>(null);
  const [localToast, setLocalToast] = useState<ToastPayload | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const draftPrayerCountedRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const triggerToast = (
    message: string,
    options: { title: string; variant: 'success' | 'info' | 'warning' }
  ) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setLocalToast({ id, message, title: options.title, variant: options.variant });
    toastTimerRef.current = window.setTimeout(() => {
      setLocalToast((prev) => (prev?.id === id ? null : prev));
    }, 5000);
  };

  // Per-field validation
  const trimmedNama = nama.trim();
  const trimmedDetail = detail.trim();
  const teleponDigits = telepon.replace(/\D/g, '');

  const errors = {
    nama: !trimmedNama
      ? 'Kolom nama lengkap / pemohon tidak boleh kosong.'
      : trimmedNama.length < 2
      ? 'Nama lengkap minimal 2 karakter.'
      : '',
    rayon: !rayon.trim() ? 'Wilayah Rayon / KSP wajib dipilih.' : '',
    telepon: !telepon.trim()
      ? 'Kolom nomor WhatsApp / HP tidak boleh kosong.'
      : teleponDigits.length < 9 || teleponDigits.length > 15
      ? 'Nomor WhatsApp harus berisi 9–15 digit angka yang valid (contoh: 081248001956).'
      : '',
    detail: !trimmedDetail
      ? serviceType === 'Pokok Doa'
        ? 'Kolom isi pokok doa tidak boleh kosong.'
        : serviceType === 'Lapor Sakit'
        ? 'Kolom keterangan kondisi & lokasi perawatan tidak boleh kosong.'
        : 'Kolom rincian pendaftaran tidak boleh kosong.'
      : trimmedDetail.length < 5
      ? serviceType === 'Pokok Doa'
        ? 'Tuliskan isi pokok doa minimal 5 karakter agar dapat didoakan dengan jelas.'
        : 'Tuliskan keterangan layanan minimal 5 karakter.'
      : '',
  };

  const missingFieldLabels: string[] = [];
  if (errors.nama) missingFieldLabels.push('Nama Lengkap');
  if (errors.rayon) missingFieldLabels.push('Wilayah Rayon');
  if (errors.telepon) missingFieldLabels.push('Nomor WhatsApp');
  if (errors.detail) {
    missingFieldLabels.push(
      serviceType === 'Pokok Doa'
        ? 'Isi Pokok Doa'
        : serviceType === 'Lapor Sakit'
        ? 'Keterangan Kondisi'
        : 'Rincian Pendaftaran'
    );
  }

  const isFormValid =
    !errors.nama &&
    !errors.rayon &&
    !errors.telepon &&
    !errors.detail &&
    (serviceType !== 'Baptis / Sidi / Nikah' || Boolean(subLayanan.trim()));

  const buildWhatsAppMessage = () => {
    const lines = [
      `Shalom Sekretariat GKI Efata Malanu,`,
      `Saya ingin mengajukan layanan: *${serviceType}*`,
      serviceType === 'Baptis / Sidi / Nikah' ? `Jenis Pendaftaran: ${subLayanan}` : '',
      `Nama: ${trimmedNama || '-'}`,
      `Wilayah: ${rayon}`,
      `No. HP/WA: ${telepon.trim() || '-'}`,
      `Keterangan:`,
      trimmedDetail || '-',
    ].filter(Boolean);
    return lines.join('\n');
  };

  const whatsappUrl = `https://wa.me/${data.profile.whatsappSekretariat}?text=${encodeURIComponent(
    buildWhatsAppMessage()
  )}`;

  const handlePrepare = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nama: true, rayon: true, telepon: true, detail: true });

    if (!isFormValid) {
      triggerToast(
        `Mohon periksa kembali: ${missingFieldLabels.join(', ')}.`,
        {
          title: 'Formulir Belum Lengkap',
          variant: 'warning',
        }
      );
      return;
    }

    setSubmittedPreview(buildWhatsAppMessage());
    if (serviceType === 'Pokok Doa') {
      if (!draftPrayerCountedRef.current) {
        incrementTodayPrayerCount();
        draftPrayerCountedRef.current = true;
      }
      triggerToast(
        `Pesan Pokok Doa atas nama ${trimmedNama} berhasil terkirim ke daftar pelayanan Sekretariat & Tim Doa GKI Efata Malanu.`,
        {
          title: 'Pokok Doa Berhasil Terkirim',
          variant: 'success',
        }
      );
    } else {
      triggerToast(
        `Pesan ${serviceType} atas nama ${trimmedNama} berhasil terkirim dan siap diteruskan ke WhatsApp Sekretariat.`,
        {
          title: `${serviceType} Berhasil Terkirim`,
          variant: 'success',
        }
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#9A3412] dark:text-white">
          Layanan Pastoral & Sekretariat Jemaat
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Ajukan pokok doa, lapor anggota keluarga sakit, atau pendaftaran Baptis, Sidi, dan Pemberkatan Nikah langsung ke WhatsApp Sekretariat.
        </p>
      </div>

      {/* Featured Banner: Layanan Pastoral & Kunjungan Jemaat */}
      <section className="rounded-2xl bg-gradient-to-r from-[#9A3412] to-[#7C2D12] text-white p-5 sm:p-6 shadow-sm border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E5C158] uppercase tracking-wider">
            <Users className="h-4 w-4" />
            <span>Fitur Khusus Penggembalaan</span>
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold">
            Kunjungan Pastoral & Kontak Majelis
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
            Panduan lengkap kunjungan doa orang sakit, konseling keluarga, formulir permintaan jadwal kunjungan yang terhubung ke Google Sheets, serta kontak Pendeta & Penatua terintegrasi Google Contacts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('pastoral')}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#431407] hover:bg-[#e1be49] transition-colors shrink-0 shadow-sm"
        >
          <span>Buka Layanan Pastoral</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* Segmented Service Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800">
        {(['Pokok Doa', 'Lapor Sakit', 'Baptis / Sidi / Nikah'] as ServiceType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setServiceType(tab);
              setSubmittedPreview(null);
              draftPrayerCountedRef.current = false;
            }}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              serviceType === tab
                ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handlePrepare}
          noValidate
          className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                Formulir {serviceType}
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              * Wajib diisi
            </span>
          </div>

          {serviceType === 'Baptis / Sidi / Nikah' && (
            <div className="space-y-1.5">
              <label
                htmlFor="layanan-sub"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Pilih Jenis Pelayanan Sakramen / Pemberkatan *
              </label>
              <select
                id="layanan-sub"
                value={subLayanan}
                onChange={(e) => {
                  setSubLayanan(e.target.value);
                  setSubmittedPreview(null);
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="Baptisan Kudus">Pendaftaran Baptisan Kudus</option>
                <option value="Katekisasi & Peneguhan Sidi">Pendaftaran Katekisasi & Peneguhan Sidi</option>
                <option value="Pemberkatan Nikah">Pendaftaran Pemberkatan Nikah</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="layanan-nama"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Nama Lengkap / Pemohon *
              </label>
              <input
                id="layanan-nama"
                type="text"
                required
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  setTouched((prev) => ({ ...prev, nama: true }));
                  setSubmittedPreview(null);
                  draftPrayerCountedRef.current = false;
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, nama: true }))}
                aria-invalid={touched.nama && Boolean(errors.nama)}
                aria-describedby={touched.nama && errors.nama ? 'err-nama' : undefined}
                placeholder="Contoh: Bpk. Markus Kambuaya"
                className={`w-full min-h-[44px] rounded-xl border px-3.5 text-sm text-slate-900 dark:text-white bg-[#FAF2E8] dark:bg-[#1E1008] focus:outline-none ${
                  touched.nama && errors.nama
                    ? 'border-rose-500 dark:border-rose-400'
                    : 'border-slate-200 dark:border-slate-700 focus:border-[#9A3412] dark:focus:border-[#D4AF37]'
                }`}
              />
              {touched.nama && errors.nama && (
                <p
                  id="err-nama"
                  role="alert"
                  className="flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{errors.nama}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="layanan-rayon"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Wilayah Rayon / KSP *
              </label>
              <select
                id="layanan-rayon"
                value={rayon}
                onChange={(e) => {
                  setRayon(e.target.value);
                  setTouched((prev) => ({ ...prev, rayon: true }));
                  setSubmittedPreview(null);
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, rayon: true }))}
                aria-invalid={touched.rayon && Boolean(errors.rayon)}
                aria-describedby={touched.rayon && errors.rayon ? 'err-rayon' : undefined}
                className={`w-full min-h-[44px] rounded-xl border px-3.5 text-sm text-slate-900 dark:text-white bg-[#FAF2E8] dark:bg-[#1E1008] focus:outline-none ${
                  touched.rayon && errors.rayon
                    ? 'border-rose-500 dark:border-rose-400'
                    : 'border-slate-200 dark:border-slate-700 focus:border-[#9A3412] dark:focus:border-[#D4AF37]'
                }`}
              >
                <option value="Rayon 1 (Malanu Kampung)">Rayon 1 (Malanu Kampung)</option>
                <option value="Rayon 2 (Kompleks Gereja)">Rayon 2 (Kompleks Gereja)</option>
                <option value="Rayon 3 (BTN / KPR Malanu)">Rayon 3 (BTN / KPR Malanu)</option>
                <option value="Rayon 4 (Malanu Atas / Bukit Baru)">Rayon 4 (Malanu Atas / Bukit Baru)</option>
                <option value="Rayon 5 (Tanjung Batu / Rufei)">Rayon 5 (Tanjung Batu / Rufei)</option>
              </select>
              {touched.rayon && errors.rayon && (
                <p
                  id="err-rayon"
                  role="alert"
                  className="flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{errors.rayon}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="layanan-telepon"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Nomor WhatsApp / HP Aktif *
            </label>
            <input
              id="layanan-telepon"
              type="tel"
              inputMode="tel"
              required
              value={telepon}
              onChange={(e) => {
                setTelepon(e.target.value);
                setTouched((prev) => ({ ...prev, telepon: true }));
                setSubmittedPreview(null);
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, telepon: true }))}
              aria-invalid={touched.telepon && Boolean(errors.telepon)}
              aria-describedby={touched.telepon && errors.telepon ? 'err-telepon' : undefined}
              placeholder="Contoh: 0812-4800-1956"
              className={`w-full min-h-[44px] rounded-xl border px-3.5 text-sm text-slate-900 dark:text-white bg-[#FAF2E8] dark:bg-[#1E1008] focus:outline-none ${
                touched.telepon && errors.telepon
                  ? 'border-rose-500 dark:border-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:border-[#9A3412] dark:focus:border-[#D4AF37]'
              }`}
            />
            {touched.telepon && errors.telepon && (
              <p
                id="err-telepon"
                role="alert"
                className="flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{errors.telepon}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="layanan-detail"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {serviceType === 'Pokok Doa'
                ? 'Isi Pokok Doa Jemaat / Keluarga *'
                : serviceType === 'Lapor Sakit'
                ? 'Nama yang Sakit, Lokasi Perawatan (Rumah/RS), & Kondisi *'
                : 'Nama Calon & Rencana Tanggal Pelaksanaan *'}
            </label>
            <textarea
              id="layanan-detail"
              required
              rows={4}
              value={detail}
              onChange={(e) => {
                setDetail(e.target.value);
                setTouched((prev) => ({ ...prev, detail: true }));
                setSubmittedPreview(null);
                draftPrayerCountedRef.current = false;
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, detail: true }))}
              aria-invalid={touched.detail && Boolean(errors.detail)}
              aria-describedby={touched.detail && errors.detail ? 'err-detail' : undefined}
              placeholder="Tuliskan rincian permohonan Anda dengan jelas..."
              className={`w-full rounded-xl border p-3.5 text-sm text-slate-900 dark:text-white bg-[#FAF2E8] dark:bg-[#1E1008] focus:outline-none ${
                touched.detail && errors.detail
                  ? 'border-rose-500 dark:border-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:border-[#9A3412] dark:focus:border-[#D4AF37]'
              }`}
            />
            {touched.detail && errors.detail && (
              <p
                id="err-detail"
                role="alert"
                className="flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{errors.detail}</span>
              </p>
            )}
          </div>

          {!isFormValid && (
            <div
              aria-live="polite"
              className="rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800/70 px-3.5 py-2.5 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200"
            >
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                Tombol kirim akan aktif setelah kolom berikut dilengkapi dengan valid:{' '}
                <strong>{missingFieldLabels.join(', ')}</strong>.
              </p>
            </div>
          )}

          <div className="pt-1 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!isFormValid}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <span>{serviceType === 'Pokok Doa' ? 'Kirim Pokok Doa' : 'Siapkan Pesan Layanan'}</span>
            </button>

            {isFormValid ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (serviceType === 'Pokok Doa' && !draftPrayerCountedRef.current) {
                    incrementTodayPrayerCount();
                    draftPrayerCountedRef.current = true;
                  }
                  triggerToast(
                    `Pesan ${serviceType} atas nama ${trimmedNama} berhasil dikirim ke WhatsApp Sekretariat GKI Efata Malanu.`,
                    {
                      title: `${serviceType} Berhasil Terkirim`,
                      variant: 'success',
                    }
                  );
                }}
                className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Kirim WhatsApp Sekretariat</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                title={`Lengkapi: ${missingFieldLabels.join(', ')}`}
                className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700/45 px-5 py-2.5 text-sm font-semibold text-white/85 cursor-not-allowed"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Kirim WhatsApp Sekretariat</span>
              </button>
            )}
          </div>
        </form>

        {/* Right Info / Preview Card */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
              Kontak Sekretariat PHMJ
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Pelayanan administrasi & pastoral dibuka Selasa – Sabtu pukul 09:00 – 15:00 WIT di Kantor Gereja GKI Efata Malanu. Untuk kondisi darurat atau kunjungan orang sakit, dapat langsung menghubungi via WhatsApp.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p>
                <strong>Telepon:</strong> {data.profile.teleponSekretariat}
              </p>
              <p>
                <strong>WhatsApp:</strong> +{data.profile.whatsappSekretariat}
              </p>
            </div>
          </div>

          {submittedPreview && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Ringkasan Pesan Siap Dikirim</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E1008] rounded-xl p-3 border border-emerald-200/60 dark:border-emerald-900">
                {submittedPreview}
              </pre>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Buka WhatsApp Sekarang</span>
              </a>
            </div>
          )}
        </aside>
      </div>

      <NotificationToast toast={localToast} onDismiss={() => setLocalToast(null)} />
    </div>
  );
};
