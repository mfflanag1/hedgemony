import Link from "next/link";
import { FACTIONS, FACTION_ORDER } from "@hedgemony/shared";
import { CLASSIC_ENABLED } from "@/lib/classicEnabled";

export default function LandingPage() {
  return (
    <main className="min-h-screen relative z-10 px-8 py-16 max-w-5xl mx-auto">
      <div className="border-l-2 border-openbrain pl-6 mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-2">
          TAKEOFF SCENARIO · Q1 2026
        </p>
        <h1 className="font-serif text-5xl mb-4 leading-tight">
          Hedgemony: <span className="text-openbrain">Takeoff</span>
        </h1>
        <p className="font-sans text-lg text-zinc-400 max-w-2xl">
          A 7-faction wargame about the AI race, adapted from RAND's Hedgemony around the AI 2027 forecast.
          16 quarters from Q1 2026 to Q4 2029.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-12">
        {FACTION_ORDER.map((id) => {
          const f = FACTIONS[id];
          return (
            <div
              key={id}
              className="border border-bg-line bg-bg-panel p-3 rounded-sm"
              style={{ borderTopColor: f.accentColor, borderTopWidth: 2 }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-wider mb-1"
                style={{ color: f.accentColor }}
              >
                {f.shortName}
              </div>
              <div className="font-sans text-sm font-semibold">{f.displayName}</div>
              <div className="font-sans text-xs text-zinc-500 mt-1 leading-snug">
                {f.oneLineGoal}
              </div>
            </div>
          );
        })}
      </div>

      <nav className="flex gap-6 font-mono text-sm">
        <Link href="/games/new" className="text-openbrain hover:text-white border border-openbrain hover:bg-openbrain hover:text-bg-base transition-colors px-4 py-2 rounded-sm uppercase tracking-wider text-xs">
          → New Game
        </Link>
        <Link href="/codex" className="text-zinc-300 hover:text-openbrain underline underline-offset-4 pt-2">
          Card Codex
        </Link>
        {CLASSIC_ENABLED && (
          <Link
            href="/classic/new"
            className="text-amber-400 hover:text-white border border-amber-500 hover:bg-amber-500 hover:text-bg-base transition-colors px-4 py-2 rounded-sm uppercase tracking-wider text-xs"
            title="Original RAND Hedgemony — local study use only"
          >
            → Original
          </Link>
        )}
        <span className="text-zinc-600 pt-2">/rules (soon)</span>
      </nav>

      <footer className="mt-24 pt-6 border-t border-bg-line font-mono text-xs text-zinc-600">
        Phase 1+2 of 7 · game engine + core UI · 152 cards loaded ·
        requires engine server at ws://localhost:2567
      </footer>
    </main>
  );
}
