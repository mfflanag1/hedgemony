"use client";

import { FACTIONS } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { LogEntrySnapshot } from "@/lib/useGameRoom";
import { useEffect, useRef } from "react";

export function ActionLog({ log, filterCurrentPhase }: { log: LogEntrySnapshot[]; filterCurrentPhase?: { turn: number; phase: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  // Auto-scroll only if the user is already near the bottom — don't yank
  // them away from history they're reading.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    if (nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [log.length]);

  const shown = filterCurrentPhase
    ? log.filter((e) => e.turn === filterCurrentPhase.turn && e.phase === filterCurrentPhase.phase)
    : log;

  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm flex flex-col">
      <header className="px-3 py-2 border-b border-bg-line flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Action Log
        </p>
        <span className="font-mono text-[10px] text-zinc-600">
          {shown.length} entries
        </span>
      </header>
      <div ref={ref} className="px-3 py-2 overflow-y-auto max-h-64">
        {shown.length === 0 && (
          <p className="font-mono text-xs text-zinc-600 italic">no entries yet</p>
        )}
        <ul className="space-y-1">
          {shown.map((e) => {
            const actorMeta = isFactionId(e.actor) ? FACTIONS[e.actor as FactionId] : null;
            return (
              <li key={e.id} className="font-mono text-xs leading-snug flex gap-2">
                <span className="text-zinc-600 shrink-0">T{e.turn}P{e.phase}</span>
                {actorMeta && (
                  <span
                    className="shrink-0 uppercase"
                    style={{ color: actorMeta.accentColor }}
                  >
                    {actorMeta.shortName}
                  </span>
                )}
                {!actorMeta && e.actor !== "system" && (
                  <span className="shrink-0 text-zinc-500 uppercase">{e.actor}</span>
                )}
                <span className="text-zinc-300">{e.message}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function isFactionId(s: string): boolean {
  return (
    s === "OpenBrain" ||
    s === "DeepCent" ||
    s === "Hegemon" ||
    s === "Politburo" ||
    s === "Cartel" ||
    s === "Coalition" ||
    s === "Successor"
  );
}
