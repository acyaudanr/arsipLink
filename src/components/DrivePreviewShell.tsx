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
  const [refreshToken, setRefreshToken] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setActiveSheet(0);
    setRefreshToken(0);
    setSyncing(false);
  }, [currentFileId]);

  function handleSheetsLoaded(list: SheetOption[]) {
    setSheets(list);
  }

  function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setRefreshToken((n) => n + 1);
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
      onSync: handleSync,
      syncing,
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
    syncing,
    setViewerPreview,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!isViewer && (
        <div className="relative z-40 shrink-0">
          <PreviewNav
            folders={folders}
            currentFolder={currentFolder}
            files={files}
            currentFileId={currentFileId}
            sheets={sheets}
            activeSheet={activeSheet}
            onSheetChange={setActiveSheet}
            sheetsLoading={sheetsLoading}
            onSync={handleSync}
            syncing={syncing}
          />
        </div>
      )}
      <div className="min-h-0 w-full flex-1 overflow-hidden px-3 pb-3 pt-2 sm:px-4">
        <DriveFileViewer
          key={currentFileId}
          fileId={currentFileId}
          activeSheet={activeSheet}
          onSheetsLoaded={handleSheetsLoaded}
          onSheetsLoading={setSheetsLoading}
          refreshToken={refreshToken}
          onSyncDone={() => setSyncing(false)}
        />
      </div>
    </div>
  );
}
