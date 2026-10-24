import Link from "next/link";
import FolderBrowser from "@/components/FolderBrowser";

export const dynamic = "force-dynamic";

export default async function DriveFolderPage({
  params,
  searchParams,
}: {
  params: Promise<{ folderId: string }>;
  searchParams: Promise<{ root?: string; title?: string }>;
}) {
  const { folderId } = await params;
  const sp = await searchParams;
  const root = sp.root ?? folderId;
  const title = sp.title ?? "Folder Drive";

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 py-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-emerald-700">← Kembali ke daftar link Drive</Link>
        <h1 className="mb-4 mt-2 text-2xl font-bold">📁 {title}</h1>
        <FolderBrowser initialFolderId={folderId} rootFolderId={root} rootTitle={title} />
      </div>
    </div>
  );
}
