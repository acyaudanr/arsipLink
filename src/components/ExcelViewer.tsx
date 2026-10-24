"use client";

import { useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import type { ParsedSheet } from "@/lib/types";

const CHUNK_OPTIONS = [100, 250, 500, 1000, 2000];

function isUraianInformasiColumn(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("uraian") && (n.includes("informasi") || n.includes("arsip"));
}

type ColSize = {
  /** Lebar target / max (ch); null = kolom fleksibel (uraian) */
  ch: number | null;
  /** Floor supaya header tidak pecah per huruf */
  minCh: number;
  /** Isi > 40 karakter → body wrap, lebar dibatasi */
  canGrowBody: boolean;
  /** Header lebih panjang dari lebar isi → header wrap per kata */
  canGrowHeader: boolean;
  /** Kolom sempit: jangan serap sisa lebar tabel */
  tight: boolean;
};

const CONTENT_GROW_AT = 40;
/** Lebar max untuk kolom isi panjang (jangan mendominasi tabel). */
const LONG_COL_MAX_CH = 28;
/** Floor lebar saat header di-wrap (muat kata, bukan huruf). */
const HEADER_WRAP_MIN_CH = 8;

/**
 * Autofit dari isi; header panjang di-wrap per kata.
 * Min-width dijaga agar header tidak vertikal per huruf.
 */
function measureColWidths(
  headers: string[],
  rows: string[][],
  sampleLimit = 200
): ColSize[] {
  const sample = rows.length > sampleLimit ? rows.slice(0, sampleLimit) : rows;
  return headers.map((h, i) => {
    if (isUraianInformasiColumn(h)) {
      return {
        ch: null,
        minCh: 12,
        canGrowBody: true,
        canGrowHeader: true,
        tight: false,
      };
    }

    const headerText = h.replace(/\s+/g, " ").trim();
    const headerLen = headerText.length;
    const words = headerText.split(/[\s/]+/).filter(Boolean);
    const longestWord = words.reduce((m, w) => Math.max(m, w.length), 1);

    let contentMax = 0;
    for (const row of sample) {
      const len = String(row[i] ?? "").trim().length;
      if (len > contentMax) contentMax = len;
    }

    const canGrowBody = contentMax > CONTENT_GROW_AT;

    // Lebar dari isi
    let ch = Math.max(contentMax + 2, 3);
    if (canGrowBody) {
      ch = Math.min(Math.max(CONTENT_GROW_AT, 16), LONG_COL_MAX_CH);
    }

    let canGrowHeader = false;
    let minCh = Math.max(contentMax + 1, 3);

    if (headerLen + 2 > ch) {
      // Wrap header per kata — floor = kata terpanjang (cap wajar)
      canGrowHeader = true;
      const wordFloor = Math.min(Math.max(longestWord + 1, HEADER_WRAP_MIN_CH), 14);
      minCh = Math.max(minCh, wordFloor);
      ch = Math.max(ch, wordFloor);
    } else {
      // Header muat 1 baris
      ch = Math.max(ch, headerLen + 2);
      minCh = Math.max(minCh, headerLen + 2);
    }

    if (canGrowBody) {
      ch = Math.min(ch, LONG_COL_MAX_CH);
    }

    return {
      ch: Math.min(ch, 40),
      minCh: Math.min(minCh, ch),
      canGrowBody,
      canGrowHeader,
      tight: !canGrowBody,
    };
  });
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
      {/* Toolbar di luar scroll → tidak bentrok sticky header saat scroll horizontal */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
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

        <table className="locked-table text-xs">
          <colgroup>
            {colWidths.map((col, i) => (
              <col
                key={i}
                style={
                  col.ch == null
                    ? { width: "auto", minWidth: `${col.minCh}ch` }
                    : {
                        width: col.tight ? "1%" : `${col.ch}ch`,
                        minWidth: `${col.minCh}ch`,
                        maxWidth: `${col.ch}ch`,
                      }
                }
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {sheet.headers.map((h, i) => {
                const col = colWidths[i];
                const isUraian = isUraianInformasiColumn(h);
                const wrapHeader = col?.canGrowHeader ?? false;
                return (
                  <th
                    key={i}
                    style={
                      col
                        ? {
                            minWidth: `${col.minCh}ch`,
                            maxWidth: col.ch != null ? `${col.ch}ch` : undefined,
                          }
                        : undefined
                    }
                    className={
                      isUraian
                        ? "sticky top-0 z-20 border border-slate-300 bg-slate-100 px-3 py-2.5 text-left align-middle text-xs font-bold text-slate-800"
                        : wrapHeader
                          ? "col-fixed-header col-header-cangrow sticky top-0 z-20 border border-slate-300 bg-slate-100 px-1.5 py-2 text-center align-middle text-xs font-bold text-slate-800"
                          : "col-fixed-header sticky top-0 z-20 border border-slate-300 bg-slate-100 px-1.5 py-2 text-center align-middle text-xs font-bold text-slate-800"
                    }
                  >
                    {h}
                  </th>
                );
              })}
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
                    const col = colWidths[ci];
                    const isUraian = isUraianInformasiColumn(h);
                    const canGrowBody = col?.canGrowBody ?? false;
                    return (
                      <td
                        key={ci}
                        title={isUraian || canGrowBody ? undefined : String(cellVal)}
                        style={
                          col
                            ? {
                                minWidth: `${col.minCh}ch`,
                                maxWidth: col.ch != null ? `${col.ch}ch` : undefined,
                              }
                            : undefined
                        }
                        className={
                          isUraian
                            ? "col-flexible-main border border-slate-200 px-3 py-2 align-top text-left text-xs text-slate-800"
                            : canGrowBody
                              ? "col-fixed-body col-cangrow border border-slate-200 px-2 py-2 align-top text-left text-xs text-slate-800"
                              : "col-fixed-body border border-slate-200 px-1.5 py-2 text-center align-top text-xs text-slate-800"
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
