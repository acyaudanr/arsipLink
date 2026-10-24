"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DriveFolder, Profile } from "@/lib/types";

type AccessMap = Record<string, string[]>;

export default function UsersClient({
  profiles,
  folders,
  accessByUser,
  currentUserId,
}: {
  profiles: Profile[];
  folders: DriveFolder[];
  accessByUser: AccessMap;
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newFolderIds, setNewFolderIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFolderIds, setEditFolderIds] = useState<string[]>([]);

  const folderName = useMemo(() => {
    const map = new Map(folders.map((f) => [f.id, f.name]));
    return (id: string) => map.get(id) ?? id.slice(0, 8);
  }, [folders]);

  function toggleInList(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  async function createViewer(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, folderIds: newFolderIds }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat viewer");
      setEmail("");
      setPassword("");
      setNewFolderIds([]);
      setMessage("Viewer berhasil dibuat.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat viewer");
    } finally {
      setCreating(false);
    }
  }

  async function toggleRole(p: Profile) {
    const nextRole = p.role === "admin" ? "viewer" : "admin";
    if (p.id === currentUserId && nextRole === "viewer") {
      setError("Kamu tidak bisa menurunkan role kamu sendiri.");
      return;
    }
    if (
      !confirm(
        `Ubah ${p.email} menjadi ${nextRole === "admin" ? "Administrator" : "Viewer"}?`
      )
    ) {
      return;
    }
    setBusyId(p.id);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", p.id);
    if (error) setError(error.message);
    setBusyId(null);
    router.refresh();
  }

  function startEditAccess(p: Profile) {
    setEditingId(p.id);
    setEditFolderIds(accessByUser[p.id] ?? []);
    setError(null);
    setMessage(null);
  }

  async function saveAccess(userId: string) {
    setBusyId(userId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/folders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderIds: editFolderIds }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan akses");
      setEditingId(null);
      setMessage("Akses folder diperbarui.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan akses");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {(error || message) && (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#cfe8df] bg-[#f0faf6] text-[#1f6b5a]"
          }`}
        >
          {error ?? message}
        </p>
      )}

      <section className="rounded-2xl border border-[#e8eaef] bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-[#0c1222]">Tambah Viewer</h2>
        <p className="mb-4 text-sm text-[#6b7285]">
          Buat akun viewer baru dan pilih folder yang boleh dilihat.
        </p>
        <form onSubmit={createViewer} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                placeholder="viewer@email.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[#0c1222]">Akses folder</p>
            {folders.length === 0 ? (
              <p className="text-sm text-[#8a91a0]">Belum ada folder. Buat folder dulu di beranda.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {folders.map((f) => (
                  <li key={f.id}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#e8eaef] px-3 py-2.5 text-sm hover:bg-[#fafaf8]">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={newFolderIds.includes(f.id)}
                        onChange={() => setNewFolderIds((prev) => toggleInList(prev, f.id))}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-[#0c1222]">{f.name}</span>
                        {f.description ? (
                          <span className="block truncate text-xs text-[#8a91a0]">{f.description}</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-[#0c1222] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2236] disabled:opacity-60"
          >
            {creating ? "Membuat..." : "Buat Viewer"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e8eaef] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e8eaef] bg-[#fafaf8] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]">
            <tr>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Akses folder</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef0f4]">
            {profiles.map((p) => {
              const access = accessByUser[p.id] ?? [];
              const isEditing = editingId === p.id;
              return (
                <tr key={p.id} className="align-top hover:bg-[#fafaf8]">
                  <td className="px-5 py-3.5 font-medium text-[#0c1222]">
                    {p.email}
                    {p.id === currentUserId && (
                      <span className="ml-2 text-xs font-normal text-[#a0a6b4]">(kamu)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[#3d4454]">
                    {p.role === "admin" ? "Administrator" : "Viewer"}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.role === "admin" ? (
                      <span className="text-[#8a91a0]">Semua folder</span>
                    ) : isEditing ? (
                      <div className="space-y-2">
                        {folders.length === 0 ? (
                          <p className="text-[#8a91a0]">Belum ada folder</p>
                        ) : (
                          folders.map((f) => (
                            <label key={f.id} className="flex items-center gap-2 text-[#3d4454]">
                              <input
                                type="checkbox"
                                checked={editFolderIds.includes(f.id)}
                                onChange={() =>
                                  setEditFolderIds((prev) => toggleInList(prev, f.id))
                                }
                              />
                              {f.name}
                            </label>
                          ))
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => saveAccess(p.id)}
                            className="rounded-lg bg-[#0c1222] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                          >
                            {busyId === p.id ? "..." : "Simpan"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-[#e0e3ea] px-2.5 py-1 text-xs font-medium text-[#3d4454]"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : access.length === 0 ? (
                      <span className="text-[#b0b5c0]">Tidak ada</span>
                    ) : (
                      <ul className="space-y-0.5 text-[#3d4454]">
                        {access.map((fid) => (
                          <li key={fid}>{folderName(fid)}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      {p.role === "viewer" && !isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditAccess(p)}
                          className="rounded-lg border border-[#e0e3ea] px-3 py-1.5 text-xs font-medium text-[#3d4454] hover:bg-[#f4f5f7]"
                        >
                          Atur folder
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleRole(p)}
                        disabled={busyId === p.id}
                        className="rounded-lg border border-[#e0e3ea] px-3 py-1.5 text-xs font-medium text-[#3d4454] hover:bg-[#f4f5f7] disabled:opacity-60"
                      >
                        {busyId === p.id
                          ? "..."
                          : p.role === "admin"
                            ? "Jadikan Viewer"
                            : "Jadikan Admin"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
