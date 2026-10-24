"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  kind: "file" | "folder";
  isSpreadsheet: boolean;
  size: number | null;
  modifiedTime: string | null;
  webViewLink: string | null;
}

function formatSize(n: number | null) {
  if (n === null) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(item: DriveItem) {
  if (item.kind === "folder") return "📁";
  if (item.isSpreadsheet) return "📊";
  if (item.mimeType.startsWith("image/")) return "🖼️";
  if (item.mimeType === "application/pdf") return "📕";
  if (item.mimeType.includes("document")) return "📄";
  if (item.mimeType.includes("presentation")) return "📙";
  if (item.mimeType.startsWith("video/")) return "🎬";
  return "📎";
}

export default function FolderBrowser({
  initialFolderId,
  rootFolderId,
  rootTitle,
}: {
  initialFolderId: string;
  rootFolderId: string;
  rootTitle: string;
}) {
  const [stack, setStack] = useState<{ id: string; name: string }[]>([
    { id: rootFolderId, name: rootTitle },
  ]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const current = stack[stack.length - 1];

  const load = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/drive/browse/${folderId}?root=${rootFolderId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membaca folder");
      setItems(json.items as DriveItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membaca folder");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [rootFolderId]);

  useEffect(() => {
    load(initialFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openFolder(item: DriveItem) {
    setStack((s) => [...s, { id: item.id, name: item.name }]);
    load(item.id);
  }

  function goTo(index: number) {
    const target = stack[index];
    setStack(stack.slice(0, index + 1));
    load(target.id);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        {stack.map((f, i) => (
          <span key={`${f.id}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">/</span>}
            <button
              onClick={() => i < stack.length - 1 && goTo(i)}
              className={i === stack.length - 1 ? "font-semibold" : "text-emerald-700 hover:underline"}
            >
              {i === 0 ? `📁 ${f.name}` : f.name}
            </button>
          </span>
        ))}
        <button onClick={() => load(current.id)} className="ml-3 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs hover:bg-gray-50">
          ↻ Muat Ulang
        </button>
      </nav>

      {loading ? (
        <p className="rounded-2xl border border-gray-200 bg-white px-4 py-14 text-center text-gray-400">Membaca isi folder dari Google Drive...</p>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="font-semibold text-red-600">Folder belum bisa dibaca</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-red-500">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-14 text-center text-gray-500">Folder ini kosong.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Ukuran</th>
                <th className="px-4 py-3 font-medium">Terakhir Diubah</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="mr-2">{iconFor(item)}</span>
                    {item.kind === "folder" ? (
                      <button onClick={() => openFolder(item)} className="font-medium text-emerald-700 hover:underline">{item.name}</button>
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.kind === "folder" ? "-" : formatSize(item.size)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.modifiedTime ? new Date(item.modifiedTime).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {item.kind === "folder" ? (
                        <button onClick={() => openFolder(item)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Buka</button>
                      ) : item.isSpreadsheet ? (
                        <Link href={`/drive/file/${item.id}?title=${encodeURIComponent(item.name)}`} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">View Excel</Link>
                      ) : null}
                      {item.webViewLink && (
                        <a href={item.webViewLink} target="_blank" rel="noreferrer" className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">Di Drive ↗</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">
        {items.filter((i) => i.kind === "folder").length} folder • {items.filter((i) => i.kind === "file").length} file — dibaca langsung dari Google Drive, tidak disimpan ke database.
      </p>
    </div>
  );
}
