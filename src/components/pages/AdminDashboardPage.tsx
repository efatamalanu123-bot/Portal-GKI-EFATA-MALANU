import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarDays,
  Edit3,
  Eye,
  FileSpreadsheet,
  Image as ImageIcon,
  KeyRound,
  Layers,
  LogOut,
  Newspaper,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import {
  AdminTabId,
  LiturgyStep,
  ScheduleCategory,
  ScheduleItem,
  WeeklyLiturgy,
} from '../../types/church';
import { CHURCH_IMAGES } from '../../utils/churchAssets';
import { ChurchLogo } from '../ChurchLogo';
import { DriveLogoSyncCard } from '../DriveLogoSyncCard';
import { GoogleSheetsSyncCard } from '../GoogleSheetsSyncCard';
import { ThemeMenu } from '../ThemeMenu';

const GALLERY_PRESETS = [
  {
    label: 'Ruang Ibadah Utama (Sanctuary)',
    url: CHURCH_IMAGES.sanctuary,
  },
  {
    label: 'Persekutuan & Paduan Suara Jemaat',
    url: CHURCH_IMAGES.fellowship,
  },
  {
    label: 'Alkitab & Mimbar Liturgi',
    url: CHURCH_IMAGES.bibleDesk,
  },
];

const LITURGY_MODELS: Record<string, WeeklyLiturgy> = {
  ModelA: {
    mingguTanggal: 'Minggu, 16 November 2026',
    tahunGerejawi: 'Model A: Ibadah Minggu Umum / Klasik GKI',
    temaPelayanan: 'Hidup Baru dalam Kristus dan Ketaatan Iman',
    ayatMingguIni: 'Karena itu saudara-saudara, demi kemurahan Allah aku menasihatkan kamu, supaya kamu mempersembahkan tubuhmu sebagai persembahan yang hidup, yang kudus dan yang berkenan kepada Allah...',
    ayatReferensi: 'Roma 12:1-2',
    pelayanFirman: 'Pdt. M. Mayor, S.Th',
    jamIbadah: '09:00 WIT',
    steps: [
      { id: 'ma-1', urutan: 1, bagian: 'Votum & Salam', petugas: 'Pelayan Firman', sikapJemaat: 'Berdiri', keterangan: 'Jemaat berdiri menyambut firman Tuhan', isi: 'Pertolongan kita adalah dalam nama TUHAN yang menjadikan langit dan bumi. Kasih karunia dan damai sejahtera dari Allah Bapa dan Tuhan Yesus Kristus menyertai kamu sekalian.' },
      { id: 'ma-2', urutan: 2, bagian: 'Pengakuan Dosa & Berita Anugerah', petugas: 'Liturgos', sikapJemaat: 'Duduk', keterangan: 'Pengakuan dosa bersama jemaat', isi: 'Ya Tuhan, kami mengaku bahwa banyak kali kami hidup menurut keinginan duniawi dan mengabaikan kehendak-Mu. Ampunilah kami, ya Tuhan.\n\n"Setiap orang yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang." (2 Korintus 5:17)' },
      { id: 'ma-3', urutan: 3, bagian: 'Petunjuk Hidup Baru', petugas: 'Liturgos', sikapJemaat: 'Berdiri', keterangan: 'Mendengarkan titah Allah', isi: 'Dengarlah Petunjuk Hidup Baru: "Janganlah kamu menjadi serupa dengan dunia ini, tetapi berubahlah oleh pembaruan budimu, sehingga kamu dapat membedakan manakah kehendak Allah..."' },
      { id: 'ma-4', urutan: 4, bagian: 'Pemberitaan Firman Tuhan', petugas: 'Pdt. M. Mayor, S.Th', sikapJemaat: 'Duduk', keterangan: 'Pembacaan Alkitab dan Khotbah', isi: 'Pembacaan Alkitab dari Roma 12:1-2, dilanjutkan dengan Khotbah bertema "Hidup Baru dalam Kristus dan Ketaatan Iman".', nyanyianKode: 'NR No. 45', nyanyianJudul: 'Ku Mau Berjalan dengan Juruselamatku', nyanyianLirik: 'Ku mau berjalan dengan Juruselamatku\nDi sepanjang jalan dunia ini...' },
      { id: 'ma-5', urutan: 5, bagian: 'Doa Syafaat', petugas: 'Pelayan Firman', sikapJemaat: 'Duduk', keterangan: 'Doa syafaat untuk gereja, bangsa, dan jemaat', isi: 'Ya Allah Bapa di sorga, kami membawa doa syafaat kami bagi jemaat GKI Efata Malanu, pemerintah bangsa, dan sesama yang bergumul. Dengarlah doa kami, ya Tuhan.' },
      { id: 'ma-6', urutan: 6, bagian: 'Persembahan Syukur', petugas: 'Diaken / Penatua', sikapJemaat: 'Duduk', keterangan: 'Pengumpulan persembahan jemaat', isi: 'Marilah kita membawa persembahan syukur kita kepada TUHAN. "Hendaklah masing-masing memberikan menurut relah hatinya, bukan dengan sedih hati atau karena paksaan..."', nyanyianKode: 'NR No. 120', nyanyianJudul: 'Bawa Persembahanmu', nyanyianLirik: 'Bawa persembahanmu ke rumah Tuhan\nDengan hati penuh syukur dan sukacita...' },
      { id: 'ma-7', urutan: 7, bagian: 'Pengutusan & Berkat', petugas: 'Pelayan Firman', sikapJemaat: 'Berdiri', keterangan: 'Menerima berkat Tuhan', isi: 'Arahkanlah hatimu kepada Tuhan dan terimalah berkat-Nya: "TUHAN memberkati engkau dan melindungi engkau; TUHAN menyinari engkau dengan wajah-Nya..." Amin.' }
    ]
  },
  ModelB: {
    mingguTanggal: 'Ibadah Keluarga / Sektor Minggu Ini',
    tahunGerejawi: 'Model B: Ibadah Keluarga Sektor / Rayon',
    temaPelayanan: 'Keluarga Allah yang Mengasihi dan Menjadi Berkat',
    ayatMingguIni: 'Tetapi aku dan seisi rumahku, kami akan beribadah kepada TUHAN!',
    ayatReferensi: 'Yosua 24:15',
    pelayanFirman: 'Penatua Sektor / Rayon',
    jamIbadah: '18:30 WIT',
    steps: [
      { id: 'mb-1', urutan: 1, bagian: 'Nyanyian Pembuka & Doa', petugas: 'Pemimpin Sektor', sikapJemaat: 'Duduk', keterangan: 'Pujian pembuka ibadah keluarga', isi: 'Mari kita memulai ibadah sektor kita dengan memuji nama Tuhan dan menyerahkan seluruh keluarga dalam pimpinan-Nya.', nyanyianKode: 'NR No. 12', nyanyianJudul: 'Betapa Indah Harinya', nyanyianLirik: 'Betapa indah harinya saat ku pilih Penebus...' },
      { id: 'mb-2', urutan: 2, bagian: 'Pembacaan Alkitab & Renungan', petugas: 'Pelayan / Diaken', sikapJemaat: 'Duduk', keterangan: 'Pembacaan Yosua 24:15', isi: 'Pembacaan firman Tuhan dari Yosua 24:15 dan renungan singkat mengenai komitmen iman keluarga Kristen.' },
      { id: 'mb-3', urutan: 3, bagian: 'Sharing Jemaat & Doa Syafaat', petugas: 'Pimpinan & Anggota Sektor', sikapJemaat: 'Duduk', keterangan: 'Doa syafaat dan saling mendoakan', isi: 'Waktu sharing pengalaman iman, pergumulan keluarga, serta doa syafaat bersama untuk jemaat di sektor.' },
      { id: 'mb-4', urutan: 4, bagian: 'Persembahan Sektor', petugas: 'Diaken Sektor', sikapJemaat: 'Duduk', keterangan: 'Pengumpulan persembahan kasih', isi: 'Menyerahkan persembahan syukur keluarga diiringi puji-pujian.', nyanyianKode: 'NR No. 88', nyanyianJudul: 'Kasih Setia-Mu', nyanyianLirik: 'Kasih setia-Mu lebih dari hidupku...' },
      { id: 'mb-5', urutan: 5, bagian: 'Doa Penutup & Berkat', petugas: 'Pemimpin Sektor', sikapJemaat: 'Duduk', keterangan: 'Penutupan ibadah sektor', isi: 'Terimalah berkat Tuhan: Kasih karunia Tuhan Yesus Kristus menyertai keluarga kita sekarang dan selamanya. Amin.' }
    ]
  },
  ModelC: {
    mingguTanggal: 'Minggu Perjamuan Kudus',
    tahunGerejawi: 'Model C: Sakramen Perjamuan Kudus',
    temaPelayanan: 'Mengenang Pengorbanan Kasih Kristus di Kayu Salib',
    ayatMingguIni: 'Sebab setiap kali kamu makan roti ini dan minum cawan ini, kamu memberitakan kematian Tuhan sampai Ia datang.',
    ayatReferensi: '1 Korintus 11:26',
    pelayanFirman: 'Majelis Jemaat (BPMJ)',
    jamIbadah: '09:00 WIT',
    steps: [
      { id: 'mc-1', urutan: 1, bagian: 'Introitus & Persiapan', petugas: 'Pelayan Firman', sikapJemaat: 'Berdiri', keterangan: 'Panggilan kudus perjamuan', isi: 'Saudara-saudaraku yang kekasih di dalam Yesus Kristus, hari ini kita berkumpul di meja perjamuan Tuhan.' },
      { id: 'mc-2', urutan: 2, bagian: 'Pentahiran Dosa', petugas: 'Pelayan Firman', sikapJemaat: 'Duduk', keterangan: 'Pemeriksaan diri dan pengakuan', isi: 'Marilah kita memeriksa diri di hadapan Tuhan, mengaku dosa dengan tulus sebelum menyambut tubuh dan darah Kristus.' },
      { id: 'mc-3', urutan: 3, bagian: 'Pemberitaan Firman Tuhan', petugas: 'Pelayan Firman', sikapJemaat: 'Duduk', keterangan: 'Pemberitaan sabda anugerah', isi: 'Khotbah khusus perihal makna pengorbanan Kristus bagi keselamatan umat manusia.' },
      { id: 'mc-4', urutan: 4, bagian: 'Pelayanan Perjamuan Kudus', petugas: 'Pendeta & Penatua', sikapJemaat: 'Duduk', keterangan: 'Penetapan, pemecahan roti & piala', isi: 'Pelayanan sakramen Roti dan Anggur kepada seluruh jemaat yang mengaku percaya kepada Yesus Kristus.', nyanyianKode: 'NR No. 77', nyanyianJudul: 'Di Salib Yesus', nyanyianLirik: 'Di salib Yesusku kulihat terang...' },
      { id: 'mc-5', urutan: 5, bagian: 'Persembahan Syukur & Berkat', petugas: 'Pelayan Firman', sikapJemaat: 'Berdiri', keterangan: 'Persembahan dan berkat pengutusan', isi: 'Membawa persembahan syukur perjamuan kudus dan menerima berkat keselamatan kekal.' }
    ]
  },
  ModelD: {
    mingguTanggal: 'Ibadah Pemuda & Remaja GKI',
    tahunGerejawi: 'Model D: Ibadah Unsur Pemuda / PAM',
    temaPelayanan: 'Muda dan Setia Melayani Tuhan dengan Talenta',
    ayatMingguIni: 'Jangan seorang pun menganggap engkau rendah karena engkau muda. Jadilah teladan bagi orang-orang percaya...',
    ayatReferensi: '1 Timotius 4:12',
    pelayanFirman: 'Pengurus PAM / Pembina',
    jamIbadah: '19:00 WIT',
    steps: [
      { id: 'md-1', urutan: 1, bagian: 'Pujian Penyembahan Dinamis', petugas: 'Tim Musik Pemuda', sikapJemaat: 'Berdiri', keterangan: 'Pujian penuh semangat', isi: 'Mari puji Tuhan dengan segenap kekuatan dan sukacita masa muda kita!', nyanyianKode: 'NR No. 15', nyanyianJudul: 'Kunyanyikan Kasih Setia-Mu', nyanyianLirik: 'Kunyanyikan kasih setia-Mu selamanya...' },
      { id: 'md-2', urutan: 2, bagian: 'Doa Pembukaan & Puji-pujian', petugas: 'Petugas Pemuda', sikapJemaat: 'Duduk', keterangan: 'Doa penyerahan ibadah pemuda', isi: 'Menyerahkan jalannya ibadah pemuda ke dalam tangan penyertaan Tuhan.' },
      { id: 'md-3', urutan: 3, bagian: 'Pembacaan Alkitab Tematik', petugas: 'Petugas Pemuda', sikapJemaat: 'Duduk', keterangan: 'Pembacaan 1 Timotius 4:12', isi: 'Pembacaan ayat referensi dan pengantar firman Tuhan bagi generasi muda.' },
      { id: 'md-4', urutan: 4, bagian: 'Renungan & Sharing Interaktif', petugas: 'Pelayan / Pembina', sikapJemaat: 'Duduk', keterangan: 'Diskusi dan refleksi pemuda', isi: 'Sesi renungan interaktif mengenai tantangan iman pemuda masa kini dan cara hidup sebagai teladan.' },
      { id: 'md-5', urutan: 5, bagian: 'Doa Syafaat & Persembahan Pemuda', petugas: 'Petugas Pemuda', sikapJemaat: 'Duduk', keterangan: 'Doa bagi masa depan pemuda & persembahan', isi: 'Mendoakan studi, pekerjaan, masa depan pemuda, dan mengumpulkan persembahan sukarela.' },
      { id: 'md-6', urutan: 6, bagian: 'Berkat Pengutusan', petugas: 'Pelayan Firman', sikapJemaat: 'Berdiri', keterangan: 'Berkat penutup', isi: 'Menerima berkat Tuhan untuk menjadi saksi Kristus di tengah kampus, sekolah, dan tempat kerja.' }
    ]
  },
  ModelE: {
    mingguTanggal: 'Ibadah Syukuran Khusus / HUT / Baptisan',
    tahunGerejawi: 'Model E: Ibadah Syukuran Jemaat',
    temaPelayanan: 'Bersyukur atas Penyertaan Kasih Setia TUHAN',
    ayatMingguIni: 'Pujilah TUHAN, hai jiwaku, dan janganlah lupakan segala kebaikan-Nya!',
    ayatReferensi: 'Mazmur 103:1-2',
    pelayanFirman: 'Pdt. J. Rumaropen, M.Teol',
    jamIbadah: '09:00 WIT',
    steps: [
      { id: 'me-1', urutan: 1, bagian: 'Pujian Syukur & Introitus', petugas: 'Pelayan Firman', sikapJemaat: 'Berdiri', keterangan: 'Pujian mazmur ucapan syukur', isi: 'Pujilah TUHAN, sebab Ia baik! Kasih setia-Nya untuk selamanya.', nyanyianKode: 'NR No. 3', nyanyianJudul: 'Puji Tuhan, Sang Pencipta', nyanyianLirik: 'Puji Tuhan, Sang Pencipta yang mahabesar...' },
      { id: 'me-2', urutan: 2, bagian: 'Mazmur Tanggapan', petugas: 'Liturgos & Jemaat', sikapJemaat: 'Duduk', keterangan: 'Pembacaan Mazmur 103 berbalasan', isi: 'Pembacaan Mazmur ucapan syukur secara berbalasan antara liturgos dan jemaat.' },
      { id: 'me-3', urutan: 3, bagian: 'Pemberitaan Firman Tuhan', petugas: 'Pdt. J. Rumaropen, M.Teol', sikapJemaat: 'Duduk', keterangan: 'Khotbah syukuran', isi: 'Pemberitaan firman Tuhan mengenai arti mengucap syukur dalam segala keadaan.' },
      { id: 'me-4', urutan: 4, bagian: 'Pelayanan Khusus (Baptisan / Syukuran / HUT)', petugas: 'Pendeta & Majelis', sikapJemaat: 'Duduk', keterangan: 'Pelayanan sakramen baptisan atau penyerahan syukuran', isi: 'Pelayanan khusus kepada keluarga yang bersyukur atau anak yang dibaptiskan.' },
      { id: 'me-5', urutan: 5, bagian: 'Doa Syafaat Syukuran', petugas: 'Pelayan Firman', sikapJemaat: 'Duduk', keterangan: 'Doa syukur keluarga dan jemaat', isi: 'Mendoakan keluarga yang bersyukur, kesehatan jemaat, dan pelayanan gereja ke depan.' },
      { id: 'me-6', urutan: 6, bagian: 'Persembahan Syukur & Berkat', petugas: 'Pelayan Firman', sikapJemaat: 'Berdiri', keterangan: 'Persembahan khusus dan berkat', isi: 'Membawa persembahan syukur dan menerima berkat anugerah Tuhan.' }
    ]
  }
};

