"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DriveFolder, ExcelDocument } from "@/lib/types";
import type { SheetOption } from "@/components/PreviewNav";

export type ViewerPreviewControls = {
  folders: DriveFolder[];
  currentFolder: DriveFolder | null;
  files: ExcelDocument[];
  currentFileId: string;
  sheets: SheetOption[];
  activeSheet: number;
  sheetsLoading: boolean;
  onSheetChange: (index: number) => void;
};

const ViewerPreviewContext = createContext<ViewerPreviewControls | null>(null);
const ViewerPreviewSetContext = createContext<(v: ViewerPreviewControls | null) => void>(
  () => undefined
);

export function ViewerPreviewProvider({ children }: { children: ReactNode }) {
  const [controls, setControls] = useState<ViewerPreviewControls | null>(null);
  const value = useMemo(() => controls, [controls]);
  return (
    <ViewerPreviewSetContext.Provider value={setControls}>
      <ViewerPreviewContext.Provider value={value}>{children}</ViewerPreviewContext.Provider>
    </ViewerPreviewSetContext.Provider>
  );
}

export function useViewerPreview() {
  return useContext(ViewerPreviewContext);
}

export function useSetViewerPreview() {
  return useContext(ViewerPreviewSetContext);
}
