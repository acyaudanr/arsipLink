"use client";

import { useEffect, useRef, useState } from "react";
import ExcelViewer from "@/components/ExcelViewer";
import type { ParsedSheet } from "@/lib/types";
import type { SheetOption } from "@/components/PreviewNav";
import {
  getCachedFileMeta,
  getCachedSheet,
  invalidateClientFileCache,
  setCachedFileMeta,
  setCachedSheet,
  type CachedSheetInfo,
} from "@/lib/drive/client-cache";

type SheetInfo = CachedSheetInfo;

function toOptions(sheets: SheetInfo[]): SheetOption[] {
  return sheets.map((s) => ({
    index: s.index,
    sheetName: s.sheetName,
    rowCount: s.rowCount,
  }));
}

export default function DriveFileViewer({
  fileId,
  activeSheet,
  onSheetsLoaded,
  onSheetsLoading,
  refreshToken = 0,
  onSyncDone,
}: {
  fileId: string;
  activeSheet: number;
  onSheetsLoaded: (sheets: SheetOption[]) => void;
  onSheetsLoading?: (loading: boolean) => void;
  refreshToken?: number;
  onSyncDone?: () => void;
}) {
  const [sheetInfos, setSheetInfos] = useState<SheetInfo[]>([]);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const appliedToken = useRef(0);
  const activeSheetRef = useRef(activeSheet);
  activeSheetRef.current = activeSheet;

  // Ganti file → reset
  useEffect(() => {
    appliedToken.current = 0;
    setSyncing(false);
  }, [fileId]);

  // Load meta (+ sheet aktif saat sync)
  useEffect(() => {
    let cancelled = false;
    const isSync = refreshToken > 0 && refreshToken !== appliedToken.current;
    if (isSync) appliedToken.current = refreshToken;

    (async () => {
      if (isSync) {
        invalidateClientFileCache(fileId);
        setSyncing(true);
      }

      const cachedMeta = !isSync ? getCachedFileMeta(fileId) : null;
      if (cachedMeta) {
        if (cancelled) return;
        setSheetInfos(cachedMeta.sheets);
        onSheetsLoaded(toOptions(cachedMeta.sheets));
        setLoadingInfo(false);
        onSheetsLoading?.(false);
        setError(null);
        return;
      }

      setLoadingInfo(true);
      onSheetsLoading?.(true);
      setError(null);
      if (isSync) setSheet(null);

      try {
        const qs = isSync ? "?fresh=1" : "";
        const res = await fetch(`/api/drive/files/${fileId}${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal membaca file");
        if (cancelled) return;

        const sheets = (json.sheets as SheetInfo[]) ?? [];
        setCachedFileMeta(fileId, {
          name: json.name ?? "File Drive",
          modifiedTime: json.modifiedTime ?? null,
          sheets,
        });
        setSheetInfos(sheets);
        onSheetsLoaded(toOptions(sheets));

        // Saat sync: langsung muat sheet aktif biar data baru langsung tampil
        if (isSync && sheets.length > 0) {
          const index = Math.min(
            Math.max(0, activeSheetRef.current),
            sheets.length - 1
          );
          setLoadingSheet(true);
          const sheetRes = await fetch(
            `/api/drive/files/${fileId}/sheets/${index}?fresh=1`
          );
          const sheetJson = await sheetRes.json();
          if (!sheetRes.ok) throw new Error(sheetJson.error ?? "Gagal membaca sheet");
          if (cancelled) return;
          const data = sheetJson as ParsedSheet;
          setCachedSheet(fileId, index, data);
          setSheet(data);
          setLoadingSheet(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal membaca file");
          setSheetInfos([]);
          onSheetsLoaded([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingInfo(false);
          onSheetsLoading?.(false);
          if (isSync) {
            setSyncing(false);
            onSyncDone?.();
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, refreshToken]);

  // Ganti tab: pakai cache client kalau ada
  useEffect(() => {
    if (syncing || sheetInfos.length === 0) return;
    const index = Math.min(Math.max(0, activeSheet), sheetInfos.length - 1);
    let cancelled = false;

    (async () => {
      const cached = getCachedSheet(fileId, index);
      if (cached) {
        setSheet(cached);
        setLoadingSheet(false);
        setError(null);
        return;
      }

      setLoadingSheet(true);
      setError(null);
      try {
        const res = await fetch(`/api/drive/files/${fileId}/sheets/${index}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal membaca sheet");
        if (!cancelled) {
          const data = json as ParsedSheet;
          setCachedSheet(fileId, index, data);
          setSheet(data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal membaca sheet");
      } finally {
        if (!cancelled) setLoadingSheet(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId, activeSheet, sheetInfos, syncing]);

  if (loadingInfo) {
    return (
      <p className="rounded-2xl border border-[#e8eaef] bg-white px-4 py-14 text-center text-[#8a91a0]">
        {syncing
          ? "Menyinkronkan data dari Google Drive..."
          : "Membaca file dari Google Drive... (file besar bisa butuh waktu)"}
      </p>
    );
  }
  if (error && sheetInfos.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="font-semibold text-red-600">File belum bisa dibaca</p>
        <p className="mx-auto mt-1 max-w-xl text-sm text-red-500">{error}</p>
      </div>
    );
  }
  if (sheetInfos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#d5d8e0] bg-white px-4 py-14 text-center text-[#6b7285]">
        Tidak ada sheet yang terbaca dari file ini.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error && (
        <p className="mb-3 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {loadingSheet || !sheet ? (
        <p className="rounded-2xl border border-[#e8eaef] bg-white px-4 py-14 text-center text-[#8a91a0]">
          {syncing ? "Menyinkronkan sheet..." : "Memuat sheet..."}
        </p>
      ) : (
        <div className="min-h-0 flex-1">
          <ExcelViewer key={`${fileId}-${activeSheet}`} sheet={sheet} />
        </div>
      )}
    </div>
  );
}
