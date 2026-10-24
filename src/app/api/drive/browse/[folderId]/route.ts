import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/api-auth";
import { getFolderPath, listFolderChildren } from "@/lib/drive/client";

export const runtime = "nodejs";
export const maxDuration = 60;

/** List isi folder Google Drive (bukan folder lokal di database). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { error } = await requireViewer();
  if (error) return NextResponse.json({ error }, { status: 401 });
  const { folderId } = await params;
  const rootId = new URL(request.url).searchParams.get("root");

  try {
    const [items, fullPath] = await Promise.all([
      listFolderChildren(folderId),
      getFolderPath(folderId).catch(() => []),
    ]);
    let path = fullPath;
    if (rootId) {
      const idx = fullPath.findIndex((p) => p.id === rootId);
      if (idx >= 0) path = fullPath.slice(idx);
    }
    return NextResponse.json({ items, path });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal membaca folder Drive" },
      { status: 500 }
    );
  }
}