export const AdminDashboardPage: React.FC = () => {
  const {
    data,
    currentUser,
    navigate,
    logout,
    updateWarta,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    updateLiturgy,
    addGalleryItem,
    deleteGalleryItem,
    updateFinance,
    updateStatistics,
    updateAccountPassword,
    resetAllData,
    showToast,
  } = useChurch();

  const isSuperUser = currentUser?.role === 'superuser';
  const [activeTab, setActiveTab] = useState<AdminTabId>('warta');

  // Redirect guard if not logged in
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <p className="text-base font-semibold text-[#9A3412] dark:text-white">
          Silakan masuk sebagai Admin Pengurus atau Super User terlebih dahulu.
        </p>
        <button
          type="button"
          onClick={() => navigate('login')}
          className="min-h-[44px] rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white dark:text-[#431407]"
        >
          Ke Halaman Login
        </button>
      </div>
    );
  }

  const tabs: {
    id: AdminTabId;
    label: string;
    icon: React.FC<{ className?: string }>;
    superOnly?: boolean;
  }[] = [
    { id: 'warta', label: 'Warta & PDF', icon: Newspaper },
    { id: 'jadwal', label: 'Jadwal Ibadah', icon: CalendarDays },
    { id: 'liturgi', label: 'Tata Ibadah', icon: BookOpen },
    { id: 'galeri', label: 'Galeri Foto', icon: ImageIcon },
    { id: 'logo', label: 'Logo Gereja', icon: BadgeCheck },
    { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
    { id: 'keuangan', label: 'Keuangan', icon: Wallet, superOnly: true },
    { id: 'statistik', label: 'Statistik & Majelis', icon: BarChart3, superOnly: true },
    { id: 'akun', label: 'Akun & Sandi', icon: KeyRound, superOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.superOnly || isSuperUser);

  // ---------------- WARTA STATE ----------------
  const [wartaDraft, setWartaDraft] = useState(data.warta);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnCat, setNewAnnCat] = useState<'Umum' | 'Pelayanan' | 'Sidang' | 'Diakonia'>('Pelayanan');
  const [newAnnBody, setNewAnnBody] = useState('');
  const [newHutName, setNewHutName] = useState('');
  const [newHutDate, setNewHutDate] = useState('');
  const [newHutRayon, setNewHutRayon] = useState('Rayon 1');
  const [newCareJenis, setNewCareJenis] = useState<'Sakit' | 'Duka'>('Sakit');
  const [newCareNama, setNewCareNama] = useState('');
  const [newCareRayon, setNewCareRayon] = useState('Rayon 1');
  const [newCareKet, setNewCareKet] = useState('');

  // ---------------- JADWAL STATE ----------------
  const [editingSchId, setEditingSchId] = useState<string | null>(null);
  const [schForm, setSchForm] = useState<Omit<ScheduleItem, 'id'>>({
    judul: '',
    kategori: 'Rayon',
    rayon: 1,
    unsur: 'PKB',
    hariTanggal: '',
    waktu: '18:30 WIT',
    tempat: '',
    alamat: 'Malanu, Sorong Utara, Kota Sorong',
    pemimpin: '',
    mapsQuery: 'GKI Efata Malanu Sorong',
    catatan: '',
  });

  // ---------------- LITURGI STATE ----------------
  const [liturgyDraft, setLiturgyDraft] = useState(data.liturgy);
  const [newStepPart, setNewStepPart] = useState('');
  const [newStepPetugas, setNewStepPetugas] = useState('Pelayan Firman');
  const [newStepIsi, setNewStepIsi] = useState('');
  const [newStepSongCode, setNewStepSongCode] = useState('');
  const [newStepSongTitle, setNewStepSongTitle] = useState('');
  const [newStepSongLyrics, setNewStepSongLyrics] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepForm, setEditStepForm] = useState<LiturgyStep | null>(null);

  const startEditStep = (step: LiturgyStep) => {
    setEditingStepId(step.id);
    setEditStepForm({ ...step });
  };

  const saveEditStep = () => {
    if (!editStepForm) return;
    const nextSteps = liturgyDraft.steps.map((st) => (st.id === editStepForm.id ? editStepForm : st));
    const next = { ...liturgyDraft, steps: nextSteps };
    setLiturgyDraft(next);
    updateLiturgy(next);
    setEditingStepId(null);
    setEditStepForm(null);
  };

  // ---------------- GALERI STATE ----------------
  const [galTitle, setGalTitle] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galDate, setGalDate] = useState('15 November 2026');
  const [galUrl, setGalUrl] = useState(GALLERY_PRESETS[0].url);

  // ---------------- KEUANGAN STATE (SUPERUSER) ----------------
  const [financeDraft, setFinanceDraft] = useState(data.finance);
  const [newTxType, setNewTxType] = useState<'in' | 'out'>('in');
  const [newTxDesc, setNewTxDesc] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxDate, setNewTxDate] = useState('15 Nov 2026');

  // ---------------- STATISTIK STATE (SUPERUSER) ----------------
  const [statDraft, setStatDraft] = useState(data.statistics);

  // ---------------- PASSWORD RESET STATE (SUPERUSER) ----------------
  const [passInputs, setPassInputs] = useState<Record<string, string>>({
    admin1: '',
    admin2: '',
    superuser: '',
  });

  useEffect(() => {
    setWartaDraft(data.warta);
    setLiturgyDraft(data.liturgy);
    setFinanceDraft(data.finance);
    setStatDraft(data.statistics);
  }, [data.warta, data.liturgy, data.finance, data.statistics]);

  // Handlers
  const saveWartaAll = (nextWarta = wartaDraft) => {
    setWartaDraft(nextWarta);
    updateWarta(nextWarta);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnBody.trim()) return;
    const next = {
      ...wartaDraft,
      pengumuman: [
        {
          id: `w-${Date.now()}`,
          judul: newAnnTitle.trim(),
          kategori: newAnnCat,
          isi: newAnnBody.trim(),
          tanggalTerbit: 'Baru ditambahkan',
        },
        ...wartaDraft.pengumuman,
      ],
    };
    saveWartaAll(next);
    setNewAnnTitle('');
    setNewAnnBody('');
  };

  const handleAddHut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHutName.trim() || !newHutDate.trim()) return;
    const next = {
      ...wartaDraft,
      hutJemaat: [
        ...wartaDraft.hutJemaat,
        { id: `hut-${Date.now()}`, nama: newHutName.trim(), tanggal: newHutDate.trim(), rayon: newHutRayon },
      ],
    };
    saveWartaAll(next);
    setNewHutName('');
    setNewHutDate('');
  };

  const handleAddCare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCareNama.trim() || !newCareKet.trim()) return;
    const next = {
      ...wartaDraft,
      beritaDukaSakit: [
        ...wartaDraft.beritaDukaSakit,
        {
          id: `care-${Date.now()}`,
          jenis: newCareJenis,
          nama: newCareNama.trim(),
          rayon: newCareRayon,
          keterangan: newCareKet.trim(),
        },
      ],
    };
    saveWartaAll(next);
    setNewCareNama('');
    setNewCareKet('');
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schForm.judul.trim() || !schForm.hariTanggal.trim()) return;
    const payload: ScheduleItem = {
      ...schForm,
      id: editingSchId || `sch-${Date.now()}`,
      unsur: schForm.kategori === 'Unsur' ? schForm.unsur : undefined,
      rayon: schForm.kategori === 'Rayon' ? schForm.rayon : undefined,
    };
    if (editingSchId) {
      updateSchedule(payload);
      setEditingSchId(null);
    } else {
      addSchedule(payload);
    }
    setSchForm({
      judul: '',
      kategori: 'Rayon',
      rayon: 1,
      unsur: 'PKB',
      hariTanggal: '',
      waktu: '18:30 WIT',
      tempat: '',
      alamat: 'Malanu, Sorong Utara, Kota Sorong',
      pemimpin: '',
      mapsQuery: 'GKI Efata Malanu Sorong',
      catatan: '',
    });
  };

  const startEditSchedule = (item: ScheduleItem) => {
    setEditingSchId(item.id);
    setSchForm({
      judul: item.judul,
      kategori: item.kategori,
      rayon: item.rayon || 1,
      unsur: item.unsur || 'PKB',
      hariTanggal: item.hariTanggal,
      waktu: item.waktu,
      tempat: item.tempat,
      alamat: item.alamat,
      pemimpin: item.pemimpin,
      mapsQuery: item.mapsQuery,
      catatan: item.catatan || '',
    });
  };

  const handleAddLiturgyStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepPart.trim() || !newStepIsi.trim()) return;
    const nextStep: LiturgyStep = {
      id: `lit-${Date.now()}`,
      urutan: liturgyDraft.steps.length + 1,
      bagian: newStepPart.trim(),
      petugas: newStepPetugas.trim(),
      keterangan: '',
      isi: newStepIsi.trim(),
      nyanyianKode: newStepSongCode.trim() || undefined,
      nyanyianJudul: newStepSongTitle.trim() || undefined,
      nyanyianLirik: newStepSongLyrics.trim() || undefined,
    };
    const next = { ...liturgyDraft, steps: [...liturgyDraft.steps, nextStep] };
    setLiturgyDraft(next);
    updateLiturgy(next);
    setNewStepPart('');
    setNewStepIsi('');
    setNewStepSongCode('');
    setNewStepSongTitle('');
    setNewStepSongLyrics('');
  };

  const handleAddGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galTitle.trim() || !galUrl.trim()) return;
    addGalleryItem({
      id: `gal-${Date.now()}`,
      judul: galTitle.trim(),
      deskripsi: galDesc.trim() || 'Dokumentasi kegiatan pelayanan GKI Efata Malanu.',
      tanggal: galDate.trim(),
      imageUrl: galUrl.trim(),
    });
    setGalTitle('');
    setGalDesc('');
  };

  const handleAddFinanceTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newTxAmount);
    if (!newTxDesc.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const tx = {
      id: `tx-${Date.now()}`,
      uraian: newTxDesc.trim(),
      jumlah: amount,
      tanggal: newTxDate,
    };
    const next =
      newTxType === 'in'
        ? { ...financeDraft, penerimaan: [tx, ...financeDraft.penerimaan] }
        : { ...financeDraft, pengeluaran: [tx, ...financeDraft.pengeluaran] };
    setFinanceDraft(next);
    updateFinance(next);
    setNewTxDesc('');
    setNewTxAmount('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 h-16 bg-[#9A3412] text-white border-b border-white/10 px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ChurchLogo className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-bold truncate">
              Dashboard Pengurus · GKI Efata Malanu
            </h1>
            <p className="text-[11px] text-[#E5C158] truncate">
              {currentUser.displayName} ({currentUser.jabatan})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeMenu variant="darkHeader" />
          <button
            type="button"
            onClick={() => navigate('beranda')}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 sm:px-4 py-2 text-xs font-bold text-[#431407] hover:bg-[#e1be49] transition-colors whitespace-nowrap"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Lihat Tampilan Jemaat</span>
            <span className="sm:hidden">Jemaat</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 sm:px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600/80 transition-colors whitespace-nowrap"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar (Logout)</span>
            <span className="sm:hidden">Keluar</span>
          </button>
        </div>
      </header>

      {/* Mobile & Tablet Horizontal Menu */}
      <div className="lg:hidden bg-white dark:bg-[#221209] border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-2">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                    : 'bg-slate-100 dark:bg-[#2B170C] text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body: Sidebar (Desktop) + Content Area */}
      <div className="flex-1 max-w-[1280px] w-full mx-auto flex gap-6 p-4 md:p-6">
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-2">
          <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-xs">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu Pengelolaan
            </p>
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {!isSuperUser && (
            <div className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Anda masuk sebagai <strong>Admin Pengurus</strong>. Pengelolaan Laporan Keuangan, Statistik Jemaat, dan Sandi Akun dikelola khusus oleh Super User.
            </div>
          )}
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: WARTA JEMAAT & PDF */}
          {activeTab === 'warta' && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                  Pengaturan Warta Jemaat & Izin Unduh PDF
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Edisi Warta
                    </label>
                    <input
                      type="text"
                      value={wartaDraft.edisi}
                      onChange={(e) => setWartaDraft({ ...wartaDraft, edisi: e.target.value })}
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Tanggal Minggu
                    </label>
                    <input
                      type="text"
                      value={wartaDraft.tanggalMinggu}
                      onChange={(e) => setWartaDraft({ ...wartaDraft, tanggalMinggu: e.target.value })}
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                </div>

                {/* Checkbox Izinkan Jemaat Download PDF + PDF URL */}
                <div className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={wartaDraft.allowPdfDownload}
                      onChange={(e) =>
                        setWartaDraft({ ...wartaDraft, allowPdfDownload: e.target.checked })
                      }
                      className="h-5 w-5 rounded border-slate-300 accent-[#9A3412]"
                    />
                    <span className="text-sm font-bold text-[#9A3412] dark:text-[#E5C158]">
                      Izinkan Jemaat Download PDF Warta Jemaat
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                        Tautan File PDF Warta
                      </label>
                      <input
                        type="text"
                        value={wartaDraft.pdfUrl}
                        onChange={(e) => setWartaDraft({ ...wartaDraft, pdfUrl: e.target.value })}
                        placeholder="/warta-minggu-ini.pdf atau URL https://..."
                        className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                        Nama File Unduhan
                      </label>
                      <input
                        type="text"
                        value={wartaDraft.pdfFileName}
                        onChange={(e) =>
                          setWartaDraft({ ...wartaDraft, pdfFileName: e.target.value })
                        }
                        className="w-full min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => saveWartaAll()}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-white dark:text-[#431407]"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Pengaturan Warta & PDF</span>
                </button>
              </section>

              {/* Tambah Pengumuman */}
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                  Tambah Pengumuman Mingguan
                </h3>
                <form onSubmit={handleAddAnnouncement} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      placeholder="Judul pengumuman..."
                      className="sm:col-span-2 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                    <select
                      value={newAnnCat}
                      onChange={(e) =>
                        setNewAnnCat(
                          e.target.value as 'Umum' | 'Pelayanan' | 'Sidang' | 'Diakonia'
                        )
                      }
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    >
                      <option value="Pelayanan">Pelayanan</option>
                      <option value="Umum">Umum</option>
                      <option value="Sidang">Sidang</option>
                      <option value="Diakonia">Diakonia</option>
                    </select>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={newAnnBody}
                    onChange={(e) => setNewAnnBody(e.target.value)}
                    placeholder="Isi pengumuman lengkap..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Terbitkan Pengumuman</span>
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
                  {wartaDraft.pengumuman.map((p) => (
                    <div key={p.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
                          {p.kategori} · {p.tanggalTerbit}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{p.judul}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{p.isi}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          saveWartaAll({
                            ...wartaDraft,
                            pengumuman: wartaDraft.pengumuman.filter((x) => x.id !== p.id),
                          })
                        }
                        aria-label="Hapus pengumuman"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* HUT & Berita Sakit/Duka */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
                  <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                    Daftar HUT Jemaat
                  </h3>
                  <form onSubmit={handleAddHut} className="space-y-2">
                    <input
                      type="text"
                      required
                      value={newHutName}
                      onChange={(e) => setNewHutName(e.target.value)}
                      placeholder="Nama jemaat"
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={newHutDate}
                        onChange={(e) => setNewHutDate(e.target.value)}
                        placeholder="Tgl (mis. 22 Nov)"
                        className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                      />
                      <input
                        type="text"
                        value={newHutRayon}
                        onChange={(e) => setNewHutRayon(e.target.value)}
                        placeholder="Rayon 1"
                        className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-white dark:text-[#431407]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah HUT</span>
                    </button>
                  </form>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {wartaDraft.hutJemaat.map((h) => (
                      <li key={h.id} className="py-2 flex items-center justify-between text-xs">
                        <span>
                          <strong>{h.nama}</strong> ({h.tanggal} · {h.rayon})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            saveWartaAll({
                              ...wartaDraft,
                              hutJemaat: wartaDraft.hutJemaat.filter((x) => x.id !== h.id),
                            })
                          }
                          className="text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
                  <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                    Berita Sakit / Duka
                  </h3>
                  <form onSubmit={handleAddCare} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newCareJenis}
                        onChange={(e) => setNewCareJenis(e.target.value as 'Sakit' | 'Duka')}
                        className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                      >
                        <option value="Sakit">Sakit</option>
                        <option value="Duka">Duka</option>
                      </select>
                      <input
                        type="text"
                        value={newCareRayon}
                        onChange={(e) => setNewCareRayon(e.target.value)}
                        placeholder="Rayon"
                        className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={newCareNama}
                      onChange={(e) => setNewCareNama(e.target.value)}
                      placeholder="Nama jemaat / keluarga"
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={newCareKet}
                      onChange={(e) => setNewCareKet(e.target.value)}
                      placeholder="Keterangan singkat..."
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                    />
                    <button
                      type="submit"
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-white dark:text-[#431407]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Info</span>
                    </button>
                  </form>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {wartaDraft.beritaDukaSakit.map((c) => (
                      <li key={c.id} className="py-2 flex items-center justify-between text-xs">
                        <span>
                          <strong>[{c.jenis}] {c.nama}</strong> · {c.rayon}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            saveWartaAll({
                              ...wartaDraft,
                              beritaDukaSakit: wartaDraft.beritaDukaSakit.filter((x) => x.id !== c.id),
                            })
                          }
                          className="text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: JADWAL IBADAH */}
          {activeTab === 'jadwal' && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                  {editingSchId ? 'Edit Jadwal Ibadah' : 'Tambah Jadwal Ibadah Baru'}
                </h2>
                <form onSubmit={handleSaveSchedule} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={schForm.judul}
                      onChange={(e) => setSchForm({ ...schForm, judul: e.target.value })}
                      placeholder="Judul ibadah..."
                      className="sm:col-span-2 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                    <select
                      value={schForm.kategori}
                      onChange={(e) =>
                        setSchForm({ ...schForm, kategori: e.target.value as ScheduleCategory })
                      }
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    >
                      <option value="Minggu">Ibadah Minggu</option>
                      <option value="Unsur">Ibadah Unsur</option>
                      <option value="Rayon">Ibadah Rayon / KSP</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {schForm.kategori === 'Rayon' && (
                      <select
                        value={schForm.rayon || 1}
                        onChange={(e) =>
                          setSchForm({ ...schForm, rayon: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
                        }
                        className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                      >
                        <option value={1}>Rayon 1</option>
                        <option value={2}>Rayon 2</option>
                        <option value={3}>Rayon 3</option>
                        <option value={4}>Rayon 4</option>
                        <option value={5}>Rayon 5</option>
                      </select>
                    )}
                    {schForm.kategori === 'Unsur' && (
                      <select
                        value={schForm.unsur || 'PKB'}
                        onChange={(e) =>
                          setSchForm({
                            ...schForm,
                            unsur: e.target.value as 'PKB' | 'PW' | 'PAM' | 'PAR',
                          })
                        }
                        className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                      >
                        <option value="PKB">PKB</option>
                        <option value="PW">PW</option>
                        <option value="PAM">PAM</option>
                        <option value="PAR">PAR</option>
                      </select>
                    )}
                    <input
                      type="text"
                      required
                      value={schForm.hariTanggal}
                      onChange={(e) => setSchForm({ ...schForm, hariTanggal: e.target.value })}
                      placeholder="Hari & Tanggal (mis. Rabu, 18 Nov 2026)"
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={schForm.waktu}
                      onChange={(e) => setSchForm({ ...schForm, waktu: e.target.value })}
                      placeholder="Waktu (mis. 18:30 WIT)"
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={schForm.tempat}
                      onChange={(e) => setSchForm({ ...schForm, tempat: e.target.value })}
                      placeholder="Tempat (mis. Rumah Kel. Bpk. ...)"
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={schForm.pemimpin}
                      onChange={(e) => setSchForm({ ...schForm, pemimpin: e.target.value })}
                      placeholder="Pelayan / Pemimpin Ibadah"
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407]"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingSchId ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}</span>
                    </button>
                    {editingSchId && (
                      <button
                        type="button"
                        onClick={() => setEditingSchId(null)}
                        className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
                <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                  Daftar Jadwal Aktif ({data.schedules.length})
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.schedules.map((s) => (
                    <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#9A7B16] dark:text-[#D4AF37]">
                          {s.kategori === 'Rayon' ? `Rayon ${s.rayon}` : s.unsur || s.kategori} · {s.hariTanggal} · {s.waktu}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{s.judul}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.tempat} · Pelayan: {s.pemimpin}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditSchedule(s)}
                          className="min-h-[36px] rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold hover:border-[#9A3412]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSchedule(s.id)}
                          aria-label="Hapus jadwal"
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: TATA IBADAH MINGGU */}
          {activeTab === 'liturgi' && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                  Informasi Utama Tata Ibadah & Tema Minggu Ini
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Tanggal Minggu
                    </label>
                    <input
                      type="text"
                      value={liturgyDraft.mingguTanggal}
                      onChange={(e) =>
                        setLiturgyDraft({ ...liturgyDraft, mingguTanggal: e.target.value })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Pelayan Firman
                    </label>
                    <input
                      type="text"
                      value={liturgyDraft.pelayanFirman}
                      onChange={(e) =>
                        setLiturgyDraft({ ...liturgyDraft, pelayanFirman: e.target.value })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Tema Pelayanan GKI
                    </label>
                    <input
                      type="text"
                      value={liturgyDraft.temaPelayanan}
                      onChange={(e) =>
                        setLiturgyDraft({ ...liturgyDraft, temaPelayanan: e.target.value })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Referensi Ayat Minggu Ini
                    </label>
                    <input
                      type="text"
                      value={liturgyDraft.ayatReferensi}
                      onChange={(e) =>
                        setLiturgyDraft({ ...liturgyDraft, ayatReferensi: e.target.value })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Jam Ibadah
                    </label>
                    <input
                      type="text"
                      value={liturgyDraft.jamIbadah}
                      onChange={(e) =>
                        setLiturgyDraft({ ...liturgyDraft, jamIbadah: e.target.value })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Teks Ayat Minggu Ini
                    </label>
                    <textarea
                      rows={2}
                      value={liturgyDraft.ayatMingguIni}
                      onChange={(e) =>
                        setLiturgyDraft({ ...liturgyDraft, ayatMingguIni: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-3 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateLiturgy(liturgyDraft)}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-white dark:text-[#431407]"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Header Tata Ibadah</span>
                </button>
              </section>

              {/* Model A to Model E Liturgy Presets Selector */}
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 text-[#9A3412] dark:text-[#D4AF37]">
                  <Layers className="h-5 w-5" />
                  <h3 className="font-display text-lg font-bold">
                    Pilih Model Liturgi Instan (Model A – Model E)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Gunakan salah satu dari 5 model tata ibadah standar GKI di bawah ini untuk langsung menerapkan susunan liturgi secara instan:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(['ModelA', 'ModelB', 'ModelC', 'ModelD', 'ModelE'] as const).map((key, i) => {
                    const titles = ['Model A (Umum)', 'Model B (Keluarga)', 'Model C (Perjamuan)', 'Model D (Pemuda)', 'Model E (Syukuran)'];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const selected = LITURGY_MODELS[key];
                          setLiturgyDraft(selected);
                          updateLiturgy(selected);
                        }}
                        className="min-h-[46px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] hover:border-[#9A3412] hover:bg-orange-50 dark:hover:bg-orange-950/25 text-center transition-all flex flex-col items-center justify-center gap-1 group"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A3412] dark:text-[#D4AF37]">
                          Model {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          {titles[i].split(' ')[2] || titles[i]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                  Tambah Bagian Liturgi Baru
                </h3>
                <form onSubmit={handleAddLiturgyStep} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={newStepPart}
                      onChange={(e) => setNewStepPart(e.target.value)}
                      placeholder="Nama bagian (mis. Votum & Salam)"
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                    <input
                      type="text"
                      value={newStepPetugas}
                      onChange={(e) => setNewStepPetugas(e.target.value)}
                      placeholder="Petugas"
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={newStepIsi}
                    onChange={(e) => setNewStepIsi(e.target.value)}
                    placeholder="Teks bacaan atau doa liturgi..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-3 text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newStepSongCode}
                      onChange={(e) => setNewStepSongCode(e.target.value)}
                      placeholder="Kode Lagu opsional (mis. NR No. 1)"
                      className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                    />
                    <input
                      type="text"
                      value={newStepSongTitle}
                      onChange={(e) => setNewStepSongTitle(e.target.value)}
                      placeholder="Judul Lagu opsional"
                      className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-xs"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={newStepSongLyrics}
                    onChange={(e) => setNewStepSongLyrics(e.target.value)}
                    placeholder="Lirik lagu opsional..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-3 text-xs"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Urutan Liturgi</span>
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
                  {liturgyDraft.steps.map((st, idx) => (
                    <div key={st.id} className="py-3.5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-[#9A3412] dark:text-white">
                            {idx + 1}. {st.bagian}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Petugas: {st.petugas} {st.sikapJemaat ? `· Jemaat ${st.sikapJemaat}` : ''} {st.nyanyianKode ? `· ${st.nyanyianKode} — ${st.nyanyianJudul}` : ''}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {st.isi}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditStep(st)}
                            className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#9A3412] dark:text-[#D4AF37] hover:bg-orange-100 transition-colors"
                            title="Edit Bagian Ini"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = {
                                ...liturgyDraft,
                                steps: liturgyDraft.steps
                                  .filter((x) => x.id !== st.id)
                                  .map((item, i) => ({ ...item, urutan: i + 1 })),
                              };
                              setLiturgyDraft(next);
                              updateLiturgy(next);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Hapus Bagian"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit Form for this step */}
                      {editingStepId === st.id && editStepForm && (
                        <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-[#9A3412]/30 space-y-3">
                          <h4 className="text-xs font-bold text-[#9A3412] dark:text-[#D4AF37] uppercase tracking-wider">
                            Edit Bagian #{idx + 1}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editStepForm.bagian}
                              onChange={(e) => setEditStepForm({ ...editStepForm, bagian: e.target.value })}
                              placeholder="Nama Bagian"
                              className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3 text-xs"
                            />
                            <input
                              type="text"
                              value={editStepForm.petugas}
                              onChange={(e) => setEditStepForm({ ...editStepForm, petugas: e.target.value })}
                              placeholder="Petugas"
                              className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editStepForm.sikapJemaat || ''}
                              onChange={(e) => setEditStepForm({ ...editStepForm, sikapJemaat: e.target.value as 'Berdiri' | 'Duduk' })}
                              placeholder="Sikap Jemaat (Berdiri / Duduk)"
                              className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3 text-xs"
                            />
                            <input
                              type="text"
                              value={editStepForm.keterangan || ''}
                              onChange={(e) => setEditStepForm({ ...editStepForm, keterangan: e.target.value })}
                              placeholder="Keterangan opsional"
                              className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3 text-xs"
                            />
                          </div>
                          <textarea
                            rows={3}
                            value={editStepForm.isi}
                            onChange={(e) => setEditStepForm({ ...editStepForm, isi: e.target.value })}
                            placeholder="Teks bacaan / doa..."
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] p-3 text-xs"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editStepForm.nyanyianKode || ''}
                              onChange={(e) => setEditStepForm({ ...editStepForm, nyanyianKode: e.target.value })}
                              placeholder="Kode Lagu (mis. NR No. 1)"
                              className="min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3 text-xs"
                            />
                            <input
                              type="text"
                              value={editStepForm.nyanyianJudul || ''}
                              onChange={(e) => setEditStepForm({ ...editStepForm, nyanyianJudul: e.target.value })}
                              placeholder="Judul Lagu"
                              className="min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3 text-xs"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={editStepForm.nyanyianLirik || ''}
                            onChange={(e) => setEditStepForm({ ...editStepForm, nyanyianLirik: e.target.value })}
                            placeholder="Lirik lagu opsional..."
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] p-2 text-xs"
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={saveEditStep}
                              className="px-3 py-1.5 rounded-lg bg-[#9A3412] text-white text-xs font-semibold hover:bg-[#7C2D12]"
                            >
                              Simpan Perubahan
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingStepId(null); setEditStepForm(null); }}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: GALERI FOTO */}
          {activeTab === 'galeri' && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                  Tambah Foto Kegiatan Galeri
                </h2>
                <form onSubmit={handleAddGallery} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      placeholder="Judul kegiatan..."
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                    <input
                      type="text"
                      value={galDate}
                      onChange={(e) => setGalDate(e.target.value)}
                      placeholder="Tanggal kegiatan"
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Pilih Foto Dokumentasi Gereja
                    </label>
                    <select
                      value={galUrl}
                      onChange={(e) => setGalUrl(e.target.value)}
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    >
                      {GALLERY_PRESETS.map((p) => (
                        <option key={p.url} value={p.url}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={galDesc}
                    onChange={(e) => setGalDesc(e.target.value)}
                    placeholder="Keterangan singkat foto..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Simpan ke Galeri</span>
                  </button>
                </form>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.gallery.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <img
                      src={g.imageUrl}
                      alt={g.judul}
                      referrerPolicy="no-referrer"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="p-3.5 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#9A3412] dark:text-white">{g.judul}</p>
                        <p className="text-[11px] text-slate-500">{g.tanggal}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteGalleryItem(g.id)}
                        className="text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4B: LOGO GEREJA (GOOGLE DRIVE) */}
          {activeTab === 'logo' && <DriveLogoSyncCard variant="panel" />}

          {/* TAB 4C: SINKRONISASI GOOGLE SHEETS */}
          {activeTab === 'sheets' && <GoogleSheetsSyncCard />}

          {/* TAB 5: KEUANGAN (SUPERUSER ONLY) */}
          {activeTab === 'keuangan' && isSuperUser && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                  Kelola Laporan Keuangan & Aksi Pembangunan (Khusus Super User)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Periode Laporan
                    </label>
                    <input
                      type="text"
                      value={financeDraft.periodeLaporan}
                      onChange={(e) =>
                        setFinanceDraft({ ...financeDraft, periodeLaporan: e.target.value })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Saldo Kas Jemaat (Rp)
                    </label>
                    <input
                      type="number"
                      value={financeDraft.kasJemaat}
                      onChange={(e) =>
                        setFinanceDraft({ ...financeDraft, kasJemaat: Number(e.target.value) })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Persembahan Minggu Lalu (Rp)
                    </label>
                    <input
                      type="number"
                      value={financeDraft.persembahanMingguLalu}
                      onChange={(e) =>
                        setFinanceDraft({
                          ...financeDraft,
                          persembahanMingguLalu: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Dana Pembangunan Terkumpul (Rp)
                    </label>
                    <input
                      type="number"
                      value={financeDraft.terkumpulPembangunan}
                      onChange={(e) =>
                        setFinanceDraft({
                          ...financeDraft,
                          terkumpulPembangunan: Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateFinance(financeDraft)}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-white dark:text-[#431407]"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Ringkasan Keuangan</span>
                </button>
              </section>

              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h3 className="font-display text-lg font-bold text-[#9A3412] dark:text-white">
                  Catat Transaksi Penerimaan / Pengeluaran
                </h3>
                <form onSubmit={handleAddFinanceTx} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={newTxType}
                    onChange={(e) => setNewTxType(e.target.value as 'in' | 'out')}
                    className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                  >
                    <option value="in">Penerimaan (+)</option>
                    <option value="out">Pengeluaran (-)</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={newTxDesc}
                    onChange={(e) => setNewTxDesc(e.target.value)}
                    placeholder="Uraian transaksi..."
                    className="sm:col-span-2 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                  />
                  <input
                    type="number"
                    required
                    value={newTxAmount}
                    onChange={(e) => setNewTxAmount(e.target.value)}
                    placeholder="Jumlah (Rp)"
                    className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                  />
                  <input
                    type="text"
                    value={newTxDate}
                    onChange={(e) => setNewTxDate(e.target.value)}
                    placeholder="Tanggal"
                    className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#431407]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Catat</span>
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* TAB 6: STATISTIK & MAJELIS (SUPERUSER ONLY) */}
          {activeTab === 'statistik' && isSuperUser && (
            <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                Kelola Data Statistik Jemaat (Khusus Super User)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Total KK</label>
                  <input
                    type="number"
                    value={statDraft.totalKK}
                    onChange={(e) => setStatDraft({ ...statDraft, totalKK: Number(e.target.value) })}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Total Jiwa</label>
                  <input
                    type="number"
                    value={statDraft.totalJiwa}
                    onChange={(e) =>
                      setStatDraft({ ...statDraft, totalJiwa: Number(e.target.value) })
                    }
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Laki-Laki</label>
                  <input
                    type="number"
                    value={statDraft.pria}
                    onChange={(e) => setStatDraft({ ...statDraft, pria: Number(e.target.value) })}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Perempuan</label>
                  <input
                    type="number"
                    value={statDraft.wanita}
                    onChange={(e) => setStatDraft({ ...statDraft, wanita: Number(e.target.value) })}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] px-3 text-sm font-mono-nums"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Data Per Rayon (1–5)
                </p>
                {statDraft.rayonList.map((r, idx) => (
                  <div
                    key={r.rayon}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008]"
                  >
                    <input
                      type="text"
                      value={r.namaWilayah}
                      onChange={(e) => {
                        const list = [...statDraft.rayonList];
                        list[idx] = { ...r, namaWilayah: e.target.value };
                        setStatDraft({ ...statDraft, rayonList: list });
                      }}
                      className="sm:col-span-2 min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-2.5 text-xs"
                    />
                    <input
                      type="number"
                      value={r.jumlahKK}
                      onChange={(e) => {
                        const list = [...statDraft.rayonList];
                        list[idx] = { ...r, jumlahKK: Number(e.target.value) };
                        setStatDraft({ ...statDraft, rayonList: list });
                      }}
                      className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-2.5 text-xs font-mono-nums"
                    />
                    <input
                      type="number"
                      value={r.jumlahJiwa}
                      onChange={(e) => {
                        const list = [...statDraft.rayonList];
                        list[idx] = { ...r, jumlahJiwa: Number(e.target.value) };
                        setStatDraft({ ...statDraft, rayonList: list });
                      }}
                      className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-2.5 text-xs font-mono-nums"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => updateStatistics(statDraft)}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-white dark:text-[#431407]"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Data Statistik</span>
              </button>
            </section>
          )}

          {/* TAB 7: AKUN & SANDI (SUPERUSER ONLY) */}
          {activeTab === 'akun' && isSuperUser && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[#9A3412] dark:text-white">
                  Manajemen Akun & Reset Kata Sandi Pengurus
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Atur ulang kata sandi untuk akun Admin 1 (Sekretaris/Warta), Admin 2 (Urusan Ibadah), maupun Super User.
                </p>

                <div className="space-y-3">
                  {data.accounts.map((acc) => (
                    <div
                      key={acc.username}
                      className="rounded-xl bg-[#FAF2E8] dark:bg-[#1E1008] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#9A3412] dark:text-white">
                          {acc.displayName} <span className="font-mono-nums text-xs">(@{acc.username})</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {acc.jabatan} · Sandi saat ini: <span className="font-mono-nums">{acc.password}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={passInputs[acc.username] || ''}
                          onChange={(e) =>
                            setPassInputs({ ...passInputs, [acc.username]: e.target.value })
                          }
                          placeholder="Sandi baru..."
                          className="min-h-[38px] w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B170C] px-3 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextPass = (passInputs[acc.username] || '').trim();
                            if (nextPass.length < 4) {
                              showToast('Kata sandi minimal 4 karakter.');
                              return;
                            }
                            updateAccountPassword(acc.username, nextPass);
                            setPassInputs({ ...passInputs, [acc.username]: '' });
                          }}
                          className="min-h-[38px] rounded-lg bg-[#9A3412] dark:bg-[#D4AF37] px-3.5 text-xs font-semibold text-white dark:text-[#431407]"
                        >
                          Simpan Sandi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#9A3412] dark:text-white">
                    Reset Seluruh Data ke Pengaturan Awal
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mengembalikan seluruh konten contoh (Liturgi, Jadwal, Warta, Keuangan, Statistik) ke data awal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetAllData}
                  className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-rose-300 dark:border-rose-800 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 whitespace-nowrap"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Data Default</span>
                </button>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
