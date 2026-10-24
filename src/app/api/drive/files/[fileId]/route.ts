import { NextResponse } from "next/server";
import { assertDriveFileAccess } from "@/lib/api-auth";
import { getParsedDriveFile } from "@/lib/drive/client";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Info file + daftar sheet (isi dibaca langsung dari Drive, tidak disimpan). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  const { allowed, error } = await assertDriveFileAccess(fileId);
  if (!allowed) {
    return NextResponse.json(
      { error: error ?? "Tidak ada akses" },
      { status: error === "Belum login" ? 401 : 403 }
    );
  }
  try {
    const fresh = new URL(request.url).searchParams.get("fresh") === "1";
    const file = await getParsedDriveFile(fileId, { fresh });
    return NextResponse.json({
      name: file.name,
      modifiedTime: file.modifiedTime,
      sheets: file.sheets.map((s, i) => ({
        index: i,
        sheetName: s.sheetName,
        rowCount: s.rows.length,
        columnCount: s.headers.length,
        titles: s.titles,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal membaca file dari Drive" },
      { status: 500 }
    );
  }
}
