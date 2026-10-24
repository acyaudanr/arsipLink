import { NextResponse } from "next/server";
import { assertDriveFileAccess } from "@/lib/api-auth";
import { getParsedDriveFile } from "@/lib/drive/client";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Isi satu sheet lengkap untuk viewer (dari cache memori server / Drive). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string; index: string }> }
) {
  const { fileId, index } = await params;
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
