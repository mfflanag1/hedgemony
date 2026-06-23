"use client";

import { FACTIONS } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { DiceRollSnapshot } from "@/lib/useGameRoom";

const FACTION_IDS = new Set([
  "OpenBrain",
  "DeepCent",
  "Hegemon",
  "Politburo",
  "Cartel",
  "Coalition",
  "Successor",
]);

/** Renders the server's audited dice rolls (alignment checks, card rolls, etc.). */
export function DiceLog({ dice }: { dice: DiceRollSnapshot[] }) {
  // Most recent first.
  const shown = [...dice].reverse();
  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm flex flex-col">
      <header className="px-3 py-2 border-b border-bg-line flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Dice</p>
        <span className="font-mono text-[10px] text-zinc-600">{dice.length} rolls</span>
      </header>
      <div className="px-3 py-2 overflow-y-auto max-h-48">
        {shown.length === 0 && (
          <p className="font-mono text-xs text-zinc-600 italic">no rolls yet</p>
        )}
        <ul className="space-y-1">
          {shown.map((d) => {
            const actorMeta = FACTION_IDS.has(d.actor)
              ? FACTIONS[d.actor as FactionId]
              : null;
            const faces = d.dice.join(" + ");
            const mod =
              d.modifierTotal !== 0
                ? ` ${d.modifierTotal > 0 ? "+" : ""}${d.modifierTotal}`
                : "";
            return (
              <li key={d.id} className="font-mono text-xs leading-snug flex gap-2">
                <span className="text-zinc-600 shrink-0">
                  T{d.turn}P{d.phase}
                </span>
                {actorMeta ? (
                  <span className="shrink-0 uppercase" style={{ color: actorMeta.accentColor }}>
                    {actorMeta.shortName}
                  </span>
                ) : (
                  d.actor !== "system" && (
                    <span className="shrink-0 text-zinc-500 uppercase">{d.actor}</span>
                  )
                )}
                <span className="text-zinc-400 shrink-0">{d.rollType}</span>
                <span className="text-zinc-300">
                  🎲 {faces}
                  {mod} = <span className="text-zinc-100 font-semibold">{d.result}</span>
                  {d.modifierSummary && (
                    <span className="text-zinc-600"> ({d.modifierSummary})</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
