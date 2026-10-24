import { NextResponse } from "next/server";

// Endpoint upload ke database sudah dihapus (pivot ke Google Drive).
export async function POST() {
  return NextResponse.json(
    { error: "Metode upload sudah tidak dipakai. Daftarkan link Google Drive." },
    { status: 410 }
  );
}
