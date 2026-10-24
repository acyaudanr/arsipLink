"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function UsersClient({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", p.id);
    if (error) setError(error.message);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-[#e8eaef] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e8eaef] bg-[#fafaf8] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]">
            <tr>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Terdaftar</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef0f4]">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-[#fafaf8]">
                <td className="px-5 py-3.5 font-medium text-[#0c1222]">
                  {p.email}
                  {p.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-[#a0a6b4]">(kamu)</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[#3d4454]">
                    {p.role === "admin" ? "Administrator" : "Viewer"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[#6b7285]">
                  {new Date(p.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
