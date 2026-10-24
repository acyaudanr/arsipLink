import { google, type drive_v3 } from "googleapis";
import { Readable } from "stream";

export const FOLDER_MIME = "application/vnd.google-apps.folder";
export const SHEETS_MIME = "application/vnd.google-apps.spreadsheet";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type DriveKind = "file" | "folder";

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  kind: DriveKind;
  isSpreadsheet: boolean;
  size: number | null;
  modifiedTime: string | null;
  webViewLink: string | null;
}

/** Ekstrak file/folder ID + jenisnya dari semua bentuk link Drive. */
export function parseDriveLink(input: string): { id: string; kind: DriveKind } | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return { id: s, kind: "file" };
  const folderMatch = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return { id: folderMatch[1], kind: "folder" };
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return { id: m[1], kind: "file" };
  }
  return null;
}

export function extractDriveFileId(input: string): string | null {
  return parseDriveLink(input)?.id ?? null;
}

export function getDrive(): drive_v3.Drive {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Server belum terhubung ke Google Drive: GOOGLE_SERVICE_ACCOUNT_JSON masih kosong. Isi credential Service Account dulu, dan share folder/file Drive ke email service account tersebut."
    );
  }
  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON tidak valid (harus isi file JSON key Service Account, satu baris).");
  }
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

function toItem(f: drive_v3.Schema$File): DriveItem {
  const mimeType = f.mimeType ?? "";
  return {
    id: f.id ?? "",
    name: f.name ?? "(tanpa nama)",
    mimeType,
    kind: mimeType === FOLDER_MIME ? "folder" : "file",
    isSpreadsheet:
      mimeType === SHEETS_MIME ||
      mimeType === XLSX_MIME ||
      mimeType === "application/vnd.ms-excel" ||
      mimeType === "text/csv" ||
      /\.(xlsx|xls|csv)$/i.test(f.name ?? ""),
    size: f.size ? Number(f.size) : null,
    modifiedTime: f.modifiedTime ?? null,
    webViewLink: f.webViewLink ?? null,
  };
}

const FILE_FIELDS = "id,name,mimeType,size,modifiedTime,webViewLink";

export async function getDriveItem(fileId: string): Promise<DriveItem> {
  const drive = getDrive();
  const res = await drive.files.get({ fileId, fields: FILE_FIELDS });
  return toItem(res.data);
}

/** List SEMUA isi satu folder (mengikuti pagination Drive sampai habis). */
export async function listFolderChildren(folderId: string): Promise<DriveItem[]> {
  const drive = getDrive();
  const items: DriveItem[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: `nextPageToken, files(${FILE_FIELDS})`,
      orderBy: "folder,name",
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files ?? []) items.push(toItem(f));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return items;
}

/** Ambil nama folder + rantai induknya untuk breadcrumb. */
export async function getFolderPath(
  folderId: string
): Promise<{ id: string; name: string }[]> {
  const drive = getDrive();
  const path: { id: string; name: string }[] = [];
  let current: string | null = folderId;
  let guard = 0;
  while (current && guard < 20) {
    const res: { data: drive_v3.Schema$File } = await drive.files.get({
      fileId: current,
      fields: "id,name,parents",
    });
    path.unshift({ id: res.data.id ?? current, name: res.data.name ?? "Folder" });
    current = res.data.parents?.[0] ?? null;
    guard++;
    // Berhenti di folder yang jadi link terdaftar akan ditangani UI; di sini cukup rantai Drive-nya
    if (current === folderId) break;
  }
  return path;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  return Buffer.concat(chunks);
}

export interface DriveFileData {
  fileId: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: number | null;
  buffer: Buffer;
}

export async function downloadDriveFile(fileId: string): Promise<DriveFileData> {
  const drive = getDrive();
  const meta = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,modifiedTime,size",
  });
  const name = meta.data.name ?? "File Drive";
  const mimeType = meta.data.mimeType ?? "";

  let buffer: Buffer;
  if (mimeType === SHEETS_MIME) {
    const res = await drive.files.export(
      { fileId, mimeType: XLSX_MIME },
      { responseType: "stream" }
    );
    buffer = await streamToBuffer(res.data as Readable);
  } else {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );
    buffer = await streamToBuffer(res.data as Readable);
  }

  return {
    fileId,
    name,
    mimeType,
    modifiedTime: meta.data.modifiedTime ?? null,
    size: meta.data.size ? Number(meta.data.size) : buffer.length,
    buffer,
  };
}

/** Cache parse di memori server (BUKAN database) supaya file besar tidak di-download berulang. */
interface CachedWorkbook {
  modifiedTime: string | null;
  name: string;
  expiresAt: number;
  parsed: import("@/lib/types").ParsedSheet[];
}
const workbookCache = new Map<string, CachedWorkbook>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function isServiceAccountConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

/**
 * Baca file TANPA login (untuk file yang sharing-nya "Anyone with the link").
 * Google Sheets diexport jadi xlsx; file .xlsx di Drive didownload langsung.
 */
async function downloadDriveFileAnonymous(fileId: string): Promise<DriveFileData> {
  const urls = [
    `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      // File Excel (.xlsx) selalu diawali magic bytes "PK" (zip). Kalau bukan,
      // berarti Google mengembalikan halaman login/HTML -> file tidak publik.
      const isZip = buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
      const contentType = res.headers.get("content-type") ?? "";
      if (!isZip && !contentType.includes("csv") && !contentType.includes("excel")) continue;
      const disposition = res.headers.get("content-disposition") ?? "";
      const nameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      return {
        fileId,
        name: nameMatch ? decodeURIComponent(nameMatch[1]) : "File Drive",
        mimeType: contentType,
        modifiedTime: null,
        size: buffer.length,
        buffer,
      };
    } catch {
      // coba URL berikutnya
    }
  }
  throw new Error(
    "File ini tidak bisa dibaca tanpa login. Set sharing-nya ke 'Anyone with the link can view', atau pakai Service Account dan share file ini ke email service account tersebut."
  );
}

export async function getParsedDriveFile(fileId: string) {
  const { parseExcelBuffer } = await import("@/lib/excel/parse");

  const cached = workbookCache.get(fileId);
  if (cached && cached.expiresAt > Date.now()) {
    return { name: cached.name, modifiedTime: cached.modifiedTime, sheets: cached.parsed, fromCache: true };
  }

  let file: DriveFileData;
  if (isServiceAccountConfigured()) {
    try {
      file = await downloadDriveFile(fileId);
    } catch {
      // Service Account tidak punya akses -> coba jalur publik (siapa tahu file-nya anyone-with-link)
      file = await downloadDriveFileAnonymous(fileId);
    }
  } else {
    file = await downloadDriveFileAnonymous(fileId);
  }

  const parsed = await parseExcelBuffer(file.buffer);
  workbookCache.set(fileId, {
    modifiedTime: file.modifiedTime,
    name: file.name,
    expiresAt: Date.now() + CACHE_TTL_MS,
    parsed,
  });
  return { name: file.name, modifiedTime: file.modifiedTime, sheets: parsed, fromCache: false };
}
