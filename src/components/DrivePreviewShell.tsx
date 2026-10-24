"use client";

import { useEffect, useState } from "react";
import PreviewNav, { type SheetOption } from "@/components/PreviewNav";
import DriveFileViewer from "@/components/DriveFileViewer";
import { useSetViewerPreview } from "@/components/ViewerPreviewContext";
import type { DriveFolder, ExcelDocument } from "@/lib/types";

export default function DrivePreviewShell({
  folders,
  currentFolder,
  files,
  currentFileId,
  isViewer = false,
}: {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
  isViewer?: boolean;
}) {
  const setViewerPreview = useSetViewerPreview();
  const [sheets, setSheets] = useState<SheetOption[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [sheetsLoading, setSheetsLoading] = useState(true);

  function handleSheetsLoaded(list: SheetOption[]) {
    setSheets(list);
    setActiveSheet(0);
  }

  useEffect(() => {
    if (!isViewer) {
      setViewerPreview(null);
      return;
    }

    setViewerPreview({
      folders,
      currentFolder,
      files,
      currentFileId,
      sheets,
      activeSheet,
      sheetsLoading,
      onSheetChange: setActiveSheet,
    });

    return () => setViewerPreview(null);
  }, [
    isViewer,
    folders,
    currentFolder,
    files,
    currentFileId,
    sheets,
    activeSheet,
    sheetsLoading,
    setViewerPreview,
  ]);

  return (
    <div
      className={`flex flex-col ${isViewer ? "min-h-[calc(100vh-4.5rem)]" : "min-h-[calc(100vh-3.5rem)]"}`}
    >
      {!isViewer && (
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
      )}
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
