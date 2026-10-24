"use client";

import { useEffect } from "react";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  busy = false,
  tone = "danger",
  children,
  confirmDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: "danger" | "neutral";
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-[#9b1c1c] hover:bg-[#7f1d1d] text-white"
      : "bg-[#0c1222] hover:bg-[#1a2236] text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-[#0c1222]/55 backdrop-blur-[2px]"
        onClick={() => !busy && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e6e8ee] bg-white shadow-[0_24px_80px_-24px_rgba(12,18,34,0.45)]"
      >
        <div className="px-5 pt-5 pb-2">
          <div className="mb-3 grid size-11 place-items-center rounded-xl bg-[#fef2f2] text-[#9b1c1c]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-[#0c1222]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[#6b7285]">{description}</p>
          ) : null}
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#eef0f4] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#6b7285] hover:bg-[#f4f5f7] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
