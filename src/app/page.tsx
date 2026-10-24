import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { DriveFolder, ExcelDocument } from "@/lib/types";
import FolderActions from "@/components/FolderActions";
import ViewerHome from "@/components/ViewerHome";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const isAdmin = profile?.role === "admin";

  // Viewer: landing dengan selector, file belum dipilih
  if (profile?.role === "viewer") {
    const { data: foldersRaw } = await supabase
      .from("drive_folders")
      .select("*")
      .order("name", { ascending: true });
    const folders = (foldersRaw ?? []) as DriveFolder[];

    const requestedId = sp.folder?.trim() || "";
    const currentFolder =
      folders.find((f) => f.id === requestedId) ?? folders[0] ?? null;

    let files: ExcelDocument[] = [];
    if (currentFolder) {
      const { data: filesRaw } = await supabase
        .from("excel_documents")
        .select("*")
        .eq("folder_id", currentFolder.id)
        .order("title", { ascending: true });
      files = (filesRaw ?? []) as ExcelDocument[];
    }

    return (
      <ViewerHome folders={folders} currentFolder={currentFolder} files={files} />
    );
  }

  const { data: folders } = await supabase
    .from("drive_folders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: docs } = await supabase.from("excel_documents").select("folder_id");
  const countMap = new Map<string, number>();
  for (const row of docs ?? []) {
    if (!row.folder_id) continue;
    countMap.set(row.folder_id, (countMap.get(row.folder_id) ?? 0) + 1);
  }

  const list = ((folders ?? []) as DriveFolder[]).map((f) => ({
    ...f,
    file_count: countMap.get(f.id) ?? 0,
  }));

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto w-full max-w-[1280px] px-5 py-10">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a91a0]">
          Koleksi arsip
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[#0c1222] sm:text-4xl">
          Folder
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#6b7285]">
          Buka folder untuk melihat file Drive di dalamnya. Tambah folder atau link lewat tombol
          Upload di pojok kanan atas.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d5d8e0] bg-white/70 px-6 py-16 text-center">
          <p className="font-display text-xl text-[#0c1222]">Belum ada folder</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6b7285]">
            Klik Upload di navigasi atas, buat folder baru, lalu tempel link Google Drive.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((folder) => (
            <li
              key={folder.id}
              className="group flex overflow-hidden rounded-2xl border border-[#e8eaef] bg-white transition hover:border-[#cfd8d4] hover:shadow-[0_12px_32px_-20px_rgba(12,18,34,0.35)]"
            >
              <Link href={`/folders/${folder.id}`} className="flex min-w-0 flex-1 items-stretch">
                <div className="flex min-w-0 flex-1 gap-4 p-5">
                  <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl border border-[#e8eaef] bg-[#f7f6f3] text-[#1f6b5a]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[16px] font-semibold text-[#0c1222] group-hover:text-[#1f6b5a]">
                      {folder.name}
                    </h2>
                    {folder.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#6b7285]">
                        {folder.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-[#b0b5c0]">Tanpa deskripsi</p>
                    )}
                    <p className="mt-3 text-[11px] text-[#a0a6b4]">
                      Dibuat{" "}
                      {new Date(folder.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex w-[88px] shrink-0 flex-col items-center justify-center border-l border-[#eef0f4] bg-[#fafaf8]">
                  <span className="font-display text-3xl font-semibold tabular-nums leading-none tracking-tight text-[#0c1222]">
                    {folder.file_count}
                  </span>
                  <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a91a0]">
                    File
                  </span>
                </div>
              </Link>

              {isAdmin && (
                <div className="flex items-center border-l border-[#eef0f4] px-2">
                  <FolderActions
                    folderId={folder.id}
                    folderName={folder.name}
                    folderDescription={folder.description ?? ""}
                    fileCount={folder.file_count ?? 0}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
    </div>
  );
}
