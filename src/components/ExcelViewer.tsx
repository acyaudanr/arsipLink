"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import type { ParsedSheet } from "@/lib/types";

const CHUNK_OPTIONS = [100, 250, 500, 1000, 2000];

function isUraianInformasiColumn(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("uraian") && (n.includes("informasi") || n.includes("arsip"));
}

/** Lebar kolom (ch) dari header + sampel isi — kolom pendek (No) tetap sempit. */
function measureColWidths(
  headers: string[],
  rows: string[][],
  sampleLimit = 200
): (number | null)[] {
  const sample = rows.length > sampleLimit ? rows.slice(0, sampleLimit) : rows;
  return headers.map((h, i) => {
    if (isUraianInformasiColumn(h)) return null;
    const words = h.trim().split(/\s+/).filter(Boolean);
    let maxLen = words.length ? Math.max(...words.map((w) => w.length)) : h.length;
    for (const row of sample) {
      const len = String(row[i] ?? "").trim().length;
      if (len > maxLen) maxLen = len;
    }
    // padding kecil; cap biar 1 sel panjang tidak merusak layout
    return Math.min(Math.max(maxLen + 2, 3), 42);
  });
}

/** Header dipotong per kata dengan <br> seperti wakaka2. */
function formatHeaderHTML(colName: string): string {
  const words = colName.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return escapeHtml(colName);
  return words.map(escapeHtml).join("<br>");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, keyword: string): string {
  if (!keyword) return escapeHtml(text);
  const re = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
  return escapeHtml(text).replace(re, '<span class="search-highlight">$1</span>');
}

/**
 * Viewer ala wakaka2.html:
 * banner judul + toolbar & header sticky + tabel full-width + search + chunk.
 */
export default function ExcelViewer({ sheet }: { sheet: ParsedSheet }) {
  const [search, setSearch] = useState("");
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkIndex, setChunkIndex] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarH, setToolbarH] = useState(52);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const apply = () => setToolbarH(el.offsetHeight);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sheet.rows;
    return sheet.rows.filter((row) =>
      row.some((cell) => String(cell ?? "").toLowerCase().includes(keyword))
    );
  }, [sheet.rows, search]);

  const totalChunks = Math.max(1, Math.ceil(filtered.length / chunkSize));
  const safeChunk = Math.min(chunkIndex, totalChunks - 1);
  const startIdx = safeChunk * chunkSize;
  const endIdx = Math.min(startIdx + chunkSize, filtered.length);
  const chunkRows = filtered.slice(startIdx, endIdx);

  const chunkOptions = useMemo(
    () =>
      Array.from({ length: totalChunks }, (_, i) => {
        const s = i * chunkSize + 1;
        const e = Math.min((i + 1) * chunkSize, filtered.length);
        return {
          value: String(i),
          label: `${s}–${e}`,
          hint: `dari ${filtered.length.toLocaleString("id-ID")}`,
        };
      }),
    [totalChunks, chunkSize, filtered.length]
  );

  const colWidths = useMemo(
    () => measureColWidths(sheet.headers, filtered),
    [sheet.headers, filtered]
  );

  function onSearchChange(v: string) {
    setSearch(v);
    setChunkIndex(0);
  }

  function onChunkSizeChange(v: number) {
    setChunkSize(v);
    setChunkIndex(0);
  }

  if (sheet.headers.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center text-sm text-slate-500">
        Sheet ini kosong atau tidak berisi data yang dapat dibaca.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Judul bisa ikut scroll; toolbar + header tabel sticky */}
      <div className="table-scroll min-h-0 flex-1 overflow-auto">
        {sheet.titles.length > 0 && (
          <div className="space-y-0.5 border-b border-slate-200 bg-slate-50 px-4 py-3">
            {sheet.titles.map((t, i) => (
              <div
                key={i}
                className={
                  i === 0
                    ? "text-base font-extrabold uppercase tracking-wide text-slate-800"
                    : i === 1
                      ? "text-sm font-bold uppercase text-slate-700"
                      : "mt-1 border-t border-slate-200 pt-1 text-left text-xs font-semibold text-blue-700"
                }
              >
                {t}
              </div>
            ))}
          </div>
        )}

        {/* Sticky di bawah nav (top scroll container = di bawah PreviewNav / AppHeader) */}
        <div
          ref={toolbarRef}
          className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.06)]"
        >
          <div className="relative min-w-[220px] flex-1">
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari di semua kolom..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex shrink-0 items-end gap-3">
            <SearchableSelect
              compact
              label="Baris / bagian"
              value={String(chunkSize)}
              minCh={8}
              maxCh={14}
              options={CHUNK_OPTIONS.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              onChange={(v) => onChunkSizeChange(Number(v))}
              searchPlaceholder="Cari…"
            />
            <SearchableSelect
              compact
              label="Bagian"
              value={String(safeChunk)}
              disabled={totalChunks <= 1}
              minCh={8}
              maxCh={22}
              options={chunkOptions}
              onChange={(v) => setChunkIndex(Number(v))}
              searchPlaceholder="Cari bagian…"
            />
          </div>
          <span className="text-xs text-slate-400">
            {filtered.length.toLocaleString("id-ID")} baris
            {search.trim() ? " cocok" : ""} • tampil {startIdx + 1}–{endIdx || 0}
          </span>
        </div>

        <table className="locked-table border-collapse text-xs">
          <colgroup>
            {sheet.headers.map((h, i) => {
              const w = colWidths[i];
              return (
                <col
                  key={i}
                  style={
                    w == null
                      ? { width: "auto", minWidth: "12rem" }
                      : { width: `${w}ch`, maxWidth: `${w}ch` }
                  }
                />
              );
            })}
          </colgroup>
          <thead
            className="sticky z-20"
            style={{ top: toolbarH }}
          >
            <tr>
              {sheet.headers.map((h, i) =>
                isUraianInformasiColumn(h) ? (
                  <th
                    key={i}
                    className="border border-slate-300 bg-slate-100 px-3 py-2.5 text-left align-middle text-xs font-bold text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.08)]"
                  >
                    {h}
                  </th>
                ) : (
                  <th
                    key={i}
                    className={`col-fixed-header border border-slate-300 bg-slate-100 px-2 py-2 text-center align-middle text-xs font-bold text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.08)]${
                      h.trim().split(/\s+/).length > 1 ? " col-header-wrap" : ""
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatHeaderHTML(h) }}
                  />
                )
              )}
            </tr>
          </thead>
          <tbody>
            {chunkRows.length === 0 ? (
              <tr>
                <td
                  colSpan={sheet.headers.length}
                  className="border border-slate-200 px-4 py-10 text-center text-slate-400"
                >
                  Tidak ada baris yang cocok.
                </td>
              </tr>
            ) : (
              chunkRows.map((row, ri) => (
                <tr key={startIdx + ri} className="hover:bg-blue-50/70">
                  {sheet.headers.map((h, ci) => {
                    const cellVal = row[ci] ?? "";
                    const kw = search.trim();
                    const isUraian = isUraianInformasiColumn(h);
                    return (
                      <td
                        key={ci}
                        title={isUraian ? undefined : String(cellVal)}
                        className={
                          isUraian
                            ? "col-flexible-main border border-slate-200 px-3 py-2 align-top text-left text-xs text-slate-800"
                            : "col-fixed-body border border-slate-200 px-2 py-2 text-center align-top text-xs text-slate-800"
                        }
                        dangerouslySetInnerHTML={{
                          __html: highlight(String(cellVal), kw),
                        }}
                      />
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
