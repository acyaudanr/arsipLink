import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { id } = await params;
  const { data: folder, error } = await supabase
    .from("drive_folders")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !folder) {
    return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
  }

  const { data: files } = await supabase
    .from("excel_documents")
    .select("*")
    .eq("folder_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ folder, files: files ?? [] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const { id } = await params;
  const { error: deleteError } = await supabase.from("drive_folders").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
