import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/contacts.readonly',
];
export const DRIVE_SCOPES = WORKSPACE_SCOPES;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of WORKSPACE_SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
// Access token is kept strictly in memory (never localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

function getFirebaseAuthErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String((err as { code?: unknown }).code || '');
  }
  return '';
}

export function formatDriveAuthError(err: unknown): string {
  const code = getFirebaseAuthErrorCode(err);
  const msg = err instanceof Error ? err.message : String(err || '');

  if (code === 'auth/popup-closed-by-user' || msg.includes('auth/popup-closed-by-user')) {
    return 'Proses masuk Google dibatalkan karena jendela pop-up ditutup.';
  }
  if (code === 'auth/popup-blocked' || msg.includes('auth/popup-blocked')) {
    return 'Pop-up login Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi, atau gunakan opsi Link Drive / Pilih File PNG.';
  }
  if (code === 'auth/cancelled-popup-request' || msg.includes('auth/cancelled-popup-request')) {
    return 'Permintaan login sebelumnya dibatalkan.';
  }
  if (code === 'auth/unauthorized-domain' || msg.includes('auth/unauthorized-domain')) {
    return 'Domain pratinjau ini belum diizinkan untuk pop-up login Google. Gunakan opsi Pilih File Lokal atau Link Share Google Drive di bawah.';
  }
  if (code === 'auth/network-request-failed' || msg.includes('auth/network-request-failed')) {
    return 'Koneksi internet terputus saat menghubungi layanan login Google.';
  }
  return msg || 'Gagal masuk dengan Google.';
}

export function extractGoogleDriveFileId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Direct file ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  // https://drive.google.com/file/d/<ID>/view...
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) return fileMatch[1];
  // ?id=<ID> or &id=<ID>
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch?.[1]) return queryMatch[1];
  return null;
}

export function getPublicDriveImageCandidates(fileId: string): string[] {
  return [
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1000`,
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`,
  ];
}

export const googleSignInForDrive = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  if (isSigningIn) return null;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Token akses Google Drive tidak tersedia. Silakan coba masuk kembali.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    const code = getFirebaseAuthErrorCode(err);
    const msg = err instanceof Error ? err.message : String(err || '');
    // Suppress benign popup cancellation so UI stays stable without error banners
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      msg.includes('auth/popup-closed-by-user') ||
      msg.includes('auth/cancelled-popup-request')
    ) {
      return null;
    }
    throw new Error(formatDriveAuthError(err));
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => cachedAccessToken;

export const invalidateDriveAccessToken = (): void => {
  cachedAccessToken = null;
};

export const getDriveCurrentUser = (): User | null => auth.currentUser;

export const logoutDrive = async (): Promise<void> => {
  cachedAccessToken = null;
  await auth.signOut();
};

async function driveFetchJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Sesi Google Drive berakhir. Silakan masuk kembali dengan Google.');
    }
    throw new Error(`Gagal mengakses Google Drive (${res.status}): ${errText || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function findDriveFileByName(
  accessToken: string,
  exactFileName = 'Logo_GKI_Big.png'
): Promise<DriveFileMeta[]> {
  const safeName = exactFileName.replace(/'/g, "\\'");
  const q = `name = '${safeName}' and trashed = false`;
  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    new URLSearchParams({
      q,
      fields: 'files(id,name,mimeType,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
      pageSize: '10',
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
    }).toString();

  const data = await driveFetchJson<{ files?: DriveFileMeta[] }>(url, accessToken);
  return data.files ?? [];
}

export async function searchDriveImageFiles(
  accessToken: string,
  keyword = 'Logo'
): Promise<DriveFileMeta[]> {
  const safeKeyword = keyword.trim().replace(/'/g, "\\'");
  const q = safeKeyword
    ? `name contains '${safeKeyword}' and mimeType contains 'image/' and trashed = false`
    : `mimeType contains 'image/' and trashed = false`;

  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    new URLSearchParams({
      q,
      fields: 'files(id,name,mimeType,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
      pageSize: '15',
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
    }).toString();

  const data = await driveFetchJson<{ files?: DriveFileMeta[] }>(url, accessToken);
  return data.files ?? [];
}

export async function searchDriveSpreadsheets(
  accessToken: string,
  keyword = ''
): Promise<DriveFileMeta[]> {
  const safeKeyword = keyword.trim().replace(/'/g, "\\'");
  const q = safeKeyword
    ? `name contains '${safeKeyword}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    : `mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;

  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    new URLSearchParams({
      q,
      fields: 'files(id,name,mimeType,modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: '15',
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
    }).toString();

  const data = await driveFetchJson<{ files?: DriveFileMeta[] }>(url, accessToken);
  return data.files ?? [];
}

export function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];
  return extractGoogleDriveFileId(trimmed);
}

export async function blobToOptimizedLogoDataUrl(blob: Blob): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca data gambar logo.'));
    reader.readAsDataURL(blob);
  });

  // Load into an Image to check dimensions and ensure it stays compact enough for persistent localStorage & favicon
  return await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 512;
      if (img.width <= maxDim && img.height <= maxDim && rawDataUrl.length <= 450_000) {
        resolve(rawDataUrl);
        return;
      }
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

export async function downloadDriveImageAsDataUrl(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Sesi Google Drive berakhir. Silakan masuk kembali dengan Google.');
    }
    throw new Error(`Gagal mengunduh file logo (${res.status}).`);
  }
  const blob = await res.blob();
  return blobToOptimizedLogoDataUrl(blob);
}
