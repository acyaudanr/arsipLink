"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";
import type { DriveFolder, Profile } from "@/lib/types";

type AccessMap = Record<string, string[]>;

function FolderChecklist({
  folders,
  selected,
  onChange,
}: {
  folders: DriveFolder[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (folders.length === 0) {
    return <p className="text-sm text-[#8a91a0]">Belum ada folder. Buat folder dulu di beranda.</p>;
  }

  return (
    <ul className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
      {folders.map((f) => (
        <li key={f.id}>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#e8eaef] px-3 py-2.5 text-sm hover:bg-[#fafaf8]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={selected.includes(f.id)}
              onChange={() => toggle(f.id)}
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
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder = "Minimal 6 karakter",
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-[#e0e3ea] px-3 py-2.5 pr-11 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8a91a0] hover:bg-[#f4f5f7] hover:text-[#0c1222]"
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-sm text-[#6b7285]">{subtitle}</p> : null}
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
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

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

  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newFolderIds, setNewFolderIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFolderIds, setEditFolderIds] = useState<string[]>([]);

  const [passwordUser, setPasswordUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteUser, setDeleteUser] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const folderName = useMemo(() => {
    const map = new Map(folders.map((f) => [f.id, f.name]));
    return (id: string) => map.get(id) ?? id.slice(0, 8);
  }, [folders]);

  function resetAddForm() {
    setEmail("");
    setPassword("");
    setNewFolderIds([]);
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
      resetAddForm();
      setAddOpen(false);
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

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordUser) return;
    setSavingPassword(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${passwordUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal mengubah password");
      setPasswordUser(null);
      setNewPassword("");
      setMessage(`Password ${passwordUser.email} diperbarui.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setSavingPassword(false);
    }
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus");
      setDeleteUser(null);
      setMessage(`Akun ${deleteUser.email} dihapus.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAddOpen(true);
          }}
          className="rounded-xl bg-[#0c1222] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2236]"
        >
          + Tambah Viewer
        </button>
      </div>

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
              const isSelf = p.id === currentUserId;
              return (
                <tr key={p.id} className="align-top hover:bg-[#fafaf8]">
                  <td className="px-5 py-3.5 font-medium text-[#0c1222]">
                    {p.email}
                    {isSelf && (
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
                        <FolderChecklist
                          folders={folders}
                          selected={editFolderIds}
                          onChange={setEditFolderIds}
                        />
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
                        onClick={() => {
                          setError(null);
                          setNewPassword("");
                          setPasswordUser(p);
                        }}
                        className="rounded-lg border border-[#e0e3ea] px-3 py-1.5 text-xs font-medium text-[#3d4454] hover:bg-[#f4f5f7]"
                      >
                        Ganti password
                      </button>
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
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setDeleteUser(p);
                          }}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <ModalShell
        open={addOpen}
        onClose={() => !creating && setAddOpen(false)}
        title="Tambah Viewer"
        subtitle="Buat akun viewer dan pilih folder yang boleh dilihat."
      >
        <form onSubmit={createViewer} className="space-y-3.5">
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
          <PasswordInput label="Password" value={password} onChange={setPassword} />
          <div>
            <p className="mb-2 text-sm font-medium text-[#0c1222]">Akses folder</p>
            <FolderChecklist folders={folders} selected={newFolderIds} onChange={setNewFolderIds} />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[#eef0f4] pt-4">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              disabled={creating}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#6b7285] hover:bg-[#f4f5f7]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-[#0c1222] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2236] disabled:opacity-60"
            >
              {creating ? "Membuat..." : "Buat Viewer"}
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={!!passwordUser}
        onClose={() => !savingPassword && setPasswordUser(null)}
        title="Ganti password"
        subtitle={passwordUser?.email}
      >
        <form onSubmit={savePassword} className="space-y-3.5">
          <PasswordInput
            label="Password baru"
            value={newPassword}
            onChange={setNewPassword}
          />
          <div className="flex items-center justify-end gap-2 border-t border-[#eef0f4] pt-4">
            <button
              type="button"
              onClick={() => setPasswordUser(null)}
              disabled={savingPassword}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#6b7285] hover:bg-[#f4f5f7]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-xl bg-[#0c1222] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2236] disabled:opacity-60"
            >
              {savingPassword ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </ModalShell>

      <ConfirmModal
        open={!!deleteUser}
        onClose={() => !deleting && setDeleteUser(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        title="Hapus pengguna?"
        description={
          deleteUser
            ? `Akun “${deleteUser.email}” akan dihapus permanen dan tidak bisa login lagi.`
            : undefined
        }
        confirmLabel="Ya, hapus"
        tone="danger"
      />
    </div>
  );
}
