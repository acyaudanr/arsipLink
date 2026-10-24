import type { ParsedSheet } from "@/lib/types";

export type CachedSheetInfo = {
  index: number;
  sheetName: string;
  rowCount: number;
  columnCount: number;
  titles?: string[];
};

export type CachedFileMeta = {
  name: string;
  modifiedTime: string | null;
  sheets: CachedSheetInfo[];
};

const CLIENT_TTL_MS = 30 * 60 * 1000;

type MetaEntry = CachedFileMeta & { expiresAt: number };
type SheetEntry = { data: ParsedSheet; expiresAt: number };

const fileMetaCache = new Map<string, MetaEntry>();
const sheetCache = new Map<string, SheetEntry>();

function sheetKey(fileId: string, index: number) {
  return `${fileId}:${index}`;
}

export function getCachedFileMeta(fileId: string): CachedFileMeta | null {
  const hit = fileMetaCache.get(fileId);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    fileMetaCache.delete(fileId);
    return null;
  }
  return { name: hit.name, modifiedTime: hit.modifiedTime, sheets: hit.sheets };
}

export function setCachedFileMeta(fileId: string, meta: CachedFileMeta) {
  fileMetaCache.set(fileId, { ...meta, expiresAt: Date.now() + CLIENT_TTL_MS });
}

export function getCachedSheet(fileId: string, index: number): ParsedSheet | null {
  const hit = sheetCache.get(sheetKey(fileId, index));
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    sheetCache.delete(sheetKey(fileId, index));
    return null;
  }
  return hit.data;
}

export function setCachedSheet(fileId: string, index: number, data: ParsedSheet) {
  sheetCache.set(sheetKey(fileId, index), {
    data,
    expiresAt: Date.now() + CLIENT_TTL_MS,
  });
}

/** Hapus cache client untuk satu file (dipakai tombol sync). */
export function invalidateClientFileCache(fileId: string) {
  fileMetaCache.delete(fileId);
  const prefix = `${fileId}:`;
  for (const key of sheetCache.keys()) {
    if (key.startsWith(prefix)) sheetCache.delete(key);
  }
}
