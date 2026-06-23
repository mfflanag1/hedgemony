"use client";

import { FACTIONS } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { StateSnapshot } from "@/lib/useGameRoom";

const CL_LABELS: Record<number, string> = {
  0: "Pre-Frontier",
  1: "Stumbling Agents",
  2: "Coding Assistant",
  3: "Autonomous Researcher",
  4: "Superhuman Coder",
  5: "Country of Geniuses (RSI)",
  6: "Superhuman Researcher",
  7: "Strategically Decisive",
  8: "Singleton",
};

export function CapabilityLadder({ state }: { state: StateSnapshot }) {
  const labs: FactionId[] = ["OpenBrain", "DeepCent"];
  if (state.successorActive) labs.push("Successor");

  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Capability Frontier
        </p>
        <span className="font-mono text-xs text-zinc-500">
          max CL: {state.tracks.CL}
        </span>
      </div>
      <div className="space-y-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cl) => {
          const labsHere = labs
            .map((id) => ({ id, f: state.factions[id] }))
            .filter(({ f }) => f && f.capabilityLevel === cl);
          // CL 8 is reachable only via Capability Consolidation. Dim it unless a
          // consolidation is in progress (then it's an active, attainable goal).
          const consolidating = state.consolidation.faction !== "";
          const isFuture = cl === 8 && !consolidating;
          return (
            <div
              key={cl}
              className={`flex items-center gap-3 py-1 px-2 border-l-2 ${
                cl === state.tracks.CL
                  ? "border-openbrain bg-openbrain/5"
                  : "border-bg-line"
              } ${isFuture ? "opacity-40" : ""}`}
              title={cl === 8 ? "CL 8 Singleton — reached via Capability Consolidation (3 turns at CL 7)" : undefined}
            >
              <span className="font-mono text-sm text-zinc-200 w-8">CL {cl}</span>
              <span className="font-sans text-xs text-zinc-400 flex-1">
                {CL_LABELS[cl]}
                {isFuture && <span className="text-zinc-600 ml-2">(Consolidation only)</span>}
              </span>
              <div className="flex gap-1">
                {labsHere.map(({ id }) => {
                  const meta = FACTIONS[id as FactionId];
                  return (
                    <span
                      key={id}
                      className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm border"
                      style={{
                        color: meta.accentColor,
                        borderColor: meta.accentColor + "55",
                        backgroundColor: meta.accentColor + "15",
                      }}
                    >
                      {meta.shortName}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
