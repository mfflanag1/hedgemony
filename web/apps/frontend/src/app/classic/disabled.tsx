"use client";

import Link from "next/link";

/** Shown when classic mode is not enabled (NEXT_PUBLIC_ENABLE_CLASSIC unset). */
export function ClassicDisabled() {
  return (
    <main className="min-h-screen flex items-center justify-center px-8">
      <div className="border-l-2 border-zinc-600 pl-6 max-w-lg">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2">
          Classic mode disabled
        </p>
        <p className="font-mono text-sm text-zinc-300">
          The original RAND Hedgemony mode is for local, personal study only and is gated
          behind <code>NEXT_PUBLIC_ENABLE_CLASSIC</code>. It is intentionally unavailable in
          this build.
        </p>
        <Link href="/" className="font-mono text-xs text-amber-400 mt-3 inline-block">
          ← back to Hedgemony: Takeoff
        </Link>
      </div>
    </main>
  );
}
