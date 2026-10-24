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
  fileDescription = "",
  titleActions,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
  fileTitle: string;
  fileDescription?: string;
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
    <div>
      <PreviewNav
        folders={folders}
        currentFolder={currentFolder}
        files={files}
        currentFileId={currentFileId}
        fileTitle={fileTitle}
        fileDescription={fileDescription}
        titleActions={titleActions}
        sheets={sheets}
        activeSheet={activeSheet}
        onSheetChange={setActiveSheet}
        sheetsLoading={sheetsLoading}
      />
      <div className="w-full px-5 py-6">
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
