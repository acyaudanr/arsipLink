"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SearchableSelect from "@/components/SearchableSelect";
import type { DriveFolder } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = "existing" | "new";

interface FileRow {
  id: string;
  fileName: string;
  description: string;
  link: string;
}

function emptyRow(): FileRow {
  return { id: crypto.randomUUID(), fileName: "", description: "", link: "" };
}

export default function UploadModal({ open, onClose }: Props) {
  const router = useRouter();
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [mode, setMode] = useState<Mode>("new");
  const [folderId, setFolderId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<FileRow[]>([emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDone(null);
    setBusy(false);
    setRows([emptyRow()]);
    fetch("/api/drive/folders")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.folders ?? []) as DriveFolder[];
        setFolders(list);
        if (list.length > 0) {
          setMode("existing");
          setFolderId(list[0].id);
        } else {
          setMode("new");
          setFolderId("");
        }
      })
      .catch(() => setFolders([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function updateRow(id: string, patch: Partial<FileRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);

    const items = rows.map((r) => ({
      fileName: r.fileName.trim(),
      description: r.description.trim(),
      link: r.link.trim(),
    }));

    if (items.some((it) => !it.fileName || !it.link)) {
      setError("Setiap baris wajib punya Nama file dan Link Drive.");
      setBusy(false);
      return;
    }
    if (mode === "new" && !name.trim()) {
      setError("Nama folder baru wajib diisi.");
      setBusy(false);
      return;
    }
    if (mode === "existing" && !folderId) {
      setError("Pilih folder tujuan.");
      setBusy(false);
      return;
    }

    try {
      const payload =
        mode === "existing"
          ? { folderId, items }
          : { newFolder: { name: name.trim(), description: description.trim() }, items };

      const res = await fetch("/api/drive/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan");

      const ok = (json.results as { ok: boolean }[]).filter((r) => r.ok).length;
      const fail = (json.results as { ok: boolean }[]).length - ok;
      setDone(
        fail === 0
          ? `${ok} file berhasil didaftarkan.`
          : `${ok} berhasil, ${fail} gagal.`
      );
      setRows([emptyRow()]);
      if (mode === "new") {
        setName("");
        setDescription("");
      }
      router.refresh();
      if (json.folderId) {
        setTimeout(() => {
          onClose();
          router.push(`/folders/${json.folderId}`);
        }, 700);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-[#0c1222]/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e6e8ee] bg-white shadow-[0_24px_80px_-24px_rgba(12,18,34,0.45)]"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-[#eef0f4] px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#0c1222]">
              Daftarkan file Drive
            </h2>
            <p className="mt-0.5 text-sm text-[#6b7285]">
              Satu file = satu nama + satu link. Tambah baris bila perlu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6b7285] hover:bg-[#f4f5f7] hover:text-[#0c1222]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]">
                Folder
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f4f5f7] p-1">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  disabled={folders.length === 0}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    mode === "existing"
                      ? "bg-white text-[#0c1222] shadow-sm"
                      : "text-[#6b7285] hover:text-[#0c1222] disabled:opacity-40"
                  }`}
                >
                  Pilih yang ada
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    mode === "new"
                      ? "bg-white text-[#0c1222] shadow-sm"
                      : "text-[#6b7285] hover:text-[#0c1222]"
                  }`}
                >
                  Buat baru
                </button>
              </div>
            </div>

            {mode === "existing" ? (
              <SearchableSelect
                label="Nama folder"
                value={folderId}
                onChange={setFolderId}
                placeholder="Pilih folder"
                searchPlaceholder="Cari folder…"
                options={folders.map((f) => ({
                  value: f.id,
                  label: f.name,
                  hint:
                    typeof f.file_count === "number" ? `${f.file_count} file` : undefined,
                }))}
              />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">Nama folder</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Arsip Inaktif 2024"
                    className="w-full rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">Deskripsi folder</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Opsional — singkat saja."
                    className="w-full resize-none rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]">
                  File
                </p>
                <span className="text-xs text-[#8a91a0]">{rows.length} item</span>
              </div>

              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-[#e8eaef] bg-[#fafaf8] p-3.5"
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6b7285]">File {index + 1}</span>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-xs text-[#9aa0ae] hover:text-red-600"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#0c1222]">
                          Nama file <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={row.fileName}
                          onChange={(e) => updateRow(row.id, { fileName: e.target.value })}
                          placeholder="Contoh: Daftar Arsip Inaktif Bidang A"
                          required
                          className="w-full rounded-lg border border-[#e0e3ea] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#0c1222]">
                          Deskripsi file
                        </label>
                        <input
                          value={row.description}
                          onChange={(e) => updateRow(row.id, { description: e.target.value })}
                          placeholder="Opsional"
                          className="w-full rounded-lg border border-[#e0e3ea] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#0c1222]">
                          Link Google Drive <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={row.link}
                          onChange={(e) => updateRow(row.id, { link: e.target.value })}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          required
                          className="w-full rounded-lg border border-[#e0e3ea] bg-white px-3 py-2 font-mono text-[12.5px] outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, emptyRow()])}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfd3dc] bg-white py-2.5 text-sm font-medium text-[#3d4454] hover:border-[#1f6b5a] hover:text-[#1f6b5a]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add more link
              </button>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {done && (
              <p className="rounded-xl border border-[#cfe8df] bg-[#f0faf6] px-3 py-2 text-sm text-[#1f6b5a]">
                {done}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#eef0f4] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#6b7285] hover:bg-[#f4f5f7] hover:text-[#0c1222]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#0c1222] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2236] disabled:opacity-60"
            >
              {busy ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
