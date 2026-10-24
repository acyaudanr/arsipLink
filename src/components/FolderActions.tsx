"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

export default function FolderActions({
  folderId,
  folderName,
  fileCount = 0,
}: {
  folderId: string;
  folderName: string;
  fileCount?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFiles = fileCount > 0;

  async function onConfirm() {
    if (hasFiles) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/drive/folder/${folderId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        title="Hapus folder"
        aria-label="Hapus folder"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setError(null);
          setOpen(true);
        }}
        className="grid size-9 place-items-center rounded-lg text-[#b0b5c0] transition hover:bg-red-50 hover:text-red-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>

      <ConfirmModal
        open={open}
        onClose={() => !busy && setOpen(false)}
        onConfirm={onConfirm}
        busy={busy}
        confirmDisabled={hasFiles}
        title={hasFiles ? "Folder masih berisi file" : "Hapus folder?"}
        description={
          hasFiles
            ? undefined
            : `Folder “${folderName}” akan dihapus dari daftar. File di Google Drive tidak ikut terhapus.`
        }
        confirmLabel={hasFiles ? "Mengerti" : "Ya, hapus folder"}
        cancelLabel={hasFiles ? "Tutup" : "Batal"}
        tone={hasFiles ? "neutral" : "danger"}
      >
        {hasFiles ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
              <p className="font-semibold">
                Ada {fileCount} file di dalam “{folderName}”.
              </p>
              <p className="mt-1 leading-relaxed text-amber-800/90">
                Hapus file-nya dulu <strong>satu per satu</strong> dari dalam folder,
                baru folder kosong ini bisa dihapus.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/folders/${folderId}`);
              }}
              className="w-full rounded-xl border border-[#e0e3ea] bg-white px-4 py-2.5 text-sm font-semibold text-[#0c1222] hover:bg-[#f4f5f7]"
            >
              Buka folder & hapus file
            </button>
          </div>
        ) : null}
        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </ConfirmModal>
    </>
  );
}
