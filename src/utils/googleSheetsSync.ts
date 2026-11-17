import {
  BirthdayEntry,
  CareNewsEntry,
  ChurchProfile,
  ChurchStoreData,
  FinanceTransaction,
  GalleryItem,
  HymnCategory,
  HymnItem,
  LiturgyStep,
  MajelisMember,
  RayonStat,
  ScheduleCategory,
  ScheduleItem,
  WartaAnnouncement,
} from '../types/church';
import { invalidateDriveAccessToken } from './googleDriveAuth';

export const SHEET_TABS = {
  PROFILE: 'Info & Profil',
  LITURGY: 'Tata Ibadah',
  SCHEDULES: 'Jadwal Ibadah',
  WARTA: 'Warta Jemaat',
  CARE_HUT: 'HUT & Pokok Doa',
  HYMNS: 'Nyanyian Rohani',
  FINANCE: 'Keuangan',
  STATS: 'Statistik & Majelis',
  GALLERY: 'Galeri',
  PASTORAL: 'Kunjungan Pastoral',
} as const;

export const ALL_SYNC_TAB_TITLES = [
  SHEET_TABS.PROFILE,
  SHEET_TABS.LITURGY,
  SHEET_TABS.SCHEDULES,
  SHEET_TABS.WARTA,
  SHEET_TABS.CARE_HUT,
  SHEET_TABS.HYMNS,
  SHEET_TABS.FINANCE,
  SHEET_TABS.STATS,
  SHEET_TABS.GALLERY,
  SHEET_TABS.PASTORAL,
] as const;

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: Array<{ sheetId: number; title: string }>;
}

export interface SheetSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  syncedAt: string;
  totalRows: number;
  tabsUpdated: number;
}

export interface SheetPullResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  updatedData: Partial<ChurchStoreData>;
  summary: {
    liturgySteps: number;
    schedules: number;
    announcements: number;
    hutAndCare: number;
    hymns: number;
    financeTx: number;
    statsRows: number;
    gallery: number;
  };
}

type CellValue = string | number | boolean;

export function a1Tab(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

export async function sheetsFetch<T>(
  url: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const apiMsg =
      (errBody as { error?: { message?: string } })?.error?.message || res.statusText;
    if (res.status === 401) {
      invalidateDriveAccessToken();
      throw new Error('Sesi Google Sheets berakhir. Silakan masuk kembali dengan Google.');
    }
    if (res.status === 403) {
      throw new Error(
        `Akses Google Sheets ditolak (403). Pastikan Anda memberi izin Google Sheets saat login dan memiliki akses edit pada spreadsheet ini. (${apiMsg})`
      );
    }
    if (res.status === 404) {
      throw new Error('Spreadsheet tidak ditemukan. Periksa kembali ID atau link Google Sheet.');
    }
    throw new Error(`Kesalahan Google Sheets (${res.status}): ${apiMsg}`);
  }

  return (await res.json()) as T;
}

export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets(properties(sheetId,title))`;

  const raw = await sheetsFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties?: { title?: string };
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  }>(url, accessToken);

  return {
    spreadsheetId: raw.spreadsheetId,
    title: raw.properties?.title || 'Google Sheet GKI Efata Malanu',
    spreadsheetUrl:
      raw.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`,
    sheets: (raw.sheets || []).map((s, idx) => ({
      sheetId: s.properties?.sheetId ?? idx,
      title: s.properties?.title || `Sheet${idx + 1}`,
    })),
  };
}

