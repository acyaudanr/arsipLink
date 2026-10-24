"use client";

import { useMemo } from "react";
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

  function onFolderChange(id: string) {
    if (!id) return;
    if (onFolderSelect) {
      onFolderSelect(id);
      return;
    }
    router.push(`/folders/${id}`);
  }

  function onFileChange(driveFileId: string) {
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

  const fileValue = requireFilePick
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
    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
      <div className={`min-w-[140px] flex-1 ${compact ? "max-w-[220px]" : "lg:min-w-[200px] lg:flex-none"}`}>
        <SearchableSelect
          label="Pilih folder"
          compact={compact}
          value={currentFolder?.id ?? ""}
          options={
            currentFolder
              ? folderOptions
              : [{ value: "", label: "—" }, ...folderOptions]
          }
          onChange={onFolderChange}
          placeholder="Pilih folder"
          searchPlaceholder="Cari folder…"
        />
      </div>

      <div className={`min-w-[160px] flex-[1.5] ${compact ? "" : "lg:min-w-[260px] lg:flex-none"}`}>
        <SearchableSelect
          label="Pilih file"
          compact={compact}
          value={fileValue}
          options={fileOptions}
          onChange={onFileChange}
          placeholder="Pilih file"
          searchPlaceholder="Cari file…"
        />
      </div>

      <div className={`min-w-[160px] flex-[1.3] ${compact ? "" : "lg:min-w-[240px] lg:flex-none"}`}>
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
        />
      </div>
    </div>
  );
}
