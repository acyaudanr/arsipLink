import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/** Admin hapus pengguna. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await requireAdmin();
  if (error || !user) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 403 });
  }
  if (id === user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  const { error: rpcError } = await supabase.rpc("admin_delete_user", {
    p_user_id: id,
  });
  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/** Admin ganti password pengguna. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? "";
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const { error: rpcError } = await supabase.rpc("admin_update_password", {
    p_user_id: id,
    p_password: password,
  });
  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
