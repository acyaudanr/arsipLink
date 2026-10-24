"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SearchableOption = {
  value: string;
  label: string;
  hint?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export default function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Pilih…",
  searchPlaceholder = "Cari…",
  disabled = false,
  compact = false,
  emptyText = "Tidak ada hasil",
  minCh = 14,
  maxCh = 36,
}: {
  label?: string;
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  compact?: boolean;
  emptyText?: string;
  /** Lebar trigger mengikuti panjang label (ch) */
  minCh?: number;
  maxCh?: number;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  /** Label yang langsung tampil saat dipilih (sebelum prop value ikut) */
  const [optimistic, setOptimistic] = useState<SearchableOption | null>(null);

  const selectedFromProps = options.find((o) => o.value === value) ?? null;
  const selected =
    optimistic && optimistic.value === value
      ? optimistic
      : optimistic && !selectedFromProps
        ? optimistic
        : selectedFromProps ?? optimistic;

  useEffect(() => {
    // Sinkron: kalau value dari luar sudah sama dengan optimistic, lepas optimistic
    if (optimistic && optimistic.value === value) {
      setOptimistic(null);
    }
  }, [value, optimistic]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint ? o.hint.toLowerCase().includes(q) : false) ||
        o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  const triggerCh = useMemo(() => {
    const labels = [
      selected?.label ?? placeholder,
      ...options.map((o) => o.label),
      // label atas ikut dihitung supaya tidak numpuk dengan select tetangga
      ...(label ? [label] : []),
    ];
    const longest = labels.reduce((m, s) => Math.max(m, s.length), 0);
    return clamp(longest + 2, minCh, maxCh);
  }, [options, selected, placeholder, label, minCh, maxCh]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    const t = window.setTimeout(() => searchRef.current?.focus(), 10);
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  function pick(v: string) {
    const opt = options.find((o) => o.value === v) ?? null;
    if (opt) setOptimistic(opt);
    onChange(v);
    setOpen(false);
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) pick(opt.value);
    }
  }

  const labelCls = compact
    ? "mb-0.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]"
    : "mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a91a0]";

  const displayValue = selected?.value ?? value;

  return (
    <div className="relative shrink-0" ref={rootRef} style={{ width: `${triggerCh}ch` }}>
      {label ? <span className={labelCls}>{label}</span> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 border bg-white text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
          compact
            ? "rounded-lg border-[#e0e3ea] px-2 py-1.5 text-xs"
            : "rounded-xl border-[#e0e3ea] px-3 py-2 text-sm"
        } ${
          open
            ? "border-[#1f6b5a] ring-2 ring-[#1f6b5a]/15"
            : "hover:border-[#c9cdd6]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "font-medium text-[#0c1222]" : "text-[#8a91a0]"
          }`}
          title={selected?.label}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-[#8a91a0] transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-1/2 z-50 mt-1.5 min-w-full -translate-x-1/2 overflow-hidden rounded-xl border border-[#e6e8ee] bg-white shadow-[0_18px_48px_-24px_rgba(12,18,34,0.55)]"
          style={{
            width: "max-content",
            minWidth: "100%",
            maxWidth: "min(92vw, 42rem)",
          }}
        >
          <div className="border-b border-[#eef0f4] p-2">
            <div className="relative">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a0a6b4]"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-[#e8eaef] bg-[#fafaf8] py-2 pl-8 pr-3 text-sm text-[#0c1222] outline-none placeholder:text-[#a0a6b4] focus:border-[#1f6b5a] focus:bg-white focus:ring-2 focus:ring-[#1f6b5a]/12"
              />
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[#8a91a0]">{emptyText}</li>
            ) : (
              filtered.map((opt, i) => {
                const active = opt.value === displayValue;
                const hi = i === highlight;
                return (
                  <li key={`${opt.value}-${i}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(opt.value)}
                      className={`w-full border-l-[3px] px-3 py-2 text-left transition ${
                        active
                          ? "border-l-[#1f6b5a] bg-[#e8f5f0] font-semibold text-[#1f6b5a]"
                          : hi
                            ? "border-l-transparent bg-[#f4f5f7] font-medium text-[#0c1222]"
                            : "border-l-transparent bg-white font-medium text-[#0c1222]"
                      }`}
                    >
                      <span className="block whitespace-normal break-words text-sm leading-snug">
                        {opt.label}
                      </span>
                      {opt.hint ? (
                        <span
                          className={`mt-0.5 block whitespace-normal break-words text-[11px] font-normal ${
                            active ? "text-[#4a8f7f]" : "text-[#8a91a0]"
                          }`}
                        >
                          {opt.hint}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
