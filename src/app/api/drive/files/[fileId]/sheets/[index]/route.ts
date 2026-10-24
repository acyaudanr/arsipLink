import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/api-auth";
import { getParsedDriveFile } from "@/lib/drive/client";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Isi satu sheet lengkap untuk viewer (dari cache memori server / Drive). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string; index: string }> }
) {
  const { error } = await requireViewer();
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { fileId, index } = await params;
  try {
    const file = await getParsedDriveFile(fileId);
    const sheet = file.sheets[Number(index)];
    if (!sheet) return NextResponse.json({ error: "Sheet tidak ditemukan" }, { status: 404 });
    return NextResponse.json(sheet);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal membaca sheet dari Drive" },
      { status: 500 }
    );
  }
}
