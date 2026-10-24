"use client";

import { useState } from "react";
import PreviewNav, { type SheetOption } from "@/components/PreviewNav";
import DriveFileViewer from "@/components/DriveFileViewer";
import type { DriveFolder, ExcelDocument } from "@/lib/types";

export default function DrivePreviewShell({
  folders,
  currentFolder,
  files,
  currentFileId,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
}) {
  const [sheets, setSheets] = useState<SheetOption[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [sheetsLoading, setSheetsLoading] = useState(true);

  function handleSheetsLoaded(list: SheetOption[]) {
    setSheets(list);
    setActiveSheet(0);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <PreviewNav
        folders={folders}
        currentFolder={currentFolder}
        files={files}
        currentFileId={currentFileId}
        sheets={sheets}
        activeSheet={activeSheet}
        onSheetChange={setActiveSheet}
        sheetsLoading={sheetsLoading}
      />
      <div className="w-full flex-1 px-3 pb-4 pt-2 sm:px-4">
        <DriveFileViewer
          key={currentFileId}
          fileId={currentFileId}
          activeSheet={activeSheet}
          onSheetsLoaded={handleSheetsLoaded}
          onSheetsLoading={setSheetsLoading}
        />
      </div>
    </div>
  );
}
