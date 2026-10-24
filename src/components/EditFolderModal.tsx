"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditFolderModal({
  open,
  onClose,
  folderId,
  initialName,
  initialDescription,
}: {
  open: boolean;
  onClose: () => void;
  folderId: string;
  initialName: string;
  initialDescription: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setDescription(initialDescription);
    setError(null);
    setBusy(false);
  }, [open, initialName, initialDescription]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama folder tidak boleh kosong.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/drive/folder/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan");
      onClose();
      router.refresh();
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
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e6e8ee] bg-white shadow-[0_24px_80px_-24px_rgba(12,18,34,0.45)]"
      >
        <div className="flex items-start justify-between border-b border-[#eef0f4] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#0c1222]">
              Edit folder
            </h2>
            <p className="mt-0.5 text-sm text-[#6b7285]">Ubah nama dan deskripsi folder.</p>
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

        <form onSubmit={save} className="space-y-3.5 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">
              Nama folder <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Opsional"
              className="w-full resize-none rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#eef0f4] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#6b7285] hover:bg-[#f4f5f7]"
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
