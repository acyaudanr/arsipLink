import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDriveItem, isServiceAccountConfigured, parseDriveLink } from "@/lib/drive/client";

export const runtime = "nodejs";
export const maxDuration = 60;

interface LinkItem {
  link: string;
  fileName: string;
  description?: string;
}

/**
 * Admin daftarkan link Drive ke satu folder.
 * Setiap item WAJIB punya fileName + link (satu link satu nama).
 * Body: { folderId?, newFolder?: { name, description }, items: LinkItem[] }
 */
export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin();
  if (error || !user) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    folderId?: string;
    newFolder?: { name?: string; description?: string };
    items?: LinkItem[];
  } | null;

  const items = (body?.items ?? [])
    .map((it) => ({
      link: (it.link ?? "").trim(),
      fileName: (it.fileName ?? "").trim(),
      description: (it.description ?? "").trim(),
    }))
    .filter((it) => it.link || it.fileName);

  if (items.length === 0) {
    return NextResponse.json({ error: "Minimal satu file (nama + link)" }, { status: 400 });
  }
  for (const it of items) {
    if (!it.fileName) {
      return NextResponse.json({ error: "Setiap file wajib punya nama file" }, { status: 400 });
    }
    if (!it.link) {
      return NextResponse.json({ error: `Link wajib diisi untuk "${it.fileName}"` }, { status: 400 });
    }
  }

  let folderId = body?.folderId?.trim() || "";

  if (!folderId) {
    const name = body?.newFolder?.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Pilih folder yang sudah ada, atau isi nama folder baru" },
        { status: 400 }
      );
    }
    const { data: folder, error: folderError } = await supabase
      .from("drive_folders")
      .insert({
        name,
        description: body?.newFolder?.description?.trim() ?? "",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (folderError || !folder) {
      return NextResponse.json(
        { error: folderError?.message ?? "Gagal membuat folder" },
        { status: 500 }
      );
    }
    folderId = folder.id as string;
  } else {
    const { data: existing } = await supabase
      .from("drive_folders")
      .select("id")
      .eq("id", folderId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }
  }

  const results: { link: string; ok: boolean; error?: string; title?: string }[] = [];

  for (const it of items) {
    try {
      const parsed = parseDriveLink(it.link);
      if (!parsed) throw new Error("Link Drive tidak valid");

      const { data: dup } = await supabase
        .from("excel_documents")
        .select("id, title")
        .eq("drive_file_id", parsed.id)
        .maybeSingle();
      if (dup) throw new Error(`Sudah terdaftar sebagai "${dup.title}"`);

      let driveKind = parsed.kind;
      if (isServiceAccountConfigured()) {
        try {
          const item = await getDriveItem(parsed.id);
          driveKind = item.kind;
        } catch {
          // abaikan — nama file dari user yang dipakai
        }
      }

      const { error: insertError } = await supabase.from("excel_documents").insert({
        title: it.fileName,
        file_name: it.fileName,
        description: it.description,
        source_type: "drive",
        drive_file_id: parsed.id,
        drive_url: it.link,
        drive_kind: driveKind,
        folder_id: folderId,
        status: "ready",
        uploaded_by: user.id,
        sheet_count: 0,
        total_rows: 0,
      });
      if (insertError) throw new Error(insertError.message);
      results.push({ link: it.link, ok: true, title: it.fileName });
    } catch (e) {
      results.push({
        link: it.link,
        ok: false,
        error: e instanceof Error ? e.message : "Gagal mendaftarkan link",
        title: it.fileName,
      });
    }
  }

  return NextResponse.json({ folderId, results });
}
