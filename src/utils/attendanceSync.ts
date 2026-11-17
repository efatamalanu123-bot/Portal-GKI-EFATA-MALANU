import {
  ChurchStoreData,
  ScheduleItem,
} from '../types/church';
import { sheetsFetch, a1Tab, getSpreadsheetMetadata } from './googleSheetsSync';

export const ATTENDANCE_SHEET_TAB = 'Kehadiran Ibadah';

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  scheduleTitle: string;
  hariTanggal: string;
  waktu: string;
  tempat: string;
  scannedAt: string;
  deviceUuid: string;
}

export const STORAGE_ATTENDANCE_LOGS_KEY = 'gki_efata_attendance_logs_v1';

export function loadStoredAttendanceLogs(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_ATTENDANCE_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredAttendanceLogs(logs: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_ATTENDANCE_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota errors
  }
}

export function getOrCreateDeviceUuid(): string {
  const key = 'gki_efata_device_uuid_v1';
  try {
    let uuid = localStorage.getItem(key);
    if (!uuid) {
      uuid = `dev-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
      localStorage.setItem(key, uuid);
    }
    return uuid;
  } catch {
    return 'dev-anonymous';
  }
}

export async function appendAttendanceToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  record: AttendanceRecord
): Promise<boolean> {
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    const existingTitles = new Set(meta.sheets.map((s) => s.title));

    // Create tab if not present
    if (!existingTitles.has(ATTENDANCE_SHEET_TAB)) {
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
                  title: ATTENDANCE_SHEET_TAB,
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });
    }

    // Check if header row exists, if not write header
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${a1Tab(ATTENDANCE_SHEET_TAB)}!A1:F1`;
    const getRes = await sheetsFetch<{ values?: string[][] }>(getUrl, accessToken);

    if (!getRes.values || getRes.values.length === 0) {
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${a1Tab(ATTENDANCE_SHEET_TAB)}!A1?valueInputOption=USER_ENTERED`;
      await sheetsFetch(headerUrl, accessToken, {
        method: 'PUT',
        body: JSON.stringify({
          range: `${a1Tab(ATTENDANCE_SHEET_TAB)}!A1`,
          majorDimension: 'ROWS',
          values: [['ID', 'Jadwal Ibadah', 'Hari & Tanggal', 'Waktu', 'Tempat Check-In', 'Waktu Presensi (WIT)', 'Device ID']],
        }),
      });
    }

    // Append row
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${a1Tab(ATTENDANCE_SHEET_TAB)}!A:G:append?valueInputOption=USER_ENTERED`;
    await sheetsFetch(appendUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        range: `${a1Tab(ATTENDANCE_SHEET_TAB)}!A:G`,
        majorDimension: 'ROWS',
        values: [
          [
            record.id,
            record.scheduleTitle,
            record.hariTanggal,
            record.waktu,
            record.tempat,
            record.scannedAt,
            record.deviceUuid,
          ],
        ],
      }),
    });

    return true;
  } catch (err) {
    console.error('Failed to append attendance to Google Sheet:', err);
    return false;
  }
}
