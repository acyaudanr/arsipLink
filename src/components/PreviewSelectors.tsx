"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchableSelect from "@/components/SearchableSelect";
import type { DriveFolder, ExcelDocument } from "@/lib/types";
import type { SheetOption } from "@/components/PreviewNav";

function fileHref(file: ExcelDocument) {
  const title = encodeURIComponent(file.title);
  if (file.drive_kind === "folder" && file.drive_file_id) {
    return `/drive/folder/${file.drive_file_id}?root=${file.drive_file_id}&title=${title}`;
  }
  return `/drive/file/${file.drive_file_id}?title=${title}`;
}

export default function PreviewSelectors({
  folders,
  currentFolder,
  files,
  currentFileId,
  sheets,
  activeSheet,
  onSheetChange,
  sheetsLoading,
  compact = false,
  requireFilePick = false,
  onFolderSelect,
  onSync,
  syncing = false,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
  sheets: SheetOption[];
  activeSheet: number;
  onSheetChange: (index: number) => void;
  sheetsLoading?: boolean;
  compact?: boolean;
  requireFilePick?: boolean;
  onFolderSelect?: (folderId: string) => void;
  onSync?: () => void;
  syncing?: boolean;
}) {
  const router = useRouter();
  /** Update label file langsung tanpa nunggu navigasi selesai */
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);

  useEffect(() => {
    setPendingFileId(null);
  }, [currentFileId]);

  function onFolderChange(id: string) {
    if (!id) return;
    setPendingFileId("");
    if (onFolderSelect) {
      onFolderSelect(id);
      return;
    }
    router.push(`/folders/${id}`);
  }

  function onFileChange(driveFileId: string) {
    setPendingFileId(driveFileId);
    if (!driveFileId) {
      if (requireFilePick) {
        router.push(currentFolder ? `/?folder=${currentFolder.id}` : "/");
      }
      return;
    }
    const file = files.find((f) => f.drive_file_id === driveFileId);
    if (!file) return;
    router.push(fileHref(file));
  }

  const resolvedFileId =
    pendingFileId !== null
      ? pendingFileId
      : requireFilePick
        ? files.some((f) => f.drive_file_id === currentFileId)
          ? currentFileId
          : ""
        : currentFileId;

  const folderOptions = useMemo(
    () =>
      folders.map((f) => ({
        value: f.id,
        label: f.name,
        hint: f.description || undefined,
      })),
    [folders]
  );

  const fileOptions = useMemo(() => {
    const list = files.map((f) => ({
      value: f.drive_file_id ?? "",
      label: f.title,
    }));
    if (requireFilePick) {
      return [{ value: "", label: "— Pilih file —" }, ...list.filter((o) => o.value)];
    }
    if (list.length === 0 && currentFileId) {
      return [{ value: currentFileId, label: "File saat ini" }];
    }
    return list.filter((o) => o.value);
  }, [files, requireFilePick, currentFileId]);

  /** Jangan ganti opsi jadi "Memuat…" saat sudah ada daftar — biar label tetap jalan */
  const sheetOptions = useMemo(() => {
    if (sheets.length > 0) {
      return sheets.map((s) => ({
        value: String(s.index),
        label: `Tab ${s.index + 1}: ${s.sheetName}`,
        hint: `${s.rowCount.toLocaleString("id-ID")} baris`,
      }));
    }
    if (sheetsLoading) return [{ value: "", label: "Memuat sheet..." }];
    return [{ value: "", label: "Tidak ada sheet" }];
  }, [sheets, sheetsLoading]);

  const [pendingSheet, setPendingSheet] = useState<string | null>(null);

  useEffect(() => {
    setPendingSheet(null);
  }, [activeSheet, currentFileId]);

  const sheetValue =
    pendingSheet !== null
      ? pendingSheet
      : sheets.length === 0
        ? ""
        : String(activeSheet);

  return (
    <div className="flex w-fit max-w-full flex-wrap items-end justify-center gap-3">
      <SearchableSelect
        label="Pilih folder"
        compact={compact}
        value={currentFolder?.id ?? ""}
        options={
          currentFolder ? folderOptions : [{ value: "", label: "—" }, ...folderOptions]
        }
        onChange={onFolderChange}
        placeholder="Pilih folder"
        searchPlaceholder="Cari folder…"
        minCh={14}
        maxCh={compact ? 32 : 48}
      />

      <SearchableSelect
        label="Pilih file"
        compact={compact}
        value={resolvedFileId}
        options={fileOptions}
        onChange={onFileChange}
        placeholder="Pilih file"
        searchPlaceholder="Cari file…"
        minCh={18}
        maxCh={compact ? 48 : 72}
      />

      <div className="flex items-end gap-1.5">
        <SearchableSelect
          key={`sheet-${currentFileId}`}
          label="Pilih tab / sheet"
          compact={compact}
          value={sheetValue}
          options={sheetOptions}
          onChange={(v) => {
            if (v === "") return;
            setPendingSheet(v);
            onSheetChange(Number(v));
          }}
          disabled={sheets.length === 0}
          placeholder="Pilih sheet"
          searchPlaceholder="Cari sheet…"
          minCh={14}
          maxCh={compact ? 36 : 48}
        />
        {onSync && currentFileId ? (
          <button
            type="button"
            title="Sinkronkan ulang dari Google Drive"
            aria-label="Sinkronkan data"
            disabled={syncing || sheetsLoading}
            onClick={onSync}
            className={`mb-0.5 grid shrink-0 place-items-center rounded-lg border border-[#e0e3ea] bg-white text-[#3d4454] transition hover:border-[#1f6b5a] hover:text-[#1f6b5a] disabled:cursor-not-allowed disabled:opacity-50 ${
              compact ? "size-8" : "size-9"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={syncing ? "animate-spin" : undefined}
            >
              <path d="M21 12a9 9 0 0 1-14.5 7.1" />
              <path d="M3 12a9 9 0 0 1 14.5-7.1" />
              <path d="M21 3v6h-6" />
              <path d="M3 21v-6h6" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
