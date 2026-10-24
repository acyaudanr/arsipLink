import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import UsersClient from "@/components/UsersClient";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a91a0]">
        Administrasi
      </p>
      <h1 className="font-display mb-2 text-3xl font-semibold tracking-tight text-[#0c1222]">
        Pengguna
      </h1>
      <p className="mb-8 max-w-xl text-sm leading-relaxed text-[#6b7285]">
        Naikkan role menjadi Administrator atau turunkan menjadi Viewer. Akun baru otomatis Viewer.
      </p>
      <UsersClient profiles={(data ?? []) as Profile[]} currentUserId={profile.id} />
    </div>
  );
}
