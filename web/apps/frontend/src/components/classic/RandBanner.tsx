"use client";

/** Persistent attribution + license banner shown on every classic-mode screen. */
export function RandBanner() {
  return (
    <div className="px-4 py-1.5 bg-amber-950/40 border-b border-amber-800/40">
      <p className="font-mono text-[10px] text-amber-300/90 leading-snug">
        ⚠ Original <strong>Hedgemony: A Game of Strategic Choices</strong> © 2020 RAND
        Corporation (TL301). Digital study aid — <strong>local / personal use only, not
        for public hosting</strong>. Not affiliated with or endorsed by RAND. See
        ORIGINAL/NOTICE.md.
      </p>
    </div>
  );
}
