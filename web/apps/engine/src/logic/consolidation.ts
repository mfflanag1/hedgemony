/**
 * Capability Consolidation — the CL-8 "Singleton" path (Phase 5b).
 *
 * A lab at CL 7 may, from CONSOLIDATION_START_TURN onward, spend
 * CONSOLIDATION_COST for CONSOLIDATION_TURNS uninterrupted turns. On completion
 * the lab reaches CL 8 and wins by Apex Victory (scored via resolveEndgame).
 * Sabotage (all-faction coordination X06) or a Misalignment Incident suspends
 * progress for a turn.
 */
import {
  CONSOLIDATION_START_TURN,
  CONSOLIDATION_TURNS,
  CONSOLIDATION_COST,
} from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { HedgemonyState } from "../schema/state";
import type { SeededRng } from "./rng";
import { resolveEndgame } from "./scoring";
import { pushDice } from "./dice";

export type ConsolidationResult =
  | { ok: true; event: string; completed?: boolean }
  | { ok: false; reason: string };

function isLab(state: HedgemonyState, id: FactionId): boolean {
  if (id === "Successor") return state.successorActive;
  return id === "OpenBrain" || id === "DeepCent";
}

export function initiateConsolidation(state: HedgemonyState, faction: FactionId): ConsolidationResult {
  if (!isLab(state, faction)) return { ok: false, reason: "only a lab can consolidate" };
  const f = state.factions.get(faction);
  if (!f) return { ok: false, reason: "no faction state" };
  if (f.capabilityLevel !== 7) return { ok: false, reason: "must be at CL 7 to consolidate" };
  if (state.turn < CONSOLIDATION_START_TURN) {
    return { ok: false, reason: `Consolidation unlocks at Turn ${CONSOLIDATION_START_TURN}` };
  }
  if (state.consolidation.faction) return { ok: false, reason: "a consolidation is already in progress" };

  state.consolidation.faction = faction;
  state.consolidation.progressTurns = 0;
  state.consolidation.startedTurn = state.turn;
  state.consolidation.lastProgressTurn = 0;
  state.consolidation.suspended = false;
  return {
    ok: true,
    event: `${faction} announced Capability Consolidation toward CL 8 (Singleton). All factions are notified.`,
  };
}

export function advanceConsolidation(state: HedgemonyState, faction: FactionId): ConsolidationResult {
  const c = state.consolidation;
  if (c.faction !== faction) return { ok: false, reason: "you are not consolidating" };
  if (c.suspended) return { ok: false, reason: "consolidation is suspended this turn" };
  if (state.turn <= c.lastProgressTurn) return { ok: false, reason: "already advanced consolidation this turn" };
  const f = state.factions.get(faction);
  if (!f) return { ok: false, reason: "no faction state" };
  if (f.resources.C < CONSOLIDATION_COST.C || f.resources.K < CONSOLIDATION_COST.K) {
    return { ok: false, reason: `need ${CONSOLIDATION_COST.C} C + ${CONSOLIDATION_COST.K} K to continue` };
  }

  f.resources.C -= CONSOLIDATION_COST.C;
  f.resources.K -= CONSOLIDATION_COST.K;
  c.progressTurns += 1;
  c.lastProgressTurn = state.turn;

  if (c.progressTurns >= CONSOLIDATION_TURNS) {
    f.capabilityLevel = 8;
    state.tracks.CL = 8;
    state.status = "ended";
    resolveEndgame(state); // populates singleton regime + winner
    return {
      ok: true,
      completed: true,
      event: `${faction} COMPLETED Capability Consolidation — reaches CL 8 (Singleton). Apex Victory; all other factions lose.`,
    };
  }
  return {
    ok: true,
    event: `${faction} advanced Capability Consolidation (${c.progressTurns}/${CONSOLIDATION_TURNS}).`,
  };
}

/** Suspend the active consolidation for the current turn (sabotage / misalignment). */
export function suspendConsolidation(state: HedgemonyState, reason: string): ConsolidationResult {
  const c = state.consolidation;
  if (!c.faction) return { ok: false, reason: "no consolidation in progress" };
  if (c.suspended) return { ok: false, reason: "already suspended this turn" };
  c.suspended = true;
  return { ok: true, event: `Capability Consolidation by ${c.faction} suspended: ${reason}.` };
}

/**
 * All-Faction Coordination Against the Singleton (X06): roll 1d10 vs (the
 * consolidating lab's CL + 3). Success suspends progress for the turn.
 */
export function coordinateAgainstConsolidation(state: HedgemonyState, rng: SeededRng): ConsolidationResult {
  const c = state.consolidation;
  if (!c.faction) return { ok: false, reason: "no consolidation in progress" };
  const lab = state.factions.get(c.faction as FactionId);
  const target = (lab?.capabilityLevel ?? 7) + 3;
  const roll = rng.roll(10);
  pushDice(state, {
    rollType: "x06-coordination",
    dice: [roll],
    result: roll,
    modifierSummary: `vs CL+3=${target}`,
  });
  if (roll >= target) {
    c.suspended = true;
    return {
      ok: true,
      event: `All-faction coordination (X06) SUCCEEDS (rolled ${roll} vs ${target}) — consolidation suspended this turn.`,
    };
  }
  return { ok: true, event: `All-faction coordination (X06) fails (rolled ${roll} vs ${target}).` };
}
