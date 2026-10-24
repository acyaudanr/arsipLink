"use client";

import { useState } from "react";
import EditFileModal from "@/components/EditFileModal";

/**
 * Di halaman preview: Admin ubah nama/deskripsi via modal.
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

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-start gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0c1222]">
          {title}
        </h1>
        {isAdmin && documentId && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 rounded-lg border border-[#e0e3ea] px-2.5 py-1 text-xs font-medium text-[#3d4454] hover:bg-[#f4f5f7]"
          >
            Edit
          </button>
        )}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-[#6b7285]">{description}</p>
      ) : null}
      <p className="mt-2 text-sm text-[#6b7285]">
        <a
          href={driveUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#1f6b5a] hover:underline"
        >
          Buka di Google Drive ↗
        </a>
      </p>

      {documentId && (
        <EditFileModal
          open={open}
          onClose={() => setOpen(false)}
          documentId={documentId}
          initialTitle={title}
          initialDescription={description}
          initialLink={driveUrl}
          mode="meta"
        />
      )}
    </div>
  );
}
