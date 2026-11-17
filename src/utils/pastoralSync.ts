import { sheetsFetch, a1Tab, getSpreadsheetMetadata } from './googleSheetsSync';

export const PASTORAL_SHEET_TAB = 'Kunjungan Pastoral';

export type PastoralCategory =
  | 'Kunjungan Sakit / RS'
  | 'Penguatan Iman & Konseling'
  | 'Syukur Keluarga / Rumah Baru'
  | 'Lansia & Diakonia'
  | 'Penghiburan / Duka';

export interface PastoralVisitRequest {
  id: string;
  namaPemohon: string;
  rayon: string;
  telepon: string;
  kategori: PastoralCategory;
  lokasi: string;
  tanggalDiminta: string;
  waktuDiminta: string;
  pelayanDiharapkan: string;
  catatanPergumulan: string;
  status: 'Diajukan' | 'Diterima' | 'Dijadwalkan' | 'Selesai';
  submittedAt: string;
  syncedToSheets?: boolean;
}

export const STORAGE_PASTORAL_KEY = 'gki_efata_pastoral_requests_v1';

export function loadStoredPastoralRequests(): PastoralVisitRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_PASTORAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredPastoralRequests(requests: PastoralVisitRequest[]): void {
  try {
    localStorage.setItem(STORAGE_PASTORAL_KEY, JSON.stringify(requests));
  } catch {
    // Ignore storage quota errors
  }
}

export function getActiveSpreadsheetConfig(): {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
} | null {
  try {
    const raw = localStorage.getItem('gki_efata_google_sheet_config_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.spreadsheetId === 'string' && parsed.spreadsheetId) {
      return {
        spreadsheetId: parsed.spreadsheetId,
        title: parsed.title || 'Spreadsheet GKI Efata Malanu',
        spreadsheetUrl:
          parsed.spreadsheetUrl ||
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(parsed.spreadsheetId)}/edit`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Appends a pastoral visit record into the dedicated 'Kunjungan Pastoral' sheet tab in Google Sheets.
 * If the sheet tab does not exist yet, creates it with frozen header row.
 */
export async function appendPastoralVisitToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  record: PastoralVisitRequest
): Promise<boolean> {
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    const existingTitles = new Set(meta.sheets.map((s) => s.title));

    // 1. Create tab 'Kunjungan Pastoral' if not yet present
    if (!existingTitles.has(PASTORAL_SHEET_TAB)) {
      const addUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}:batchUpdate`;
      await sheetsFetch(addUrl, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: PASTORAL_SHEET_TAB,
                  gridProperties: { frozenRowCount: 1 },
                  tabColor: { red: 0.6, green: 0.2, blue: 0.07 }, // Burnt orange tab color
                },
              },
            },
          ],
        }),
      });
    }

    // 2. Check header row
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${a1Tab(PASTORAL_SHEET_TAB)}!A1:L1`;
    const getRes = await sheetsFetch<{ values?: string[][] }>(getUrl, accessToken);

    if (!getRes.values || getRes.values.length === 0) {
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${a1Tab(PASTORAL_SHEET_TAB)}!A1?valueInputOption=USER_ENTERED`;
      await sheetsFetch(headerUrl, accessToken, {
        method: 'PUT',
        body: JSON.stringify({
          range: `${a1Tab(PASTORAL_SHEET_TAB)}!A1`,
          majorDimension: 'ROWS',
          values: [
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
          ],
        }),
      });
    }

    // 3. Append row
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${a1Tab(PASTORAL_SHEET_TAB)}!A:L:append?valueInputOption=USER_ENTERED`;
    await sheetsFetch(appendUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        range: `${a1Tab(PASTORAL_SHEET_TAB)}!A:L`,
        majorDimension: 'ROWS',
        values: [
          [
            record.id,
            record.submittedAt,
            record.namaPemohon,
            record.rayon,
            record.telepon,
            record.kategori,
            record.lokasi,
            record.tanggalDiminta,
            record.waktuDiminta,
            record.pelayanDiharapkan,
            record.catatanPergumulan,
            record.status,
          ],
        ],
      }),
    });

    return true;
  } catch (err) {
    console.error('Failed to append pastoral visit to Google Sheet:', err);
    return false;
  }
}
