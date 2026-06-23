"use client";

import { FACTIONS, RESOURCES } from "@hedgemony/shared";
import type { FactionId, ResourceKind } from "@hedgemony/shared";
import type { FactionSnapshot } from "@/lib/useGameRoom";

export function Dossier({ faction }: { faction: FactionSnapshot }) {
  const id = faction.id as FactionId;
  const meta = FACTIONS[id];
  const kinds: ResourceKind[] = ["K", "C", "T", "E", "A", "P"];

  return (
    <aside
      className="bg-bg-panel border border-bg-line rounded-sm"
      style={{ borderTopColor: meta.accentColor, borderTopWidth: 3 }}
    >
      <header className="px-4 pt-3 pb-2 border-b border-bg-line">
        <p
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: meta.accentColor }}
        >
          YOUR FACTION
        </p>
        <h2 className="font-serif text-xl mt-0.5">{meta.displayName}</h2>
        <p className="text-xs text-zinc-400 mt-0.5">{meta.oneLineGoal}</p>
      </header>

      <section className="px-4 py-3">
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
          {kinds.map((k) => {
            const v = faction.resources[k];
            const cap = RESOURCES[k].cap;
            return (
              <div key={k} className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-zinc-400">
                  <span className="text-zinc-200 mr-1.5">{k}</span>
                  {RESOURCES[k].name}
                </span>
                <span className="font-mono text-sm text-zinc-100">
                  {v}
                  {cap !== null && <span className="text-zinc-600">/{cap}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {meta.category === "lab" && (
        <section className="px-4 py-2 border-t border-bg-line">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs text-zinc-400">Your CL</span>
            <span
              className="font-mono text-lg"
              style={{ color: meta.accentColor }}
            >
              {faction.capabilityLevel}
            </span>
          </div>
        </section>
      )}

      {faction.activeEffects.length > 0 && (
        <section className="px-4 py-2 border-t border-bg-line">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
            Active Effects
          </p>
          <ul className="space-y-1">
            {faction.activeEffects.map((e, i) => (
              <li key={i} className="font-mono text-xs text-zinc-300">
                · {e.description}
                {e.remainingTurns > 0 && (
                  <span className="text-zinc-600"> ({e.remainingTurns}t)</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {faction.ready && (
        <section className="px-4 py-2 border-t border-openbrain bg-openbrain/10">
          <p className="font-mono text-xs text-openbrain">
            ✓ phase confirmed — waiting on others
          </p>
        </section>
      )}
    </aside>
  );
}
