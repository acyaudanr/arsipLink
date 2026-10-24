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

  const sheetOptions = useMemo(() => {
    if (sheetsLoading) return [{ value: "", label: "Memuat sheet..." }];
    if (sheets.length === 0) return [{ value: "", label: "Tidak ada sheet" }];
    return sheets.map((s) => ({
      value: String(s.index),
      label: `Tab ${s.index + 1}: ${s.sheetName}`,
      hint: `${s.rowCount.toLocaleString("id-ID")} baris`,
    }));
  }, [sheets, sheetsLoading]);

  const sheetValue =
    sheetsLoading || sheets.length === 0 ? "" : String(activeSheet);

  return (
    <div className="flex w-fit max-w-full flex-wrap items-end justify-center gap-2">
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
        minCh={12}
        maxCh={28}
      />

      <SearchableSelect
        label="Pilih file"
        compact={compact}
        value={resolvedFileId}
        options={fileOptions}
        onChange={onFileChange}
        placeholder="Pilih file"
        searchPlaceholder="Cari file…"
        minCh={16}
        maxCh={42}
      />

      <SearchableSelect
        label="Pilih tab / sheet"
        compact={compact}
        value={sheetValue}
        options={sheetOptions}
        onChange={(v) => {
          if (v === "") return;
          onSheetChange(Number(v));
        }}
        disabled={sheetsLoading || sheets.length === 0}
        placeholder="Pilih sheet"
        searchPlaceholder="Cari sheet…"
        minCh={14}
        maxCh={32}
      />
    </div>
  );
}
