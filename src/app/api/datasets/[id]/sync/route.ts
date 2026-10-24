import { NextResponse } from "next/server";

// Sync ke database sudah dihapus: file selalu dibaca langsung dari Drive.
export async function POST() {
  return NextResponse.json(
    { error: "Sync sudah tidak diperlukan. File dibaca langsung dari Google Drive." },
    { status: 410 }
  );
}
