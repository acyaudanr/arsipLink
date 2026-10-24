import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/api-auth";
import { getParsedDriveFile } from "@/lib/drive/client";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Info file + daftar sheet (isi dibaca langsung dari Drive, tidak disimpan). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { error } = await requireViewer();
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { fileId } = await params;
  try {
    const file = await getParsedDriveFile(fileId);
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
