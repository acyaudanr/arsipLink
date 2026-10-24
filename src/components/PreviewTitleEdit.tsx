"use client";

import { useState } from "react";
import EditFileModal from "@/components/EditFileModal";

/**
 * Tombol Edit di header preview (nama file).
 * Link Google Drive TIDAK diubah dari sini.
 */
export default function PreviewTitleEdit({
  documentId,
  title,
  description,
  driveUrl,
  isAdmin,
}: {
  documentId: string | null;
  title: string;
  description: string;
  driveUrl: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isAdmin || !documentId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg border border-[#e0e3ea] px-2.5 py-1 text-xs font-medium text-[#3d4454] hover:bg-[#f4f5f7]"
      >
        Edit
      </button>
      <EditFileModal
        open={open}
        onClose={() => setOpen(false)}
        documentId={documentId}
        initialTitle={title}
        initialDescription={description}
        initialLink={driveUrl}
        mode="meta"
      />
    </>
  );
}
