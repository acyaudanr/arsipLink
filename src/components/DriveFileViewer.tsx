"use client";

import { useEffect, useState } from "react";
import ExcelViewer from "@/components/ExcelViewer";
import type { ParsedSheet } from "@/lib/types";
import type { SheetOption } from "@/components/PreviewNav";

interface SheetInfo extends SheetOption {
  columnCount: number;
  titles?: string[];
}

export default function DriveFileViewer({
  fileId,
  activeSheet,
  onSheetsLoaded,
  onSheetsLoading,
}: {
  fileId: string;
  activeSheet: number;
  onSheetsLoaded: (sheets: SheetOption[]) => void;
  onSheetsLoading?: (loading: boolean) => void;
}) {
  const [sheetInfos, setSheetInfos] = useState<SheetInfo[]>([]);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingInfo(true);
      onSheetsLoading?.(true);
      setError(null);
      setSheet(null);
      onSheetsLoaded([]);
      try {
        const res = await fetch(`/api/drive/files/${fileId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal membaca file");
        if (!cancelled) {
          const sheets = (json.sheets as SheetInfo[]) ?? [];
          setSheetInfos(sheets);
          onSheetsLoaded(
            sheets.map((s) => ({
              index: s.index,
              sheetName: s.sheetName,
              rowCount: s.rowCount,
            }))
          );
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
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    if (sheetInfos.length === 0) return;
    const index = Math.min(Math.max(0, activeSheet), sheetInfos.length - 1);
    let cancelled = false;
    (async () => {
      setLoadingSheet(true);
      setError(null);
      try {
        const res = await fetch(`/api/drive/files/${fileId}/sheets/${index}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal membaca sheet");
        if (!cancelled) setSheet(json as ParsedSheet);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal membaca sheet");
      } finally {
        if (!cancelled) setLoadingSheet(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId, activeSheet, sheetInfos.length]);

  if (loadingInfo) {
    return (
      <p className="rounded-2xl border border-[#e8eaef] bg-white px-4 py-14 text-center text-[#8a91a0]">
        Membaca file dari Google Drive... (file besar bisa butuh waktu)
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
    <div>
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {loadingSheet || !sheet ? (
        <p className="rounded-2xl border border-[#e8eaef] bg-white px-4 py-14 text-center text-[#8a91a0]">
          Memuat sheet...
        </p>
      ) : (
        <ExcelViewer key={`${fileId}-${activeSheet}`} sheet={sheet} />
      )}
    </div>
  );
}
