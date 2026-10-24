"use client";

import { useEffect, useRef, useState } from "react";

export default function UserMenu({
  email,
  roleLabel,
}: {
  email: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-full border border-[#e0e3ea] bg-white text-[#3d4454] hover:bg-[#f4f5f7]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#e8eaef] bg-white shadow-[0_16px_40px_-20px_rgba(12,18,34,0.45)]">
          <div className="border-b border-[#eef0f4] px-4 py-3">
            <p className="truncate text-sm font-medium text-[#0c1222]">{email}</p>
            <p className="mt-0.5 text-xs text-[#8a91a0]">{roleLabel}</p>
          </div>
          <div className="p-2">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#3d4454] hover:bg-[#f4f5f7]"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
