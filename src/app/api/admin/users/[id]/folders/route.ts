import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/** Admin set ulang folder yang boleh diakses viewer. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    folderIds?: string[];
  } | null;

  const folderIds = Array.isArray(body?.folderIds)
    ? body!.folderIds.filter((fid): fid is string => typeof fid === "string" && fid.length > 0)
    : [];

  const { error: rpcError } = await supabase.rpc("admin_set_folder_access", {
    p_user_id: id,
    p_folder_ids: folderIds,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
