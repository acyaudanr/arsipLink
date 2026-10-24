"use client";

import { useEffect, useState } from "react";
import { useSetViewerPreview } from "@/components/ViewerPreviewContext";
import type { DriveFolder, ExcelDocument } from "@/lib/types";
import type { SheetOption } from "@/components/PreviewNav";

export default function ViewerHome({
  folders,
  currentFolder,
  files,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
}) {
  const setViewerPreview = useSetViewerPreview();
  const [sheets] = useState<SheetOption[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    setViewerPreview({
      folders,
      currentFolder,
      files,
      currentFileId: "",
      sheets,
      activeSheet,
      sheetsLoading: false,
      onSheetChange: setActiveSheet,
    });
    return () => setViewerPreview(null);
  }, [folders, currentFolder, files, sheets, activeSheet, setViewerPreview]);

  return (
    <div className="flex h-full min-h-0 items-center justify-center px-5 py-16">
      <div className="max-w-md text-center">
        <p className="font-display text-xl text-[#0c1222]">Pilih file</p>
        <p className="mt-2 text-sm text-[#6b7285]">
          {folders.length === 0
            ? "Belum ada folder yang diizinkan. Minta Administrator mengatur akses."
            : "Pilih folder dan file di navigasi atas untuk membuka spreadsheet."}
        </p>
      </div>
    </div>
  );
}
