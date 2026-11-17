export type UserRole = 'jemaat' | 'admin1' | 'admin2' | 'superuser';

export type PageId =
  | 'beranda'
  | 'tata-ibadah'
  | 'jadwal'
  | 'warta'
  | 'nyanyian'
  | 'alkitab'
  | 'layanan'
  | 'pastoral'
  | 'keuangan'
  | 'statistik'
  | 'profil'
  | 'login'
  | 'admin';

export type AdminTabId =
  | 'warta'
  | 'jadwal'
  | 'liturgi'
  | 'galeri'
  | 'logo'
  | 'sheets'
  | 'keuangan'
  | 'statistik'
  | 'akun';

export interface CustomLogoState {
  dataUrl: string;
  fileName: string;
  driveFileId?: string;
  source: 'drive' | 'upload';
  updatedAt: string;
}

export interface LiturgyStep {
  id: string;
  urutan: number;
  bagian: string;
  petugas: string;
  keterangan: string;
  isi: string;
  nyanyianKode?: string;
  nyanyianJudul?: string;
  nyanyianLirik?: string;
  sikapJemaat?: 'Berdiri' | 'Duduk';
}

export interface WeeklyLiturgy {
  mingguTanggal: string;
  tahunGerejawi: string;
  temaPelayanan: string;
  ayatMingguIni: string;
  ayatReferensi: string;
  pelayanFirman: string;
  jamIbadah: string;
  steps: LiturgyStep[];
}

export type ScheduleCategory = 'Minggu' | 'Unsur' | 'Rayon';

export interface ScheduleItem {
  id: string;
  judul: string;
  kategori: ScheduleCategory;
  unsur?: 'PKB' | 'PW' | 'PAM' | 'PAR';
  rayon?: 1 | 2 | 3 | 4 | 5;
  hariTanggal: string;
  waktu: string;
  tempat: string;
  alamat: string;
  pemimpin: string;
  mapsQuery: string;
  catatan?: string;
}

export interface WartaAnnouncement {
  id: string;
  judul: string;
  kategori: 'Umum' | 'Pelayanan' | 'Sidang' | 'Diakonia';
  isi: string;
  tanggalTerbit: string;
}

export interface BirthdayEntry {
  id: string;
  nama: string;
  tanggal: string;
  rayon: string;
}

export interface CareNewsEntry {
  id: string;
  jenis: 'Sakit' | 'Duka';
  nama: string;
  rayon: string;
  keterangan: string;
}

export interface WartaData {
  edisi: string;
  tanggalMinggu: string;
  allowPdfDownload: boolean;
  pdfUrl: string;
  pdfFileName: string;
  pengumuman: WartaAnnouncement[];
  hutJemaat: BirthdayEntry[];
  beritaDukaSakit: CareNewsEntry[];
}

export type HymnCategory = 'NR' | 'KJ' | 'Mazmur' | 'Suara Gembira';

export interface HymnItem {
  id: string;
  kategori: HymnCategory;
  nomor: number;
  judul: string;
  nadaDasar: string;
  bait: string[];
}

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  name: string;
  testament: 'PL' | 'PB';
  chapters: BibleChapter[];
}

export interface FinanceTransaction {
  id: string;
  uraian: string;
  jumlah: number;
  tanggal: string;
}

export interface FinanceData {
  periodeLaporan: string;
  kasJemaat: number;
  persembahanMingguLalu: number;
  namaProyekPembangunan: string;
  targetPembangunan: number;
  terkumpulPembangunan: number;
  penerimaan: FinanceTransaction[];
  pengeluaran: FinanceTransaction[];
}

export interface RayonStat {
  rayon: number;
  namaWilayah: string;
  koordinator: string;
  jumlahKK: number;
  jumlahJiwa: number;
}

export interface MajelisMember {
  id: string;
  jabatan: string;
  nama: string;
  bidang: string;
}

export interface StatisticsData {
  tahunData: string;
  totalKK: number;
  totalJiwa: number;
  pria: number;
  wanita: number;
  rayonList: RayonStat[];
  majelisJemaat: MajelisMember[];
}

export interface GalleryItem {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal: string;
  imageUrl: string;
}

export interface AdminAccount {
  username: 'admin1' | 'admin2' | 'superuser';
  role: 'admin1' | 'admin2' | 'superuser';
  displayName: string;
  jabatan: string;
  password: string;
}

export interface ChurchProfile {
  namaGereja: string;
  klasis: string;
  sinode: string;
  alamat: string;
  teleponSekretariat: string;
  whatsappSekretariat: string;
  email: string;
  mapsQuery: string;
  sejarahSingkat: string;
  rekeningList: {
    id: string;
    bank: string;
    nomor: string;
    atasNama: string;
    peruntukan: string;
  }[];
}

export interface ChurchStoreData {
  liturgy: WeeklyLiturgy;
  schedules: ScheduleItem[];
  warta: WartaData;
  hymns: HymnItem[];
  finance: FinanceData;
  statistics: StatisticsData;
  gallery: GalleryItem[];
  profile: ChurchProfile;
  accounts: AdminAccount[];
}

export interface BookmarkedVerse {
  id: string;
  bookId: string;
  bookName: string;
  testament: 'PL' | 'PB';
  chapter: number;
  verse: number;
  text: string;
  savedAt: string;
}

export type DailyVerseTopic =
  | 'harian'
  | 'pengharapan'
  | 'kekuatan'
  | 'syukur'
  | 'damai'
  | 'pelayanan';

export interface FavoriteDailyVerse {
  id: string;
  date: string;
  topic: DailyVerseTopic;
  referensi: string;
  kitab: string;
  tema: string;
  isiAyat: string;
  refleksiSingkat: string;
  doaSingkat: string;
  savedAt: string;
}
