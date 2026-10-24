import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import DrivePreviewShell from "@/components/DrivePreviewShell";
import type { DriveFolder, ExcelDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DriveFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ fileId: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const { fileId } = await params;
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const isAdmin = profile?.role === "admin";

  const { data: currentDoc } = await supabase
    .from("excel_documents")
    .select("*")
    .eq("drive_file_id", fileId)
    .maybeSingle();

  // Viewer hanya boleh buka file terdaftar di folder yang diizinkan (RLS).
  if (!isAdmin && !currentDoc) notFound();

  const title = currentDoc?.title || sp.title || "File Drive";
  const description = (currentDoc?.description as string) || "";
  const folderId = currentDoc?.folder_id as string | null;
  const driveUrl =
    (currentDoc?.drive_url as string) || `https://drive.google.com/file/d/${fileId}/view`;

  const { data: allFolders } = await supabase
    .from("drive_folders")
    .select("*")
    .order("name", { ascending: true });

  let currentFolder: DriveFolder | null = null;
  let siblingFiles: ExcelDocument[] = [];

  if (folderId) {
    const { data: folder } = await supabase
      .from("drive_folders")
      .select("*")
      .eq("id", folderId)
      .maybeSingle();
    currentFolder = (folder as DriveFolder) ?? null;

    const { data: files } = await supabase
      .from("excel_documents")
      .select("*")
      .eq("folder_id", folderId)
      .order("title", { ascending: true });
    siblingFiles = (files ?? []) as ExcelDocument[];
  } else if (currentDoc) {
    siblingFiles = [currentDoc as ExcelDocument];
  }

  if (!siblingFiles.some((f) => f.drive_file_id === fileId)) {
    siblingFiles = [
      {
        id: "current",
        title,
        file_name: title,
        description,
        source_type: "drive",
        drive_kind: "file",
        drive_file_id: fileId,
        drive_url: driveUrl,
        drive_modified_time: null,
        folder_id: folderId,
        file_size: null,
        status: "ready",
        error_message: null,
        sheet_count: 0,
        total_rows: 0,
        uploaded_by: null,
        last_synced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ...siblingFiles,
    ];
  }

  return (
    <DrivePreviewShell
      folders={(allFolders ?? []) as DriveFolder[]}
      currentFolder={currentFolder}
      files={siblingFiles}
      currentFileId={fileId}
      isViewer={!isAdmin}
    />
  );
}
