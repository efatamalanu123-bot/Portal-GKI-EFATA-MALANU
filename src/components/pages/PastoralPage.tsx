import React, { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Heart,
  HeartHandshake,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import {
  CLERGY_CONTACTS,
  ClergyContact,
  GoogleContactItem,
  downloadAllClergyVCards,
  downloadVCard,
  fetchGoogleContacts,
} from '../../utils/googlePeopleContacts';
import {
  PastoralCategory,
  PastoralVisitRequest,
  appendPastoralVisitToGoogleSheet,
  getActiveSpreadsheetConfig,
  loadStoredPastoralRequests,
  saveStoredPastoralRequests,
} from '../../utils/pastoralSync';
import {
  getDriveAccessToken,
  googleSignInForDrive,
} from '../../utils/googleDriveAuth';
import { NotificationToast, ToastPayload } from '../NotificationToast';

type ActiveTab = 'panduan' | 'formulir' | 'kontak';

export const PastoralPage: React.FC = () => {
  const { data } = useChurch();
  const [activeTab, setActiveTab] = useState<ActiveTab>('panduan');

  // Form State
  const [namaPemohon, setNamaPemohon] = useState('');
  const [rayon, setRayon] = useState('Rayon 1 (Malanu Kampung)');
  const [telepon, setTelepon] = useState('');
  const [kategori, setKategori] = useState<PastoralCategory>('Kunjungan Sakit / RS');
  const [lokasi, setLokasi] = useState('');
  const [tanggalDiminta, setTanggalDiminta] = useState('');
  const [waktuDiminta, setWaktuDiminta] = useState('Sore (16:30 – 18:30 WIT)');
  const [pelayanDiharapkan, setPelayanDiharapkan] = useState('Pendeta Jemaat (Pdt. Mayor / Pdt. Rumaropen)');
  const [catatanPergumulan, setCatatanPergumulan] = useState('');

  const [formTouched, setFormTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<PastoralVisitRequest | null>(null);

  // Stored Requests History
  const [requestsHistory, setRequestsHistory] = useState<PastoralVisitRequest[]>([]);

  // Google Contacts State
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<GoogleContactItem[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'Semua' | 'Pendeta' | 'Penatua' | 'Diaken'>('Semua');

  // Toast
  const [toast, setToast] = useState<ToastPayload | null>(null);

  // Unique accessible IDs for form fields
  const idNama = useId();
  const idRayon = useId();
  const idTelepon = useId();
  const idKategori = useId();
  const idLokasi = useId();
  const idTanggal = useId();
  const idWaktu = useId();
  const idPelayan = useId();
  const idCatatan = useId();

  const showToast = (message: string, title: string, variant: 'success' | 'info' | 'warning') => {
    setToast({
      id: Date.now(),
      title,
      message,
      variant,
    });
  };

  useEffect(() => {
    setRequestsHistory(loadStoredPastoralRequests());

    // Check if Google OAuth token is in memory
    const token = getDriveAccessToken();
    if (token) {
      setGoogleConnected(true);
      loadUserGoogleContacts(token);
    }
  }, []);

  const loadUserGoogleContacts = async (token: string) => {
    try {
      setLoadingContacts(true);
      const items = await fetchGoogleContacts(token);
      setGoogleContacts(items);
    } catch (err) {
      console.warn('Could not load Google Contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleConnectGoogleContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await googleSignInForDrive();
      if (res?.accessToken) {
        setGoogleConnected(true);
        await loadUserGoogleContacts(res.accessToken);
        showToast(
          'Akun Google terhubung. Daftar Google Contacts berhasil disinkronkan.',
          'Google Contacts Terhubung',
          'success'
        );
      }
    } catch (err: any) {
      showToast(
        err.message || 'Gagal menghubungkan Google Contacts.',
        'Koneksi Gagal',
        'warning'
      );
    } finally {
      setLoadingContacts(false);
    }
  };

  // Validation
  const trimmedNama = namaPemohon.trim();
  const trimmedLokasi = lokasi.trim();
  const trimmedCatatan = catatanPergumulan.trim();
  const cleanPhone = telepon.replace(/\D/g, '');

  const errors = {
    nama: !trimmedNama ? 'Nama lengkap pemohon / keluarga wajib diisi.' : '',
    telepon: cleanPhone.length < 9 ? 'Nomor WhatsApp minimal 9 digit angka aktif.' : '',
    lokasi: !trimmedLokasi ? 'Alamat lengkap atau lokasi perawatan wajib diisi.' : '',
    tanggal: !tanggalDiminta ? 'Pilih rencana tanggal kunjungan.' : '',
    catatan: !trimmedCatatan ? 'Tuliskan rincian pokok doa atau kondisi pergumulan.' : '',
  };

  const isFormValid =
    !errors.nama && !errors.telepon && !errors.lokasi && !errors.tanggal && !errors.catatan;

  const buildWhatsAppText = (req: PastoralVisitRequest) => {
    return [
      `*PERMOHONAN KUNJUNGAN PASTORAL GKI EFATA MALANU*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Nama Pemohon:* ${req.namaPemohon}`,
      `*Wilayah:* ${req.rayon}`,
      `*No. WhatsApp:* ${req.telepon}`,
      `*Kategori:* ${req.kategori}`,
      `*Lokasi / Alamat:* ${req.lokasi}`,
      `*Rencana Tanggal:* ${req.tanggalDiminta}`,
      `*Waktu Kunjungan:* ${req.waktuDiminta}`,
      `*Pelayan Diharapkan:* ${req.pelayanDiharapkan}`,
      `*Pokok Pergumulan:*`,
      `${req.catatanPergumulan}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_Diajukan melalui Portal Jemaat GKI Efata Malanu pada ${req.submittedAt}_`,
    ].join('\n');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);

    if (!isFormValid) {
      showToast(
        'Mohon lengkapi semua kolom formulir kunjungan pastoral yang wajib diisi.',
        'Formulir Belum Lengkap',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    const newRequest: PastoralVisitRequest = {
      id: `pastoral-${Date.now()}`,
      namaPemohon: trimmedNama,
      rayon,
      telepon: telepon.trim(),
      kategori,
      lokasi: trimmedLokasi,
      tanggalDiminta,
      waktuDiminta,
      pelayanDiharapkan,
      catatanPergumulan: trimmedCatatan,
      status: 'Diajukan',
      submittedAt: new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jayapura',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' WIT',
      syncedToSheets: false,
    };

    // 1. Attempt Google Sheets Sync to 'Kunjungan Pastoral' tab
    const token = getDriveAccessToken();
    const sheetConfig = getActiveSpreadsheetConfig();
    let synced = false;

    if (token && sheetConfig?.spreadsheetId) {
      try {
        synced = await appendPastoralVisitToGoogleSheet(
          token,
          sheetConfig.spreadsheetId,
          newRequest
        );
        newRequest.syncedToSheets = synced;
      } catch (err) {
        console.warn('Pastoral visit sheet sync error:', err);
      }
    }

    // 2. Save locally
    const updated = [newRequest, ...requestsHistory];
    setRequestsHistory(updated);
    saveStoredPastoralRequests(updated);
    setSubmittedRequest(newRequest);
    setSubmitting(false);

    showToast(
      synced
        ? 'Permohonan kunjungan berhasil disimpan & dicatat ke spreadsheet Kunjungan Pastoral!'
        : 'Permohonan kunjungan berhasil disimpan di portal jemaat.',
      'Permohonan Kunjungan Tercatat',
      'success'
    );
  };

  // Filtered contacts
  const filteredClergy = CLERGY_CONTACTS.filter((c) => {
    const matchRole = roleFilter === 'Semua' || c.roleTag === roleFilter;
    const matchSearch =
      contactSearch === '' ||
      c.nama.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.jabatan.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.wilayah.toLowerCase().includes(contactSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#9A3412] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E5C158] uppercase tracking-wider">
              <HeartHandshake className="h-4 w-4" />
              <span>Pelayanan Penggembalaan Jemaat</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              Layanan Pastoral & Kunjungan Jemaat
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Pelayanan doa kesembuhan, bimbingan konseling keluarga, penghiburan bagi yang berduka, serta penguatan iman bagi jemaat GKI Efata Malanu (Klasis Sorong).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('formulir')}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#431407] hover:bg-[#e1be49] transition-colors shadow-xs whitespace-nowrap"
            >
              <Send className="h-4 w-4" />
              <span>Minta Kunjungan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kontak')}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              <Phone className="h-4 w-4" />
              <span>Kontak Majelis</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('panduan')}
          className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'panduan'
              ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>Panduan Kunjungan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('formulir')}
          className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'formulir'
              ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Formulir Permintaan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kontak')}
          className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'kontak'
              ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4 shrink-0" />
          <span>Kontak Pendeta & Penatua</span>
        </button>
      </div>

      {/* ================= TAB 1: PANDUAN KUNJUNGAN PASTORAL ================= */}
      {activeTab === 'panduan' && (
        <div className="space-y-6">
          {/* Dasar Alkitabiah & Prinsip */}
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 text-[#9A3412] dark:text-[#D4AF37]">
              <Heart className="h-5 w-5 fill-current" />
              <h2 className="font-display text-lg sm:text-xl font-bold">
                Dasar & Tujuan Pelayanan Kunjungan Pastoral
              </h2>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Pelayanan pastoral adalah wujud kasih Kristus melalui para gembala dan majelis jemaat untuk mendampingi, mendoakan, dan meneguhkan keluarga dalam setiap fase kehidupan—baik dalam sukacita, pergumulan, maupun kelemahan tubuh.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 border border-[#9A3412]/20 space-y-1">
                <span className="text-xs font-bold text-[#9A3412] dark:text-[#D4AF37] uppercase tracking-wider">
                  Yakobus 5:14
                </span>
                <p className="text-xs italic text-slate-700 dark:text-slate-300">
                  “Kalau ada seorang di antara kamu yang sakit, baiklah ia memanggil para penatua jemaat, supaya mereka mendoakan dia dan mengolesnya dengan minyak dalam nama Tuhan.”
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 border border-[#9A3412]/20 space-y-1">
                <span className="text-xs font-bold text-[#9A3412] dark:text-[#D4AF37] uppercase tracking-wider">
                  Galatia 6:2
                </span>
                <p className="text-xs italic text-slate-700 dark:text-slate-300">
                  “Bertolong-tolonganlah menanggung bebanmu! Demikianlah kamu memenuhi hukum Kristus.”
                </p>
              </div>
            </div>
          </div>

          {/* 5 Kategori Kunjungan */}
          <div className="space-y-3">
            <h3 className="font-display text-base sm:text-lg font-bold text-[#9A3412] dark:text-white">
              Klasifikasi Layanan Kunjungan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Kunjungan Sakit / RS',
                  desc: 'Pelayanan doa kesembuhan dan penguatan bagi anggota jemaat yang dirawat di Rumah Sakit maupun beristirahat di rumah.',
                  color: 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20',
                },
                {
                  title: 'Penguatan Iman & Konseling',
                  desc: 'Konseling pribadi atau keluarga dalam menghadapi pergumulan hidup, pengambilan keputusan penting, dan pemulihan relasi iman.',
                  color: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20',
                },
                {
                  title: 'Syukur Keluarga / Rumah Baru',
                  desc: 'Ibadah ucapan syukur HUT kelahiran, ulang tahun pernikahan, pentahbisan tempat tinggal baru, maupun kelulusan studi.',
                  color: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20',
                },
                {
                  title: 'Lansia & Pelayanan Diakonia',
                  desc: 'Kunjungan kasih bagi para jemaat lanjut usia (opa/oma) atau keluarga berkebutuhan khusus yang terbatas secara fisik hadir di gereja.',
                  color: 'border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20',
                },
                {
                  title: 'Penghiburan / Kedukaan',
                  desc: 'Pendampingan pastoral, doa penguatan, dan bimbingan rohani bagi keluarga yang sedang berduka cita atas kepergian sanak saudara.',
                  color: 'border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20',
                },
                {
                  title: 'Jadwal & Waktu Pelayanan',
                  desc: 'Rutin tiap Selasa – Jumat pukul 16:30 – 18:30 WIT. Untuk keadaan darurat (kritis/RS), pelayan firman siap siaga 24 jam.',
                  color: 'border-orange-200 dark:border-orange-900/60 bg-orange-50/40 dark:bg-orange-950/20',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 space-y-2 shadow-xs transition-colors ${item.color}`}
                >
                  <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tata Cara & Etika */}
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-base sm:text-lg font-bold text-[#9A3412] dark:text-white">
              Tata Cara & Persiapan Keluarga Sebelum Kunjungan
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong>Konfirmasi Jadwal:</strong> Mengisi formulir permohonan kunjungan minimal 1 hari sebelumnya agar pelayan firman dapat mengalokasikan waktu dengan optimal.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong>Kehadiran Keluarga:</strong> Diharapkan anggota keluarga inti dapat berkumpul bersama untuk menyambut firman dan doa berkat.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong>Kerahasiaan Pastoral Terjaga:</strong> Seluruh hal yang dibagikan dalam konseling pastoral dijaga kerahasiaannya oleh Pendeta dan Penatua yang bertugas.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong>Kunjungan Rumah Sakit:</strong> Untuk kunjungan di RS, mohon cantumkan nama RS, nama ruangan/bangsal, dan nomor tempat tidur agar tim pastoral dapat langsung menuju lokasi.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ================= TAB 2: FORMULIR PERMINTAAN JADWAL KUNJUNGAN ================= */}
      {activeTab === 'formulir' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSubmitForm}
            noValidate
            className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#D4AF37]" />
                <h2 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                  Permintaan Jadwal Kunjungan
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">* Wajib diisi</span>
            </div>

            {/* Nama & Rayon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor={idNama}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Nama Pemohon / Kepala Keluarga *
                </label>
                <input
                  id={idNama}
                  type="text"
                  required
                  value={namaPemohon}
                  onChange={(e) => setNamaPemohon(e.target.value)}
                  placeholder="Contoh: Keluarga Bpk. Markus"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
                />
                {formTouched && errors.nama && (
                  <p className="flex items-center gap-1 text-xs text-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.nama}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={idRayon}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Wilayah Rayon / KSP *
                </label>
                <select
                  id={idRayon}
                  value={rayon}
                  onChange={(e) => setRayon(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
                >
                  <option value="Rayon 1 (Malanu Kampung)">Rayon 1 (Malanu Kampung)</option>
                  <option value="Rayon 2 (Kompleks Gereja)">Rayon 2 (Kompleks Gereja)</option>
                  <option value="Rayon 3 (BTN / KPR Malanu)">Rayon 3 (BTN / KPR Malanu)</option>
                  <option value="Rayon 4 (Malanu Atas / Bukit Baru)">Rayon 4 (Malanu Atas / Bukit Baru)</option>
                  <option value="Rayon 5 (Tanjung Batu / Rufei)">Rayon 5 (Tanjung Batu / Rufei)</option>
                  <option value="Jemaat Tamu / Lainnya">Jemaat Tamu / Lainnya</option>
                </select>
              </div>
            </div>

            {/* No WhatsApp & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor={idTelepon}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Nomor WhatsApp / HP Aktif *
                </label>
                <input
                  id={idTelepon}
                  type="tel"
                  inputMode="tel"
                  required
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="Contoh: 0812-4800-1956"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
                />
                {formTouched && errors.telepon && (
                  <p className="flex items-center gap-1 text-xs text-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.telepon}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={idKategori}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Kategori Kunjungan *
                </label>
                <select
                  id={idKategori}
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as PastoralCategory)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
                >
                  <option value="Kunjungan Sakit / RS">Kunjungan Sakit / Rumah Sakit</option>
                  <option value="Penguatan Iman & Konseling">Penguatan Iman & Konseling Keluarga</option>
                  <option value="Syukur Keluarga / Rumah Baru">Syukur Keluarga / Rumah Baru / HUT</option>
                  <option value="Lansia & Diakonia">Kunjungan Lansia & Diakonia</option>
                  <option value="Penghiburan / Duka">Penghiburan / Kedukaan</option>
                </select>
              </div>
            </div>

            {/* Lokasi Alamat */}
            <div className="space-y-1.5">
              <label
                htmlFor={idLokasi}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Lokasi / Alamat Lengkap / RS & Kamar *
              </label>
              <input
                id={idLokasi}
                type="text"
                required
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Jl. Basuki Rahmat No. 45 atau RSUD Sele Be Solu, Ruang Melati No. 4"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
              />
              {formTouched && errors.lokasi && (
                <p className="flex items-center gap-1 text-xs text-rose-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.lokasi}</span>
                </p>
              )}
            </div>

            {/* Tanggal & Pilihan Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor={idTanggal}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Rencana Tanggal Kunjungan *
                </label>
                <input
                  id={idTanggal}
                  type="date"
                  required
                  value={tanggalDiminta}
                  onChange={(e) => setTanggalDiminta(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
                />
                {formTouched && errors.tanggal && (
                  <p className="flex items-center gap-1 text-xs text-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.tanggal}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={idWaktu}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Pilihan Waktu Kunjungan *
                </label>
                <select
                  id={idWaktu}
                  value={waktuDiminta}
                  onChange={(e) => setWaktuDiminta(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
                >
                  <option value="Sore (16:30 – 18:30 WIT)">Sore (16:30 – 18:30 WIT) — Rutin</option>
                  <option value="Pagi (09:30 – 11:30 WIT)">Pagi (09:30 – 11:30 WIT)</option>
                  <option value="Malam (19:00 – 20:30 WIT)">Malam (19:00 – 20:30 WIT)</option>
                  <option value="Segera / Darurat (Hari Ini)">Segera / Darurat (Hari Ini)</option>
                </select>
              </div>
            </div>

            {/* Pelayan Diharapkan */}
            <div className="space-y-1.5">
              <label
                htmlFor={idPelayan}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Pelayan Firman yang Diharapkan
              </label>
              <select
                id={idPelayan}
                value={pelayanDiharapkan}
                onChange={(e) => setPelayanDiharapkan(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
              >
                <option value="Pendeta Jemaat (Pdt. Mayor / Pdt. Rumaropen)">
                  Pendeta Jemaat (Pdt. Mayor / Pdt. Rumaropen)
                </option>
                <option value="Penatua & Diaken Rayon Sesuai Wilayah">
                  Penatua & Diaken Rayon Sesuai Wilayah
                </option>
                <option value="Koordinator Diakonia (Dkn. Elizabeth Mayor)">
                  Koordinator Diakonia (Dkn. Elizabeth Mayor)
                </option>
                <option value="Bebas / Sesuai Penugasan Majelis Jemaat">
                  Bebas / Sesuai Penugasan Majelis Jemaat
                </option>
              </select>
            </div>

            {/* Pokok Pergumulan */}
            <div className="space-y-1.5">
              <label
                htmlFor={idCatatan}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Pokok Pergumulan & Keterangan Kunjungan *
              </label>
              <textarea
                id={idCatatan}
                rows={3}
                required
                value={catatanPergumulan}
                onChange={(e) => setCatatanPergumulan(e.target.value)}
                placeholder="Tuliskan kondisi anggota keluarga yang sakit, pergumulan doa, atau acara syukuran yang direncanakan..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
              />
              {formTouched && errors.catatan && (
                <p className="flex items-center gap-1 text-xs text-rose-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.catatan}</span>
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? 'Menyimpan Permohonan...' : 'Kirim Permohonan Kunjungan'}</span>
              </button>
            </div>
          </form>

          {/* Sidebar: Submitted Preview & Integration Info */}
          <aside className="lg:col-span-5 space-y-4">
            {submittedRequest ? (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>Permohonan Siap Diteruskan</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Permohonan telah dicatat ke arsip portal. Klik tombol di bawah untuk langsung meneruskan rincian kunjungan ke WhatsApp Sekretariat & Pendeta Jemaat:
                </p>
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1E1008] rounded-xl p-3 border border-emerald-200 dark:border-emerald-900 max-h-56 overflow-y-auto">
                  {buildWhatsAppText(submittedRequest)}
                </pre>
                <a
                  href={`https://wa.me/${data.profile.whatsappSekretariat}?text=${encodeURIComponent(
                    buildWhatsAppText(submittedRequest)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Kirim ke WhatsApp Sekretariat</span>
                </a>
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#9A3412] dark:text-[#D4AF37]">
                  <FileSpreadsheet className="h-5 w-5" />
                  <h3 className="font-display text-sm font-bold">
                    Pencatatan Google Sheets Otomatis
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Setiap permintaan kunjungan pastoral otomatis dicatat ke dalam sheet baru bernama <strong>'Kunjungan Pastoral'</strong> pada spreadsheet gereja yang terhubung, sehingga Tim Pastoral dan Sekretariat dapat menjadwalkan kunjungan secara terkoordinasi.
                </p>
                <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-3 border border-[#9A3412]/15 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>
                    <strong>Kolom Tercatat:</strong> ID Permohonan, Nama, Rayon, No. WA, Kategori, Lokasi/RS, Tanggal, Pelayan Diharapkan, Status Pelayanan.
                  </p>
                </div>
              </div>
            )}

            {/* Riwayat Permohonan Terakhir di Perangkat Ini */}
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-[#9A3412] dark:text-white">
                  Riwayat Pengajuan ({requestsHistory.length})
                </h3>
              </div>
              {requestsHistory.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Belum ada permohonan kunjungan yang diajukan dari perangkat ini.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {requestsHistory.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1008] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span>{req.namaPemohon}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#9A3412] dark:text-[#E5C158]">
                          {req.kategori}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {req.tanggalDiminta} · {req.waktuDiminta}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                        {req.lokasi}
                      </p>
                      {req.syncedToSheets && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium pt-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Tersinkron Spreadsheet</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ================= TAB 3: DAFTAR KONTAK PENDETA & PENATUA (GOOGLE CONTACTS) ================= */}
      {activeTab === 'kontak' && (
        <div className="space-y-6">
          {/* Google Contacts Integration Card */}
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-[#3F2111] text-[#9A3412] dark:text-[#E5C158] flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Integrasi Google Contacts
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {googleConnected
                      ? `Terhubung dengan Google Contacts (${googleContacts.length} kontak terbaca)`
                      : 'Hubungkan Google Contacts untuk menyinkronkan daftar kontak pendeta & penatua.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!googleConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectGoogleContacts}
                    disabled={loadingContacts}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity"
                  >
                    <Users className="h-4 w-4" />
                    <span>{loadingContacts ? 'Menghubungkan...' : 'Hubungkan Google Contacts'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const t = getDriveAccessToken();
                      if (t) loadUserGoogleContacts(t);
                    }}
                    disabled={loadingContacts}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingContacts ? 'animate-spin' : ''}`} />
                    <span>Sinkronkan Kontak</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => downloadAllClergyVCards()}
                  className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#431407] hover:bg-[#e1be49] transition-colors shadow-xs"
                  title="Unduh seluruh kontak Majelis Pastoral dalam satu file .vcf"
                >
                  <Download className="h-4 w-4" />
                  <span>Unduh Semua (.vcf)</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Cari nama, rayon, atau jabatan..."
                  className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#9A3412]"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(['Semua', 'Pendeta', 'Penatua', 'Diaken'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      roleFilter === r
                        ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407] font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Directory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClergy.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs hover:border-[#D4AF37] transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${contact.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0`}
                  >
                    {contact.nama.split(' ')[1]?.[0] || contact.nama[0]}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 dark:bg-[#3F2111] text-[#9A3412] dark:text-[#E5C158]">
                        {contact.roleTag}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                      {contact.nama}, {contact.gelar}
                    </h3>
                    <p className="text-xs font-medium text-[#9A3412] dark:text-[#D4AF37]">
                      {contact.jabatan}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{contact.wilayah}</span>
                  </div>
                  {contact.jadwalPelayanan && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{contact.jadwalPelayanan}</span>
                    </div>
                  )}
                </div>

                {/* Contact Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                      `Shalom ${contact.nama}, saya ingin berkonsultasi mengenai pelayanan pastoral GKI Efata Malanu.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${contact.telepon.replace(/\D/g, '')}`}
                    className="min-h-[38px] px-3 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    title={`Telepon ${contact.telepon}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Panggil</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      downloadVCard(contact);
                      showToast(
                        `Kontak ${contact.nama} berhasil diunduh (.vcf). Buka file untuk menyimpannya ke Google Contacts.`,
                        'Kontak Diunduh',
                        'success'
                      );
                    }}
                    className="min-h-[38px] px-3 inline-flex items-center justify-center gap-1 rounded-xl border border-[#D4AF37]/40 bg-[#FAF2E8] dark:bg-[#1E1008] text-xs font-bold text-[#9A3412] dark:text-[#E5C158] hover:bg-orange-100 transition-colors"
                    title="Unduh vCard untuk disimpan ke Google Contacts / Kontak HP"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Simpan Kontak</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* User's Synced Google Contacts Section if connected */}
          {googleConnected && googleContacts.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-[#9A3412] dark:text-white">
                    Google Contacts Akun Anda ({googleContacts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kontak yang tersimpan pada akun Google Anda yang sedang aktif.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {googleContacts.slice(0, 15).map((gc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1008] text-xs space-y-1"
                  >
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {gc.displayName}
                    </p>
                    {gc.phoneNumbers[0] && (
                      <p className="text-slate-500 font-mono-nums">
                        {gc.phoneNumbers[0]}
                      </p>
                    )}
                    {gc.emailAddresses[0] && (
                      <p className="text-slate-400 truncate text-[11px]">
                        {gc.emailAddresses[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};
