"use client";

import { useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import type { ParsedSheet } from "@/lib/types";

const CHUNK_OPTIONS = [100, 250, 500, 1000, 2000];

function isUraianInformasiColumn(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("uraian") && (n.includes("informasi") || n.includes("arsip"));
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
 * banner judul dokumen + tabel full-width + sticky header + search + chunk.
 */
export default function ExcelViewer({ sheet }: { sheet: ParsedSheet }) {
  const [search, setSearch] = useState("");
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkIndex, setChunkIndex] = useState(0);

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
      {/* Banner judul dokumen (baris di atas header Excel) */}
      {sheet.titles.length > 0 && (
        <div className="shrink-0 space-y-0.5 border-b border-slate-200 bg-slate-50 px-4 py-3">
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

      {/* Toolbar: search + chunk */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="relative min-w-[220px] flex-1">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari di semua kolom..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex shrink-0 items-end gap-3">
          <SearchableSelect
            compact
            label="Baris / bagian"
            value={String(chunkSize)}
            minCh={14}
            maxCh={18}
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
            minCh={10}
            maxCh={16}
            options={Array.from({ length: totalChunks }, (_, i) => {
              const s = i * chunkSize + 1;
              const e = Math.min((i + 1) * chunkSize, filtered.length);
              return {
                value: String(i),
                label: `${s}–${e}`,
                hint: `dari ${filtered.length.toLocaleString("id-ID")}`,
              };
            })}
            onChange={(v) => setChunkIndex(Number(v))}
            searchPlaceholder="Cari bagian…"
          />
        </div>
        <span className="text-xs text-slate-400">
          {filtered.length.toLocaleString("id-ID")} baris
          {search.trim() ? " cocok" : ""} • tampil {startIdx + 1}–{endIdx || 0}
        </span>
      </div>

      {/* Tabel full-width sticky header — layout ala wakaka2 */}
      <div className="table-scroll min-h-0 flex-1 overflow-auto">
        <table className="locked-table w-full border-collapse text-xs">
          <colgroup>
            {sheet.headers.map((h, i) => (
              <col
                key={i}
                style={{ width: isUraianInformasiColumn(h) ? "auto" : "1%" }}
              />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr>
              {sheet.headers.map((h, i) =>
                isUraianInformasiColumn(h) ? (
                  <th
                    key={i}
                    className="border border-slate-300 bg-slate-100 px-3 py-2.5 text-center align-middle text-xs font-bold text-slate-800"
                  >
                    {h}
                  </th>
                ) : (
                  <th
                    key={i}
                    className="col-fixed-header border border-slate-300 bg-slate-100 px-2 py-2 text-center align-middle text-xs font-bold text-slate-800"
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
