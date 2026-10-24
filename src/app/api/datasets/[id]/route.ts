import { NextResponse } from "next/server";

// Endpoint dataset database lama sudah dihapus.
export async function DELETE() {
  return NextResponse.json({ error: "Endpoint sudah tidak dipakai." }, { status: 410 });
}
