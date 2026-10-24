import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { DriveFolder, ExcelDocument } from "@/lib/types";
import FolderFileList from "@/components/FolderFileList";
import FolderHeaderActions from "@/components/FolderHeaderActions";

export const dynamic = "force-dynamic";

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const isAdmin = profile?.role === "admin";

  const { data: folder } = await supabase
    .from("drive_folders")
    .select("*")
    .eq("id", id)
    .single();
  if (!folder) notFound();

  const { data: files } = await supabase
    .from("excel_documents")
    .select("*")
    .eq("folder_id", id)
    .order("title", { ascending: true });

  const f = folder as DriveFolder;
  const list = (files ?? []) as ExcelDocument[];

  // Viewer: kembali ke home dengan folder terpilih, file belum dipilih
  if (!isAdmin) {
    redirect(`/?folder=${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#6b7285] hover:text-[#0c1222]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Semua folder
      </Link>

      <div className="mt-4 mb-8 border-b border-[#e8eaef] pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a91a0]">
              Folder
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#0c1222]">
                {f.name}
              </h1>
              {isAdmin && (
                <FolderHeaderActions
                  folderId={f.id}
                  folderName={f.name}
                  folderDescription={f.description ?? ""}
                />
              )}
            </div>
            {f.description ? (
              <p className="mt-2 text-[15px] leading-relaxed text-[#6b7285]">{f.description}</p>
            ) : null}
          </div>
          <p className="text-sm tabular-nums text-[#8a91a0]">{list.length} file</p>
        </div>
      </div>

      <FolderFileList files={list} isAdmin={isAdmin} folderId={f.id} />
    </div>
  );
}
