"use client";

import PreviewSelectors from "@/components/PreviewSelectors";
import type { DriveFolder, ExcelDocument } from "@/lib/types";

export interface SheetOption {
  index: number;
  sheetName: string;
  rowCount: number;
}

/** Bar selector terpisah — dipakai Admin. Viewer memakai top nav. */
export default function PreviewNav({
  folders,
  currentFolder,
  files,
  currentFileId,
  sheets,
  activeSheet,
  onSheetChange,
  sheetsLoading,
  onSync,
  syncing,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
  sheets: SheetOption[];
  activeSheet: number;
  onSheetChange: (index: number) => void;
  sheetsLoading?: boolean;
  onSync?: () => void;
  syncing?: boolean;
}) {
  return (
    <div className="z-30 border-b border-[#e8eaef] bg-white/95 backdrop-blur-md">
      <div className="w-full px-3 py-2.5 sm:px-4">
        <PreviewSelectors
          folders={folders}
          currentFolder={currentFolder}
          files={files}
          currentFileId={currentFileId}
          sheets={sheets}
          activeSheet={activeSheet}
          onSheetChange={onSheetChange}
          sheetsLoading={sheetsLoading}
          onSync={onSync}
          syncing={syncing}
        />
      </div>
    </div>
  );
}
