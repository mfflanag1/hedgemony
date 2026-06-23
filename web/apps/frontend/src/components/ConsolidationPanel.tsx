"use client";

import {
  CONSOLIDATION_START_TURN,
  CONSOLIDATION_TURNS,
  CONSOLIDATION_COST,
  FACTIONS,
} from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { StateSnapshot, FactionSnapshot } from "@/lib/useGameRoom";

/**
 * CL-8 Capability Consolidation control + status. Shown to a CL-7 lab once it
 * can initiate, and as a progress readout to everyone while one is in progress.
 */
export function ConsolidationPanel({
  state,
  myFactionId,
  myFaction,
  send,
}: {
  state: StateSnapshot;
  myFactionId: FactionId;
  myFaction: FactionSnapshot;
  send: (type: string, payload?: unknown) => void;
}) {
  const c = state.consolidation;
  const active = c.faction !== "";
  const isMine = active && c.faction === myFactionId;
  const isLab =
    myFactionId === "OpenBrain" ||
    myFactionId === "DeepCent" ||
    (state.successorActive && myFactionId === "Successor");
  const canInitiate =
    !active &&
    isLab &&
    myFaction.capabilityLevel === 7 &&
    state.turn >= CONSOLIDATION_START_TURN;
  const canAdvance = isMine && !c.suspended && state.turn > c.lastProgressTurn;
  const canAfford =
    myFaction.resources.C >= CONSOLIDATION_COST.C && myFaction.resources.K >= CONSOLIDATION_COST.K;

  if (!active && !canInitiate) return null;

  const accent = active ? FACTIONS[c.faction as FactionId]?.accentColor : undefined;

  return (
    <div className="border border-successor/50 bg-successor/5 rounded-sm px-3 py-2">
      <p className="font-mono text-xs uppercase tracking-wider text-successor mb-1">
        Capability Consolidation — CL 8 Singleton
      </p>

      {active ? (
        <>
          <p className="font-mono text-[11px] mb-1">
            <span style={{ color: accent }}>{c.faction}</span> consolidating ·{" "}
            <span className="text-zinc-200">
              {c.progressTurns}/{CONSOLIDATION_TURNS}
            </span>{" "}
            {c.suspended && <span className="text-deepcent">· SUSPENDED this turn</span>}
          </p>
          <div className="flex gap-1 mb-2">
            {Array.from({ length: CONSOLIDATION_TURNS }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-sm ${i < c.progressTurns ? "bg-successor" : "bg-bg-line"}`}
              />
            ))}
          </div>
          {isMine && (
            <button
              disabled={!canAdvance || !canAfford}
              onClick={() => send("advance-consolidation")}
              className="font-mono text-[11px] uppercase tracking-wider border border-successor text-successor px-3 py-1 rounded-sm hover:bg-successor hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {c.suspended
                ? "Suspended this turn"
                : state.turn <= c.lastProgressTurn
                  ? "Advanced this turn ✓"
                  : `Advance (−${CONSOLIDATION_COST.C} C −${CONSOLIDATION_COST.K} K)`}
            </button>
          )}
          {isMine && !canAfford && (
            <p className="font-mono text-[10px] text-deepcent mt-1">insufficient C / K to continue</p>
          )}
        </>
      ) : (
        <>
          <p className="font-mono text-[10px] text-zinc-500 mb-2">
            {CONSOLIDATION_TURNS} uninterrupted turns · {CONSOLIDATION_COST.C} C + {CONSOLIDATION_COST.K} K
            each · reaches CL 8 and wins outright.
          </p>
          <button
            onClick={() => send("initiate-consolidation")}
            className="font-mono text-[11px] uppercase tracking-wider border border-successor text-successor px-3 py-1 rounded-sm hover:bg-successor hover:text-bg-base transition-colors"
          >
            → Begin Consolidation
          </button>
        </>
      )}
    </div>
  );
}
