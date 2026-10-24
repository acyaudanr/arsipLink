"use client";

import { useRouter } from "next/navigation";
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
  /** Lebih rapat untuk top nav viewer */
  compact?: boolean;
  /** Viewer: opsi kosong dulu, user harus pilih file */
  requireFilePick?: boolean;
  /** Override navigasi saat pilih folder */
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

  const labelCls = compact
    ? "mb-0.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]"
    : "mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]";
  const selectCls = compact
    ? "w-full rounded-lg border border-[#e0e3ea] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
    : "w-full rounded-lg border border-[#e0e3ea] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15";

  return (
    <div className={`flex min-w-0 flex-1 flex-wrap items-end gap-2 ${compact ? "" : ""}`}>
      <label className={`min-w-[120px] flex-1 ${compact ? "max-w-[200px]" : "lg:flex-none lg:min-w-[180px]"}`}>
        <span className={labelCls}>Pilih folder</span>
        <select
          value={currentFolder?.id ?? ""}
          onChange={(e) => onFolderChange(e.target.value)}
          className={selectCls}
        >
          {!currentFolder && <option value="">—</option>}
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      <label className={`min-w-[140px] flex-[1.4] ${compact ? "" : "lg:flex-none lg:min-w-[220px]"}`}>
        <span className={labelCls}>Pilih file</span>
        <select
          value={fileValue}
          onChange={(e) => onFileChange(e.target.value)}
          className={selectCls}
        >
          {requireFilePick && <option value="">— Pilih file —</option>}
          {!requireFilePick && files.length === 0 && (
            <option value={currentFileId}>File saat ini</option>
          )}
          {files.map((f) => (
            <option key={f.id} value={f.drive_file_id ?? ""}>
              {f.title}
            </option>
          ))}
        </select>
      </label>

      <label className={`min-w-[150px] flex-[1.2] ${compact ? "" : "lg:flex-none lg:min-w-[240px]"}`}>
        <span className={labelCls}>Pilih tab / sheet</span>
        <select
          value={sheetsLoading || sheets.length === 0 ? "" : String(activeSheet)}
          onChange={(e) => onSheetChange(Number(e.target.value))}
          disabled={sheetsLoading || sheets.length === 0}
          className={`${selectCls} disabled:opacity-60`}
        >
          {sheetsLoading && <option value="">Memuat sheet...</option>}
          {!sheetsLoading && sheets.length === 0 && <option value="">Tidak ada sheet</option>}
          {sheets.map((s) => (
            <option key={s.index} value={s.index}>
              Tab {s.index + 1}: {s.sheetName} ({s.rowCount.toLocaleString("id-ID")} baris)
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
