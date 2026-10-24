"use client";

import { useState } from "react";
import EditFolderModal from "@/components/EditFolderModal";

export default function FolderHeaderActions({
  folderId,
  folderName,
  folderDescription = "",
}: {
  folderId: string;
  folderName: string;
  folderDescription?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e0e3ea] px-2.5 py-1.5 text-xs font-medium text-[#3d4454] hover:bg-[#f4f5f7]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Edit
      </button>
      <EditFolderModal
        open={open}
        onClose={() => setOpen(false)}
        folderId={folderId}
        initialName={folderName}
        initialDescription={folderDescription}
      />
    </>
  );
}
