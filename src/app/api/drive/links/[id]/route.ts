import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseDriveLink } from "@/lib/drive/client";

export const runtime = "nodejs";

/** Admin update nama file, deskripsi, dan/atau link Drive. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const { id } = await params;

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    description?: string;
    drive_url?: string;
    updateLink?: boolean;
  } | null;

  const patch: Record<string, string | null> = {};

  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: "Nama file tidak boleh kosong" }, { status: 400 });
    patch.title = title;
    patch.file_name = title;
  }

  if (typeof body?.description === "string") {
    patch.description = body.description.trim();
  }

  // Hanya update URL kalau eksplisit diminta (dari list folder), bukan dari preview
  if (body?.updateLink && typeof body?.drive_url === "string") {
    const url = body.drive_url.trim();
    if (!url) return NextResponse.json({ error: "Link tidak boleh kosong" }, { status: 400 });
    const parsed = parseDriveLink(url);
    if (!parsed) return NextResponse.json({ error: "Link Drive tidak valid" }, { status: 400 });

    const { data: dup } = await supabase
      .from("excel_documents")
      .select("id, title")
      .eq("drive_file_id", parsed.id)
      .neq("id", id)
      .maybeSingle();
    if (dup) {
      return NextResponse.json(
        { error: `Link ini sudah dipakai oleh "${dup.title}"` },
        { status: 400 }
      );
    }

    patch.drive_url = url;
    patch.drive_file_id = parsed.id;
    patch.drive_kind = parsed.kind;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const { data, error: updateError } = await supabase
    .from("excel_documents")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ file: data });
}

/** Admin menghapus link terdaftar (file/folder di Drive aslinya TIDAK ikut terhapus). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const { id } = await params;
  const { error: deleteError } = await supabase
    .from("excel_documents")
    .delete()
    .eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
