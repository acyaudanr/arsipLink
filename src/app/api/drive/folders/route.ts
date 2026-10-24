import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** List semua folder + jumlah file di dalamnya. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { data: folders, error } = await supabase
    .from("drive_folders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: counts } = await supabase
    .from("excel_documents")
    .select("folder_id");

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    if (!row.folder_id) continue;
    countMap.set(row.folder_id, (countMap.get(row.folder_id) ?? 0) + 1);
  }

  return NextResponse.json({
    folders: (folders ?? []).map((f) => ({
      ...f,
      file_count: countMap.get(f.id) ?? 0,
    })),
  });
}

/** Admin buat folder baru (tanpa link dulu). */
export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin();
  if (error || !user) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    description?: string;
  } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Nama folder wajib diisi" }, { status: 400 });

  const { data, error: insertError } = await supabase
    .from("drive_folders")
    .insert({
      name,
      description: body?.description?.trim() ?? "",
      created_by: user.id,
    })
    .select("*")
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ folder: data });
}