export async function createChurchSpreadsheet(
  accessToken: string,
  title = 'Portal Data GKI Efata Malanu'
): Promise<SpreadsheetMetadata> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const raw = await sheetsFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties?: { title?: string };
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  }>(url, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title: title.trim() || 'Portal Data GKI Efata Malanu',
        locale: 'id_ID',
        timeZone: 'Asia/Jayapura',
      },
      sheets: ALL_SYNC_TAB_TITLES.map((tabTitle, index) => ({
        properties: {
          title: tabTitle,
          index,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      })),
    }),
  });

  return {
    spreadsheetId: raw.spreadsheetId,
    title: raw.properties?.title || title,
    spreadsheetUrl:
      raw.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${encodeURIComponent(raw.spreadsheetId)}/edit`,
    sheets: (raw.sheets || []).map((s, idx) => ({
      sheetId: s.properties?.sheetId ?? idx,
      title: s.properties?.title || ALL_SYNC_TAB_TITLES[idx],
    })),
  };
}

function buildSheetPayloads(data: ChurchStoreData, syncedAtIso: string): Record<string, CellValue[][]> {
  const infoRows: CellValue[][] = [
    ['Section', 'Key', 'Value', 'Extra1', 'Extra2', 'Extra3'],
    ['Sync', 'lastSyncedAt', syncedAtIso, 'Asia/Jayapura', '', ''],
    ['Profile', 'namaGereja', data.profile.namaGereja, '', '', ''],
    ['Profile', 'klasis', data.profile.klasis, '', '', ''],
    ['Profile', 'sinode', data.profile.sinode, '', '', ''],
    ['Profile', 'alamat', data.profile.alamat, '', '', ''],
    ['Profile', 'teleponSekretariat', data.profile.teleponSekretariat, '', '', ''],
    ['Profile', 'whatsappSekretariat', data.profile.whatsappSekretariat, '', '', ''],
    ['Profile', 'email', data.profile.email, '', '', ''],
    ['Profile', 'mapsQuery', data.profile.mapsQuery, '', '', ''],
    ['Profile', 'sejarahSingkat', data.profile.sejarahSingkat, '', '', ''],
    ...data.profile.rekeningList.map((rek): CellValue[] => [
      'Rekening',
      rek.id,
      rek.bank,
      rek.nomor,
      rek.atasNama,
      rek.peruntukan,
    ]),
    ['Liturgy', 'mingguTanggal', data.liturgy.mingguTanggal, '', '', ''],
    ['Liturgy', 'tahunGerejawi', data.liturgy.tahunGerejawi, '', '', ''],
    ['Liturgy', 'temaPelayanan', data.liturgy.temaPelayanan, '', '', ''],
    ['Liturgy', 'ayatMingguIni', data.liturgy.ayatMingguIni, '', '', ''],
    ['Liturgy', 'ayatReferensi', data.liturgy.ayatReferensi, '', '', ''],
    ['Liturgy', 'pelayanFirman', data.liturgy.pelayanFirman, '', '', ''],
    ['Liturgy', 'jamIbadah', data.liturgy.jamIbadah, '', '', ''],
    ['Warta', 'edisi', data.warta.edisi, '', '', ''],
    ['Warta', 'tanggalMinggu', data.warta.tanggalMinggu, '', '', ''],
    ['Warta', 'allowPdfDownload', String(data.warta.allowPdfDownload), '', '', ''],
    ['Warta', 'pdfUrl', data.warta.pdfUrl, '', '', ''],
    ['Warta', 'pdfFileName', data.warta.pdfFileName, '', '', ''],
    ['Finance', 'periodeLaporan', data.finance.periodeLaporan, '', '', ''],
    ['Finance', 'kasJemaat', data.finance.kasJemaat, '', '', ''],
    ['Finance', 'persembahanMingguLalu', data.finance.persembahanMingguLalu, '', '', ''],
    ['Finance', 'namaProyekPembangunan', data.finance.namaProyekPembangunan, '', '', ''],
    ['Finance', 'targetPembangunan', data.finance.targetPembangunan, '', '', ''],
    ['Finance', 'terkumpulPembangunan', data.finance.terkumpulPembangunan, '', '', ''],
    ['Statistics', 'tahunData', data.statistics.tahunData, '', '', ''],
    ['Statistics', 'totalKK', data.statistics.totalKK, '', '', ''],
    ['Statistics', 'totalJiwa', data.statistics.totalJiwa, '', '', ''],
    ['Statistics', 'pria', data.statistics.pria, '', '', ''],
    ['Statistics', 'wanita', data.statistics.wanita, '', '', ''],
  ];

  const liturgyRows: CellValue[][] = [
    [
      'ID',
      'Urutan',
      'Bagian',
      'Petugas',
      'Keterangan',
      'Isi / Teks',
      'Kode Nyanyian',
      'Judul Nyanyian',
      'Lirik Nyanyian',
      'Sikap Jemaat',
    ],
    ...[...data.liturgy.steps]
      .sort((a, b) => a.urutan - b.urutan)
      .map((s): CellValue[] => [
        s.id,
        s.urutan,
        s.bagian,
        s.petugas,
        s.keterangan,
        s.isi,
        s.nyanyianKode || '',
        s.nyanyianJudul || '',
        s.nyanyianLirik || '',
        s.sikapJemaat || '',
      ]),
  ];

  const scheduleRows: CellValue[][] = [
    [
      'ID',
      'Judul',
      'Kategori',
      'Unsur',
      'Rayon',
      'Hari & Tanggal',
      'Waktu',
      'Tempat',
      'Alamat',
      'Pemimpin',
      'Maps Query',
      'Catatan',
    ],
    ...data.schedules.map((sch): CellValue[] => [
      sch.id,
      sch.judul,
      sch.kategori,
      sch.unsur || '',
      sch.rayon ?? '',
      sch.hariTanggal,
      sch.waktu,
      sch.tempat,
      sch.alamat,
      sch.pemimpin,
      sch.mapsQuery,
      sch.catatan || '',
    ]),
  ];

  const wartaRows: CellValue[][] = [
    ['ID', 'Judul', 'Kategori', 'Tanggal Terbit', 'Isi Pengumuman'],
    ...data.warta.pengumuman.map((ann): CellValue[] => [
      ann.id,
      ann.judul,
      ann.kategori,
      ann.tanggalTerbit,
      ann.isi,
    ]),
  ];

  const careHutRows: CellValue[][] = [
    ['Tipe', 'ID', 'Nama', 'Rayon', 'Tanggal / Detail', 'Keterangan'],
    ...data.warta.hutJemaat.map((h): CellValue[] => [
      'HUT',
      h.id,
      h.nama,
      h.rayon,
      h.tanggal,
      'Ulang Tahun Jemaat',
    ]),
    ...data.warta.beritaDukaSakit.map((c): CellValue[] => [
      c.jenis,
      c.id,
      c.nama,
      c.rayon,
      c.jenis,
      c.keterangan,
    ]),
  ];

  const hymnRows: CellValue[][] = [
    ['ID', 'Kategori', 'Nomor', 'Judul', 'Nada Dasar', 'Bait (Dipisah ---)'],
    ...data.hymns.map((h): CellValue[] => [
      h.id,
      h.kategori,
      h.nomor,
      h.judul,
      h.nadaDasar,
      h.bait.join('\n\n---\n\n'),
    ]),
  ];

  const financeRows: CellValue[][] = [
    ['Jenis', 'ID', 'Tanggal', 'Uraian', 'Jumlah (Rp)'],
    ...data.finance.penerimaan.map((tx): CellValue[] => [
      'Penerimaan',
      tx.id,
      tx.tanggal,
      tx.uraian,
      tx.jumlah,
    ]),
    ...data.finance.pengeluaran.map((tx): CellValue[] => [
      'Pengeluaran',
      tx.id,
      tx.tanggal,
      tx.uraian,
      tx.jumlah,
    ]),
  ];

  const statsRows: CellValue[][] = [
    ['Tipe', 'ID / Nomor Rayon', 'Nama Wilayah / Jabatan', 'Koordinator / Nama', 'KK / Bidang', 'Jiwa'],
    ...data.statistics.rayonList.map((r): CellValue[] => [
      'Rayon',
      r.rayon,
      r.namaWilayah,
      r.koordinator,
      r.jumlahKK,
      r.jumlahJiwa,
    ]),
    ...data.statistics.majelisJemaat.map((m): CellValue[] => [
      'Majelis',
      m.id,
      m.jabatan,
      m.nama,
      m.bidang,
      '',
    ]),
  ];

  const galleryRows: CellValue[][] = [
    ['ID', 'Judul', 'Tanggal', 'Deskripsi', 'Image URL'],
    ...data.gallery.map((g): CellValue[] => [
      g.id,
      g.judul,
      g.tanggal,
      g.deskripsi,
      g.imageUrl,
    ]),
  ];

  let storedPastoral: Array<{
    id: string;
    submittedAt: string;
    namaPemohon: string;
    rayon: string;
    telepon: string;
    kategori: string;
    lokasi: string;
    tanggalDiminta: string;
    waktuDiminta: string;
    pelayanDiharapkan: string;
    catatanPergumulan: string;
    status: string;
  }> = [];
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('gki_efata_pastoral_requests_v1') : null;
    if (raw) storedPastoral = JSON.parse(raw);
  } catch {
    // Ignore
  }

  const pastoralRows: CellValue[][] = [
    [
      'ID Permohonan',
      'Waktu Pengajuan (WIT)',
      'Nama Pemohon / Keluarga',
      'Wilayah Rayon',
      'Nomor WhatsApp',
      'Kategori Kunjungan',
      'Lokasi / Alamat / RS',
      'Rencana Tanggal',
      'Pilihan Waktu',
      'Pelayan Diharapkan',
      'Pokok Pergumulan / Keterangan',
      'Status Pelayanan',
    ],
    ...storedPastoral.map((p): CellValue[] => [
      p.id,
      p.submittedAt,
      p.namaPemohon,
      p.rayon,
      p.telepon,
      p.kategori,
      p.lokasi,
      p.tanggalDiminta,
      p.waktuDiminta,
      p.pelayanDiharapkan,
      p.catatanPergumulan,
      p.status,
    ]),
  ];

  return {
    [SHEET_TABS.PROFILE]: infoRows,
    [SHEET_TABS.LITURGY]: liturgyRows,
    [SHEET_TABS.SCHEDULES]: scheduleRows,
    [SHEET_TABS.WARTA]: wartaRows,
    [SHEET_TABS.CARE_HUT]: careHutRows,
    [SHEET_TABS.HYMNS]: hymnRows,
    [SHEET_TABS.FINANCE]: financeRows,
    [SHEET_TABS.STATS]: statsRows,
    [SHEET_TABS.GALLERY]: galleryRows,
    [SHEET_TABS.PASTORAL]: pastoralRows,
  };
}

export async function syncAllDataToSpreadsheet(
  accessToken: string,
  data: ChurchStoreData,
  options: { spreadsheetId?: string; newSpreadsheetTitle?: string }
): Promise<SheetSyncResult> {
  let meta: SpreadsheetMetadata;

  if (options.spreadsheetId) {
    meta = await getSpreadsheetMetadata(accessToken, options.spreadsheetId);
    const existingTitles = new Set(meta.sheets.map((s) => s.title));
    const missingTabs = ALL_SYNC_TAB_TITLES.filter((t) => !existingTitles.has(t));

    if (missingTabs.length > 0) {
      const addUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        meta.spreadsheetId
      )}:batchUpdate`;
      const addRes = await sheetsFetch<{
        replies?: Array<{ addSheet?: { properties?: { sheetId?: number; title?: string } } }>;
      }>(addUrl, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          requests: missingTabs.map((title) => ({
            addSheet: {
              properties: {
                title,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          })),
        }),
      });

      for (const reply of addRes.replies || []) {
        const props = reply.addSheet?.properties;
        if (props?.title && typeof props.sheetId === 'number') {
          meta.sheets.push({ sheetId: props.sheetId, title: props.title });
        }
      }
    }
  } else {
    meta = await createChurchSpreadsheet(
      accessToken,
      options.newSpreadsheetTitle || 'Portal Data GKI Efata Malanu'
    );
  }

  const syncedAtIso = new Date().toISOString();
  const payloads = buildSheetPayloads(data, syncedAtIso);

  // Clear existing ranges on target tabs so deleted items don't leave stale trailing rows
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    meta.spreadsheetId
  )}/values:batchClear`;
  await sheetsFetch(clearUrl, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      ranges: ALL_SYNC_TAB_TITLES.map((t) => `${a1Tab(t)}!A:Z`),
    }),
  });

  // Batch write all 9 tabs atomically
  const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    meta.spreadsheetId
  )}/values:batchUpdate`;
  const dataEntries = Object.entries(payloads).map(([tabTitle, values]) => ({
    range: `${a1Tab(tabTitle)}!A1`,
    majorDimension: 'ROWS',
    values,
  }));

  await sheetsFetch(batchUpdateUrl, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dataEntries,
    }),
  });

  // Format header rows on our 9 tabs (warm orange tint + bold white text) — best-effort
  const targetSheetIds = meta.sheets
    .filter((s) => (ALL_SYNC_TAB_TITLES as readonly string[]).includes(s.title))
    .map((s) => s.sheetId);

  if (targetSheetIds.length > 0) {
    const formatUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      meta.spreadsheetId
    )}:batchUpdate`;
    await sheetsFetch(formatUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        requests: targetSheetIds.flatMap((sheetId) => [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.604, green: 0.204, blue: 0.071 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ]),
      }),
    }).catch(() => {
      // Non-critical styling failure should not fail successful data sync
    });
  }

  const totalRows = Object.values(payloads).reduce(
    (sum, rows) => sum + Math.max(0, rows.length - 1),
    0
  );

  return {
    spreadsheetId: meta.spreadsheetId,
    spreadsheetUrl: meta.spreadsheetUrl,
    title: meta.title,
    syncedAt: new Date().toLocaleString('id-ID'),
    totalRows,
    tabsUpdated: dataEntries.length,
  };
}

function toNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  const cleaned = String(val ?? '')
    .replace(/[^\d.-]/g, '')
    .trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && cleaned !== '' ? parsed : fallback;
}

function toStr(val: unknown): string {
  return String(val ?? '').trim();
}

export async function pullAllDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  currentData: ChurchStoreData
): Promise<SheetPullResult> {
  // Always fetch spreadsheet metadata first to identify actual tab titles (avoid assuming Sheet1)
  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const availableTitleSet = new Set(meta.sheets.map((s) => s.title));
  const tabsToRead = ALL_SYNC_TAB_TITLES.filter((t) => availableTitleSet.has(t));

  if (tabsToRead.length === 0) {
    throw new Error(
      `Spreadsheet "${meta.title}" belum memiliki tab data portal (${ALL_SYNC_TAB_TITLES.slice(0, 3).join(', ')}, ...). Silakan lakukan Sinkronkan ke Sheet terlebih dahulu.`
    );
  }

  const params = new URLSearchParams();
  for (const tab of tabsToRead) {
    params.append('ranges', `${a1Tab(tab)}!A1:Z1000`);
  }

  const batchGetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    meta.spreadsheetId
  )}/values:batchGet?${params.toString()}`;

  const res = await sheetsFetch<{
    valueRanges?: Array<{ range?: string; values?: string[][] }>;
  }>(batchGetUrl, accessToken);

  const rowsByTab = new Map<string, string[][]>();
  (res.valueRanges || []).forEach((vr, index) => {
    const tabName = tabsToRead[index];
    if (tabName) {
      rowsByTab.set(tabName, vr.values || []);
    }
  });

  const updatedData: Partial<ChurchStoreData> = {};

  // Clone base structures so partial tab reads preserve existing values
  const nextProfile: ChurchProfile = {
    ...currentData.profile,
    rekeningList: [...currentData.profile.rekeningList],
  };
  const nextLiturgy = { ...currentData.liturgy, steps: [...currentData.liturgy.steps] };
  const nextWarta = {
    ...currentData.warta,
    pengumuman: [...currentData.warta.pengumuman],
    hutJemaat: [...currentData.warta.hutJemaat],
    beritaDukaSakit: [...currentData.warta.beritaDukaSakit],
  };
  const nextFinance = {
    ...currentData.finance,
    penerimaan: [...currentData.finance.penerimaan],
    pengeluaran: [...currentData.finance.pengeluaran],
  };
  const nextStatistics = {
    ...currentData.statistics,
    rayonList: [...currentData.statistics.rayonList],
    majelisJemaat: [...currentData.statistics.majelisJemaat],
  };

  // 1. Info & Profil
  const infoRows = rowsByTab.get(SHEET_TABS.PROFILE);
  if (infoRows && infoRows.length > 1) {
    const parsedRek: ChurchProfile['rekeningList'] = [];
    for (const row of infoRows.slice(1)) {
      const section = toStr(row[0]);
      const key = toStr(row[1]);
      const value = toStr(row[2]);
      if (!section || !key) continue;

      if (section === 'Profile') {
        if (key === 'namaGereja') nextProfile.namaGereja = value;
        else if (key === 'klasis') nextProfile.klasis = value;
        else if (key === 'sinode') nextProfile.sinode = value;
        else if (key === 'alamat') nextProfile.alamat = value;
        else if (key === 'teleponSekretariat') nextProfile.teleponSekretariat = value;
        else if (key === 'whatsappSekretariat') nextProfile.whatsappSekretariat = value;
        else if (key === 'email') nextProfile.email = value;
        else if (key === 'mapsQuery') nextProfile.mapsQuery = value;
        else if (key === 'sejarahSingkat') nextProfile.sejarahSingkat = value;
      } else if (section === 'Rekening' && value) {
        parsedRek.push({
          id: key,
          bank: value,
          nomor: toStr(row[3]),
          atasNama: toStr(row[4]),
          peruntukan: toStr(row[5]),
        });
      } else if (section === 'Liturgy') {
        if (key === 'mingguTanggal') nextLiturgy.mingguTanggal = value;
        else if (key === 'tahunGerejawi') nextLiturgy.tahunGerejawi = value;
        else if (key === 'temaPelayanan') nextLiturgy.temaPelayanan = value;
        else if (key === 'ayatMingguIni') nextLiturgy.ayatMingguIni = value;
        else if (key === 'ayatReferensi') nextLiturgy.ayatReferensi = value;
        else if (key === 'pelayanFirman') nextLiturgy.pelayanFirman = value;
        else if (key === 'jamIbadah') nextLiturgy.jamIbadah = value;
      } else if (section === 'Warta') {
        if (key === 'edisi') nextWarta.edisi = value;
        else if (key === 'tanggalMinggu') nextWarta.tanggalMinggu = value;
        else if (key === 'allowPdfDownload')
          nextWarta.allowPdfDownload = value.toLowerCase() === 'true';
        else if (key === 'pdfUrl') nextWarta.pdfUrl = value;
        else if (key === 'pdfFileName') nextWarta.pdfFileName = value;
      } else if (section === 'Finance') {
        if (key === 'periodeLaporan') nextFinance.periodeLaporan = value;
        else if (key === 'kasJemaat') nextFinance.kasJemaat = toNum(value, nextFinance.kasJemaat);
        else if (key === 'persembahanMingguLalu')
          nextFinance.persembahanMingguLalu = toNum(value, nextFinance.persembahanMingguLalu);
        else if (key === 'namaProyekPembangunan') nextFinance.namaProyekPembangunan = value;
        else if (key === 'targetPembangunan')
          nextFinance.targetPembangunan = toNum(value, nextFinance.targetPembangunan);
        else if (key === 'terkumpulPembangunan')
          nextFinance.terkumpulPembangunan = toNum(value, nextFinance.terkumpulPembangunan);
      } else if (section === 'Statistics') {
        if (key === 'tahunData') nextStatistics.tahunData = value;
        else if (key === 'totalKK') nextStatistics.totalKK = toNum(value, nextStatistics.totalKK);
        else if (key === 'totalJiwa')
          nextStatistics.totalJiwa = toNum(value, nextStatistics.totalJiwa);
        else if (key === 'pria') nextStatistics.pria = toNum(value, nextStatistics.pria);
        else if (key === 'wanita') nextStatistics.wanita = toNum(value, nextStatistics.wanita);
      }
    }
    if (parsedRek.length > 0) nextProfile.rekeningList = parsedRek;
    updatedData.profile = nextProfile;
  }

  // 2. Tata Ibadah Steps
  const liturgyRows = rowsByTab.get(SHEET_TABS.LITURGY);
  if (liturgyRows && liturgyRows.length > 1) {
    const parsedSteps: LiturgyStep[] = liturgyRows
      .slice(1)
      .filter((r) => toStr(r[2]))
      .map((r, idx) => {
        const sikap = toStr(r[9]);
        return {
          id: toStr(r[0]) || `lit-sheet-${idx + 1}`,
          urutan: toNum(r[1], idx + 1),
          bagian: toStr(r[2]),
          petugas: toStr(r[3]) || 'Pelayan Firman',
          keterangan: toStr(r[4]),
          isi: toStr(r[5]),
          nyanyianKode: toStr(r[6]) || undefined,
          nyanyianJudul: toStr(r[7]) || undefined,
          nyanyianLirik: toStr(r[8]) || undefined,
          sikapJemaat: sikap === 'Berdiri' || sikap === 'Duduk' ? sikap : undefined,
        };
      });
    if (parsedSteps.length > 0) nextLiturgy.steps = parsedSteps;
    updatedData.liturgy = nextLiturgy;
  } else if (updatedData.profile) {
    updatedData.liturgy = nextLiturgy;
  }

  // 3. Jadwal Ibadah
  const scheduleRows = rowsByTab.get(SHEET_TABS.SCHEDULES);
  if (scheduleRows && scheduleRows.length > 1) {
    const parsedSchedules: ScheduleItem[] = scheduleRows
      .slice(1)
      .filter((r) => toStr(r[1]))
      .map((r, idx) => {
        const rawKat = toStr(r[2]);
        const kategori: ScheduleCategory =
          rawKat === 'Minggu' || rawKat === 'Unsur' || rawKat === 'Rayon' ? rawKat : 'Rayon';
        const rawUnsur = toStr(r[3]);
        const unsur =
          rawUnsur === 'PKB' || rawUnsur === 'PW' || rawUnsur === 'PAM' || rawUnsur === 'PAR'
            ? rawUnsur
            : undefined;
        const rayonNum = toNum(r[4], 0);
        const rayon =
          rayonNum >= 1 && rayonNum <= 5 ? (rayonNum as 1 | 2 | 3 | 4 | 5) : undefined;
        return {
          id: toStr(r[0]) || `sch-sheet-${idx + 1}`,
          judul: toStr(r[1]),
          kategori,
          unsur: kategori === 'Unsur' ? unsur : undefined,
          rayon: kategori === 'Rayon' ? rayon : undefined,
          hariTanggal: toStr(r[5]),
          waktu: toStr(r[6]),
          tempat: toStr(r[7]),
          alamat: toStr(r[8]),
          pemimpin: toStr(r[9]),
          mapsQuery: toStr(r[10]) || 'GKI Efata Malanu Sorong',
          catatan: toStr(r[11]) || undefined,
        };
      });
    if (parsedSchedules.length > 0) updatedData.schedules = parsedSchedules;
  }

  // 4. Warta Jemaat
  const wartaRows = rowsByTab.get(SHEET_TABS.WARTA);
  if (wartaRows && wartaRows.length > 1) {
    const parsedPengumuman: WartaAnnouncement[] = wartaRows
      .slice(1)
      .filter((r) => toStr(r[1]))
      .map((r, idx) => {
        const rawKat = toStr(r[2]);
        const kategori: WartaAnnouncement['kategori'] =
          rawKat === 'Umum' || rawKat === 'Pelayanan' || rawKat === 'Sidang' || rawKat === 'Diakonia'
            ? rawKat
            : 'Umum';
        return {
          id: toStr(r[0]) || `w-sheet-${idx + 1}`,
          judul: toStr(r[1]),
          kategori,
          tanggalTerbit: toStr(r[3]),
          isi: toStr(r[4]),
        };
      });
    nextWarta.pengumuman = parsedPengumuman;
  }

  // 5. HUT & Pokok Doa
  const careHutRows = rowsByTab.get(SHEET_TABS.CARE_HUT);
  if (careHutRows && careHutRows.length > 1) {
    const parsedHut: BirthdayEntry[] = [];
    const parsedCare: CareNewsEntry[] = [];
    careHutRows.slice(1).forEach((r, idx) => {
      const tipe = toStr(r[0]);
      const id = toStr(r[1]) || `item-sheet-${idx + 1}`;
      const nama = toStr(r[2]);
      const rayon = toStr(r[3]);
      const col4 = toStr(r[4]);
      const col5 = toStr(r[5]);
      if (!nama) return;

      if (tipe === 'HUT') {
        parsedHut.push({ id, nama, rayon, tanggal: col4 });
      } else if (tipe === 'Sakit' || tipe === 'Duka') {
        parsedCare.push({ id, jenis: tipe, nama, rayon, keterangan: col5 });
      }
    });
    nextWarta.hutJemaat = parsedHut;
    nextWarta.beritaDukaSakit = parsedCare;
  }

  if (wartaRows || careHutRows || updatedData.profile) {
    updatedData.warta = nextWarta;
  }

  // 6. Nyanyian Rohani
  const hymnRows = rowsByTab.get(SHEET_TABS.HYMNS);
  if (hymnRows && hymnRows.length > 1) {
    const parsedHymns: HymnItem[] = hymnRows
      .slice(1)
      .filter((r) => toStr(r[3]))
      .map((r, idx) => {
        const rawKat = toStr(r[1]);
        const kategori: HymnCategory =
          rawKat === 'NR' || rawKat === 'KJ' || rawKat === 'Mazmur' || rawKat === 'Suara Gembira'
            ? rawKat
            : 'NR';
        const rawBait = toStr(r[5]);
        const bait = rawBait
          ? rawBait
              .split(/\n\s*---\s*\n/g)
              .map((b) => b.trim())
              .filter(Boolean)
          : [];
        return {
          id: toStr(r[0]) || `hymn-sheet-${idx + 1}`,
          kategori,
          nomor: toNum(r[2], idx + 1),
          judul: toStr(r[3]),
          nadaDasar: toStr(r[4]) || 'C = do',
          bait,
        };
      });
    if (parsedHymns.length > 0) updatedData.hymns = parsedHymns;
  }

  // 7. Keuangan
  const financeRows = rowsByTab.get(SHEET_TABS.FINANCE);
  if (financeRows && financeRows.length > 1) {
    const penerimaan: FinanceTransaction[] = [];
    const pengeluaran: FinanceTransaction[] = [];
    financeRows.slice(1).forEach((r, idx) => {
      const jenis = toStr(r[0]);
      const uraian = toStr(r[3]);
      if (!uraian) return;
      const tx: FinanceTransaction = {
        id: toStr(r[1]) || `tx-sheet-${idx + 1}`,
        tanggal: toStr(r[2]),
        uraian,
        jumlah: toNum(r[4], 0),
      };
      if (jenis === 'Pengeluaran') {
        pengeluaran.push(tx);
      } else if (jenis === 'Penerimaan') {
        penerimaan.push(tx);
      }
    });
    nextFinance.penerimaan = penerimaan;
    nextFinance.pengeluaran = pengeluaran;
  }
  if (financeRows || updatedData.profile) {
    updatedData.finance = nextFinance;
  }

  // 8. Statistik & Majelis
  const statsRows = rowsByTab.get(SHEET_TABS.STATS);
  if (statsRows && statsRows.length > 1) {
    const rayonList: RayonStat[] = [];
    const majelisJemaat: MajelisMember[] = [];
    statsRows.slice(1).forEach((r, idx) => {
      const tipe = toStr(r[0]);
      if (tipe === 'Rayon') {
        rayonList.push({
          rayon: toNum(r[1], rayonList.length + 1),
          namaWilayah: toStr(r[2]),
          koordinator: toStr(r[3]),
          jumlahKK: toNum(r[4], 0),
          jumlahJiwa: toNum(r[5], 0),
        });
      } else if (tipe === 'Majelis') {
        majelisJemaat.push({
          id: toStr(r[1]) || `mj-sheet-${idx + 1}`,
          jabatan: toStr(r[2]),
          nama: toStr(r[3]),
          bidang: toStr(r[4]),
        });
      }
    });
    if (rayonList.length > 0) nextStatistics.rayonList = rayonList;
    if (majelisJemaat.length > 0) nextStatistics.majelisJemaat = majelisJemaat;
  }
  if (statsRows || updatedData.profile) {
    updatedData.statistics = nextStatistics;
  }

  // 9. Galeri
  const galleryRows = rowsByTab.get(SHEET_TABS.GALLERY);
  if (galleryRows && galleryRows.length > 1) {
    const parsedGallery: GalleryItem[] = galleryRows
      .slice(1)
      .filter((r) => toStr(r[1]))
      .map((r, idx) => ({
        id: toStr(r[0]) || `gal-sheet-${idx + 1}`,
        judul: toStr(r[1]),
        tanggal: toStr(r[2]),
        deskripsi: toStr(r[3]),
        imageUrl: toStr(r[4]),
      }));
    if (parsedGallery.length > 0) updatedData.gallery = parsedGallery;
  }

  // 10. Kunjungan Pastoral
  const pastoralRows = rowsByTab.get(SHEET_TABS.PASTORAL);
  if (pastoralRows && pastoralRows.length > 1) {
    const parsedPastoral = pastoralRows
      .slice(1)
      .filter((r) => toStr(r[2]))
      .map((r, idx) => ({
        id: toStr(r[0]) || `pastoral-sheet-${idx + 1}`,
        submittedAt: toStr(r[1]),
        namaPemohon: toStr(r[2]),
        rayon: toStr(r[3]),
        telepon: toStr(r[4]),
        kategori: toStr(r[5]) || 'Kunjungan Sakit / RS',
        lokasi: toStr(r[6]),
        tanggalDiminta: toStr(r[7]),
        waktuDiminta: toStr(r[8]),
        pelayanDiharapkan: toStr(r[9]),
        catatanPergumulan: toStr(r[10]),
        status: (toStr(r[11]) || 'Diajukan') as any,
        syncedToSheets: true,
      }));
    if (parsedPastoral.length > 0 && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gki_efata_pastoral_requests_v1', JSON.stringify(parsedPastoral));
      } catch {
        // Ignore
      }
    }
  }

  return {
    spreadsheetId: meta.spreadsheetId,
    spreadsheetUrl: meta.spreadsheetUrl,
    title: meta.title,
    updatedData,
    summary: {
      liturgySteps: updatedData.liturgy?.steps.length ?? 0,
      schedules: updatedData.schedules?.length ?? 0,
      announcements: updatedData.warta?.pengumuman.length ?? 0,
      hutAndCare:
        (updatedData.warta?.hutJemaat.length ?? 0) +
        (updatedData.warta?.beritaDukaSakit.length ?? 0),
      hymns: updatedData.hymns?.length ?? 0,
      financeTx:
        (updatedData.finance?.penerimaan.length ?? 0) +
        (updatedData.finance?.pengeluaran.length ?? 0),
      statsRows:
        (updatedData.statistics?.rayonList.length ?? 0) +
        (updatedData.statistics?.majelisJemaat.length ?? 0),
      gallery: updatedData.gallery?.length ?? 0,
    },
  };
}
