import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import UsersClient from "@/components/UsersClient";
import type { DriveFolder, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const [{ data: profiles }, { data: folders }, { data: accessRows }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("drive_folders").select("*").order("name", { ascending: true }),
    supabase.from("folder_access").select("user_id, folder_id"),
  ]);

  const accessByUser: Record<string, string[]> = {};
  for (const row of accessRows ?? []) {
    const uid = row.user_id as string;
    const fid = row.folder_id as string;
    if (!accessByUser[uid]) accessByUser[uid] = [];
    accessByUser[uid].push(fid);
  }

  return (
    <div className="mx-auto max-w-[960px] px-5 py-10">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a91a0]">
        Administrasi
      </p>
      <h1 className="font-display mb-2 text-3xl font-semibold tracking-tight text-[#0c1222]">
        Pengguna
      </h1>
      <p className="mb-8 max-w-xl text-sm leading-relaxed text-[#6b7285]">
        Daftarkan Viewer di sini dan tentukan folder mana saja yang boleh mereka buka. Login publik
        hanya untuk masuk, tanpa daftar.
      </p>
      <UsersClient
        profiles={(profiles ?? []) as Profile[]}
        folders={(folders ?? []) as DriveFolder[]}
        accessByUser={accessByUser}
        currentUserId={profile.id}
      />
    </div>
  );
}
