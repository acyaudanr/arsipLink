"use client";

import { useRouter } from "next/navigation";
import type { DriveFolder, ExcelDocument } from "@/lib/types";

export interface SheetOption {
  index: number;
  sheetName: string;
  rowCount: number;
}

function fileHref(file: ExcelDocument) {
  const title = encodeURIComponent(file.title);
  if (file.drive_kind === "folder" && file.drive_file_id) {
    return `/drive/folder/${file.drive_file_id}?root=${file.drive_file_id}&title=${title}`;
  }
  return `/drive/file/${file.drive_file_id}?title=${title}`;
}

export default function PreviewNav({
  folders,
  currentFolder,
  files,
  currentFileId,
  sheets,
  activeSheet,
  onSheetChange,
  sheetsLoading,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
  sheets: SheetOption[];
  activeSheet: number;
  onSheetChange: (index: number) => void;
  sheetsLoading?: boolean;
}) {
  const router = useRouter();

  function onFolderChange(id: string) {
    if (!id) return;
    router.push(`/folders/${id}`);
  }

  function onFileChange(driveFileId: string) {
    const file = files.find((f) => f.drive_file_id === driveFileId);
    if (!file) return;
    router.push(fileHref(file));
  }

  return (
    <div className="sticky top-14 z-30 border-b border-[#e8eaef] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-3 px-5 py-2.5">
        <div className="min-w-0 flex-1 basis-[140px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a91a0]">
            Folder
          </p>
          <p className="truncate text-sm font-semibold text-[#0c1222]">
            {currentFolder?.name ?? "Tanpa folder"}
          </p>
          {currentFolder?.description ? (
            <p className="truncate text-xs text-[#8a91a0]">{currentFolder.description}</p>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-end gap-2 lg:w-auto lg:flex-nowrap">
          <label className="min-w-[140px] flex-1 lg:flex-none">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]">
              Pilih folder
            </span>
            <select
              value={currentFolder?.id ?? ""}
              onChange={(e) => onFolderChange(e.target.value)}
              className="w-full rounded-lg border border-[#e0e3ea] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15 lg:min-w-[180px]"
            >
              {!currentFolder && <option value="">—</option>}
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[160px] flex-1 lg:flex-none">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]">
              Pilih file
            </span>
            <select
              value={currentFileId}
              onChange={(e) => onFileChange(e.target.value)}
              className="w-full rounded-lg border border-[#e0e3ea] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15 lg:min-w-[220px]"
            >
              {files.length === 0 && <option value={currentFileId}>File saat ini</option>}
              {files.map((f) => (
                <option key={f.id} value={f.drive_file_id ?? ""}>
                  {f.title}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[180px] flex-[1.3] lg:flex-none">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]">
              Pilih tab / sheet
            </span>
            <select
              value={sheetsLoading || sheets.length === 0 ? "" : String(activeSheet)}
              onChange={(e) => onSheetChange(Number(e.target.value))}
              disabled={sheetsLoading || sheets.length === 0}
              className="w-full rounded-lg border border-[#e0e3ea] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15 disabled:opacity-60 lg:min-w-[260px]"
            >
              {sheetsLoading && <option value="">Memuat sheet...</option>}
              {!sheetsLoading && sheets.length === 0 && (
                <option value="">Tidak ada sheet</option>
              )}
              {sheets.map((s) => (
                <option key={s.index} value={s.index}>
                  Tab {s.index + 1}: {s.sheetName} ({s.rowCount.toLocaleString("id-ID")} baris)
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
