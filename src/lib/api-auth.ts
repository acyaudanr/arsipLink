import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Pastikan ada user login (Admin/Viewer boleh baca Drive). */
export async function requireViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, error: "Belum login" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile: (profile as Profile) ?? null, error: null };
}

/**
 * Viewer hanya boleh baca file yang terdaftar di folder yang diizinkan.
 * Admin boleh semua. File yang belum terdaftar di DB: hanya Admin.
 */
export async function assertDriveFileAccess(driveFileId: string) {
  const auth = await requireViewer();
  if (auth.error || !auth.user || !auth.profile) {
    return { ...auth, allowed: false as const, error: auth.error ?? ("Belum login" as const) };
  }
  if (auth.profile.role === "admin") {
    return { ...auth, allowed: true as const, error: null };
  }

  const { data: doc } = await auth.supabase
    .from("excel_documents")
    .select("id, folder_id")
    .eq("drive_file_id", driveFileId)
    .maybeSingle();

  if (!doc) {
    return {
      ...auth,
      allowed: false as const,
      error: "Tidak ada akses ke file ini" as const,
    };
  }
  return { ...auth, allowed: true as const, error: null };
}

/** Viewer hanya boleh buka folder arsip yang diizinkan. */
export async function assertArchiveFolderAccess(folderId: string) {
  const auth = await requireViewer();
  if (auth.error || !auth.user || !auth.profile) {
    return { ...auth, allowed: false as const, error: auth.error ?? ("Belum login" as const) };
  }
  if (auth.profile.role === "admin") {
    return { ...auth, allowed: true as const, error: null };
  }

  const { data: folder } = await auth.supabase
    .from("drive_folders")
    .select("id")
    .eq("id", folderId)
    .maybeSingle();

  if (!folder) {
    return {
      ...auth,
      allowed: false as const,
      error: "Tidak ada akses ke folder ini" as const,
    };
  }
  return { ...auth, allowed: true as const, error: null };
}
