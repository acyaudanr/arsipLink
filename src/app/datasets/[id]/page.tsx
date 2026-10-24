import { redirect } from "next/navigation";

// Halaman dataset database lama sudah dihapus (pivot ke Google Drive viewer).
export default function RemovedPage() {
  redirect("/");
}
