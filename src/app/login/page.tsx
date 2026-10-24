"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-11 place-items-center rounded-md bg-[#0c1222] font-display text-sm font-bold text-white">
            AR
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#0c1222]">Arsip</h1>
          <p className="mt-1.5 text-sm text-[#6b7285]">Baca spreadsheet Google Drive dengan rapi.</p>
        </div>

        <div className="rounded-2xl border border-[#e8eaef] bg-white p-6 shadow-[0_20px_50px_-28px_rgba(12,18,34,0.35)]">
          <h2 className="mb-5 text-center text-sm font-semibold text-[#0c1222]">Masuk</h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0c1222]">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e0e3ea] px-3 py-2.5 text-sm outline-none focus:border-[#1f6b5a] focus:ring-2 focus:ring-[#1f6b5a]/15"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-[#0c1222] py-2.5 text-sm font-semibold text-white hover:bg-[#1a2236] disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-[#8a91a0]">
          Akun Viewer dibuat oleh Administrator.
        </p>
      </div>
    </div>
  );
}
