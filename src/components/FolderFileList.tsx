"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ExcelDocument } from "@/lib/types";
import EditFileModal from "@/components/EditFileModal";
import ConfirmModal from "@/components/ConfirmModal";

function fileHref(file: ExcelDocument) {
  const title = encodeURIComponent(file.title);
  if (file.drive_kind === "folder" && file.drive_file_id) {
    return `/drive/folder/${file.drive_file_id}?root=${file.drive_file_id}&title=${title}`;
  }
  return `/drive/file/${file.drive_file_id}?title=${title}`;
}

export default function FolderFileList({
  files,
  isAdmin,
  folderId,
}: {
  files: ExcelDocument[];
  isAdmin: boolean;
  folderId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ExcelDocument | null>(null);
  const [deleting, setDeleting] = useState<ExcelDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/drive/links/${deleting.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus");
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  }

  if (files.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d5d8e0] bg-white/70 px-6 py-14 text-center">
        <p className="font-display text-lg text-[#0c1222]">Folder masih kosong</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#6b7285]">
          {isAdmin
            ? "Klik Upload di navigasi atas, pilih folder ini, lalu tempel link Drive."
            : "Belum ada file di folder ini."}
        </p>
        {isAdmin && (
          <p className="mt-3 text-xs text-[#a0a6b4]">Folder ID: {folderId.slice(0, 8)}…</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && !deleting && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ul className="divide-y divide-[#e8eaef] overflow-hidden rounded-2xl border border-[#e8eaef] bg-white">
        {files.map((file) => {
          const isFolder = file.drive_kind === "folder";
          return (
            <li key={file.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafaf8]">
              <Link href={fileHref(file)} className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg border text-[10px] font-semibold uppercase ${
                    isFolder
                      ? "border-[#e8eaef] bg-[#f7f6f3] text-[#1f6b5a]"
                      : "border-[#dde8e4] bg-[#f0faf6] text-[#1f6b5a]"
                  }`}
                >
                  {isFolder ? "dir" : "xlsx"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#0c1222]">{file.title}</p>
                  {file.description ? (
                    <p className="truncate text-xs text-[#6b7285]">{file.description}</p>
                  ) : null}
                  <p className="truncate text-xs text-[#8a91a0]">{file.drive_url}</p>
                </div>
                <span className="hidden shrink-0 rounded-md border border-[#e8eaef] px-2 py-0.5 text-[11px] font-medium text-[#6b7285] sm:inline">
                  {isFolder ? "Folder Drive" : "Spreadsheet"}
                </span>
              </Link>
              {file.drive_url && (
                <a
                  href={file.drive_url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-lg border border-[#e0e3ea] px-2.5 py-1.5 text-xs text-[#6b7285] hover:bg-[#f4f5f7]"
                >
                  Drive ↗
                </a>
              )}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(file)}
                    className="shrink-0 rounded-lg border border-[#e0e3ea] px-2.5 py-1.5 text-xs text-[#3d4454] hover:bg-[#f4f5f7]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDeleting(file);
                    }}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-[#9aa0ae] hover:bg-red-50 hover:text-red-600"
                  >
                    Hapus
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {editing && (
        <EditFileModal
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          documentId={editing.id}
          initialTitle={editing.title}
          initialDescription={editing.description ?? ""}
          initialLink={editing.drive_url ?? ""}
          mode="full"
        />
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => !busy && setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Hapus file?"
        description={
          deleting
            ? `“${deleting.title}” akan dihapus dari folder ini. File aslinya di Google Drive tidak ikut terhapus.`
            : undefined
        }
        confirmLabel="Ya, hapus file"
      >
        {deleting?.drive_url ? (
          <p className="mt-3 truncate rounded-xl border border-[#eef0f4] bg-[#fafaf8] px-3 py-2 font-mono text-[11px] text-[#8a91a0]">
            {deleting.drive_url}
          </p>
        ) : null}
        {error && deleting && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}
