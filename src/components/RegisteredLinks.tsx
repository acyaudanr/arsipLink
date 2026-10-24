"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ExcelDocument } from "@/lib/types";

export default function RegisteredLinks({
  links,
  isAdmin,
}: {
  links: ExcelDocument[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(link: ExcelDocument) {
    if (!confirm(`Hapus link "${link.title}" dari daftar? File/folder aslinya di Drive TIDAK ikut terhapus.`)) return;
    setBusyId(link.id);
    setError(null);
    try {
      const res = await fetch(`/api/drive/links/${link.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-6">
      <h2 className="mb-3 font-semibold">Link Drive Terdaftar ({links.length})</h2>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-14 text-center text-gray-500">
          Belum ada link Drive terdaftar. {isAdmin ? "Paste link file/folder Drive di atas untuk memulai." : "Minta Admin mendaftarkan link Drive."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const isFolder = link.drive_kind === "folder";
            const href = isFolder
              ? `/drive/folder/${link.drive_file_id}?root=${link.drive_file_id}&title=${encodeURIComponent(link.title)}`
              : `/drive/file/${link.drive_file_id}?title=${encodeURIComponent(link.title)}`;
            return (
              <div key={link.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm">
                <div className="mb-2 flex items-start gap-3">
                  <span className="text-3xl">{isFolder ? "📁" : "📊"}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold" title={link.title}>{link.title}</p>
                    <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${isFolder ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {isFolder ? "Folder Drive" : "File Drive"}
                    </span>
                  </div>
                </div>
                <p className="mb-3 truncate text-xs text-gray-400" title={link.drive_url ?? ""}>{link.drive_url}</p>
                <div className="mt-auto flex gap-2">
                  <Link href={href} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700">
                    {isFolder ? "Buka Folder" : "View File"}
                  </Link>
                  {link.drive_url && (
                    <a href={link.drive_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50" title="Buka di Google Drive">↗</a>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(link)} disabled={busyId === link.id} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60">
                      {busyId === link.id ? "..." : "Hapus"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
