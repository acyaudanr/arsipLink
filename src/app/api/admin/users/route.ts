import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/** Admin buat akun Viewer + akses folder. */
export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    folderIds?: string[];
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const folderIds = Array.isArray(body?.folderIds)
    ? body!.folderIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (!email) {
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const { data, error: rpcError } = await supabase.rpc("admin_create_viewer", {
    p_email: email,
    p_password: password,
    p_folder_ids: folderIds,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }

  return NextResponse.json({ id: data as string });
}
