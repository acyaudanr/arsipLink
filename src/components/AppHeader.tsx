"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadModal from "@/components/UploadModal";
import PreviewSelectors from "@/components/PreviewSelectors";
import UserMenu from "@/components/UserMenu";
import { useViewerPreview } from "@/components/ViewerPreviewContext";

export default function AppHeader({
  email,
  role,
}: {
  email: string;
  role: "admin" | "viewer";
}) {
  const [open, setOpen] = useState(false);
  const isAdmin = role === "admin";
  const isViewer = role === "viewer";
  const preview = useViewerPreview();
  const router = useRouter();
  const showViewerNav = isViewer && preview !== null;

  if (showViewerNav && preview) {
    return (
      <header className="sticky top-0 z-40 border-b border-[#e8eaef] bg-white/90 backdrop-blur-md">
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 sm:px-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-[#0c1222] font-display text-[13px] font-bold tracking-wide text-white">
              AR
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-[#0c1222]">
              Arsip
            </span>
          </Link>

          <div className="flex min-w-0 justify-center overflow-visible">
            <PreviewSelectors
              compact
              requireFilePick
              folders={preview.folders}
              currentFolder={preview.currentFolder}
              files={preview.files}
              currentFileId={preview.currentFileId}
              sheets={preview.sheets}
              activeSheet={preview.activeSheet}
              onSheetChange={preview.onSheetChange}
              sheetsLoading={preview.sheetsLoading}
              onFolderSelect={(folderId) => router.push(`/?folder=${folderId}`)}
            />
          </div>

          <div className="flex justify-end">
            <UserMenu email={email} roleLabel="Viewer" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e8eaef] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-6 px-5">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-[#0c1222] font-display text-[13px] font-bold tracking-wide text-white">
              AR
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-[#0c1222]">
              Arsip
            </span>
          </Link>

          {isAdmin && (
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-[#3d4454] hover:bg-[#f4f5f7] hover:text-[#0c1222]"
              >
                Folder
              </Link>
              <Link
                href="/admin/users"
                className="rounded-lg px-3 py-1.5 text-[#3d4454] hover:bg-[#f4f5f7] hover:text-[#0c1222]"
              >
                Pengguna
              </Link>
            </nav>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0c1222] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1a2236]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Upload
                </button>
                <div className="hidden text-right text-xs leading-tight sm:block">
                  <div className="font-medium text-[#0c1222]">{email}</div>
                  <div className="text-[#8a91a0]">Administrator</div>
                </div>
                <form action="/auth/signout" method="post">
                  <button className="rounded-xl border border-[#e0e3ea] px-3 py-2 text-sm text-[#3d4454] hover:bg-[#f4f5f7]">
                    Keluar
                  </button>
                </form>
              </>
            )}
            {isViewer && <UserMenu email={email} roleLabel="Viewer" />}
          </div>
        </div>
      </header>
      {isAdmin && <UploadModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
