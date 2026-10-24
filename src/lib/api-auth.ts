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
