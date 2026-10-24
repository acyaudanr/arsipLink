"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResultItem {
  link: string;
  ok: boolean;
  error?: string;
}

export default function DriveLinkForm() {
  const router = useRouter();
  const [links, setLinks] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  async function submit() {
    const list = links.split("\n").map((l) => l.trim()).filter(Boolean);
    if (list.length === 0) return;
    setBusy(true);
    setResults([]);
    try {
      const res = await fetch("/api/drive/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: list }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mendaftarkan link");
      setResults(json.results as ResultItem[]);
      setLinks("");
      router.refresh();
    } catch (e) {
      setResults([{ link: "Google Drive", ok: false, error: e instanceof Error ? e.message : "Gagal mendaftarkan link" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 font-semibold">Daftarkan Link Google Drive</h2>
      <p className="mb-3 text-sm text-gray-500">
        Paste link <b>file</b> atau <b>folder</b> Drive — satu link per baris, bisa banyak sekaligus.
        Website hanya <b>membaca</b> dari Drive; tidak ada isi Excel yang disimpan ke database.
      </p>
      <textarea
        value={links}
        onChange={(e) => setLinks(e.target.value)}
        rows={3}
        placeholder={"https://drive.google.com/drive/folders/xxxx\nhttps://drive.google.com/file/d/yyyy/view\nhttps://docs.google.com/spreadsheets/d/zzzz/edit"}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
      <button
        onClick={submit}
        disabled={busy || !links.trim()}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? "Mendaftarkan..." : "Daftarkan Link"}
      </button>
      {results.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {results.map((r, i) => (
            <li key={i} className={`rounded-lg px-3 py-2 ${r.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {r.ok ? "✅ Terdaftar: " : "❌ "}
              <span className="break-all">{r.link}</span>
              {r.error && <span> — {r.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
