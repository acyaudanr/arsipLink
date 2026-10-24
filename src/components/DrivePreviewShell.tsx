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
  fileTitle,
  titleActions,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
  fileTitle: string;
  titleActions?: React.ReactNode;
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
        fileTitle={fileTitle}
        titleActions={titleActions}
        sheets={sheets}
        activeSheet={activeSheet}
        onSheetChange={setActiveSheet}
        sheetsLoading={sheetsLoading}
      />
      <div className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-6 pt-3">
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
