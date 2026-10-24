import { NextResponse } from "next/server";

// Endpoint lama sudah dihapus; pendaftaran link sekarang di /api/drive/links.
export async function POST() {
  return NextResponse.json(
    { error: "Endpoint sudah tidak dipakai. Gunakan pendaftaran link Drive di dashboard." },
    { status: 410 }
  );
}
