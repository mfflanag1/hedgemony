/**
 * Per-turn resource income. Applied at the start of Phase 6 (Resource Income).
 *
 * Per 05_QUICK_REFERENCE.md income table. MVP values; doesn't yet account for
 * dynamic modifiers (CL > 2 bonus, active Bangalore node, Smuggling result,
 * Cartel contracts, etc.). Those hook in over Phases 3-5 implementations.
 */
import type { FactionId } from "@hedgemony/shared";
import type { HedgemonyState, Resources } from "../schema/state";

interface Income {
  K: number;
  C: number;
  T: number;
  E: number;
  A: number;
  P: number;
}

const BASE_INCOME: Record<FactionId, Income> = {
  OpenBrain: { K: 6, C: 3, T: 2, E: 2, A: 0, P: 1 },
  DeepCent: { K: 7, C: 2, T: 3, E: 2, A: 0, P: 1 },
  Hegemon: { K: 8, C: 0, T: 0, E: 0, A: 1, P: 1 },
  Politburo: { K: 6, C: 0, T: 0, E: 0, A: 0, P: 1 },
  Cartel: { K: 8, C: 0, T: 0, E: 0, A: 0, P: 0 },
  Coalition: { K: 6, C: 1, T: 1, E: 0, A: 1, P: 1 },
  Successor: { K: 3, C: 1, T: 1, E: 0, A: 0, P: 0 },
};

export function applyTurnIncome(state: HedgemonyState): Array<{ faction: FactionId; delta: Partial<Income> }> {
  const applied: Array<{ faction: FactionId; delta: Partial<Income> }> = [];
  state.factions.forEach((f, key) => {
    const id = key as FactionId;
    // Skip Successor if not yet activated
    if (id === "Successor" && !state.successorActive) return;
    const income = BASE_INCOME[id];
    // Bonus: OpenBrain +1 K per CL above 2
    const effective: Income = { ...income };
    if (id === "OpenBrain" && f.capabilityLevel > 2) {
      effective.K += f.capabilityLevel - 2;
    }
    // Politburo also contributes to DeepCent (state allocation)
    if (id === "Politburo") {
      const dc = state.factions.get("DeepCent");
      if (dc) {
        dc.resources.C += 2;
        dc.resources.T += 2;
        dc.resources.E += 1;
      }
    }
    addResources(f.resources, effective);
    applied.push({ faction: id, delta: effective });
  });
  return applied;
}

function addResources(bag: Resources, delta: Partial<Income>) {
  if (delta.K) bag.K += delta.K;
  if (delta.C) bag.C += delta.C;
  if (delta.T) bag.T = Math.min(50, bag.T + delta.T);
  if (delta.E) bag.E += delta.E;
  if (delta.A) bag.A = Math.min(10, bag.A + delta.A);
  if (delta.P) bag.P = Math.min(10, bag.P + delta.P);
}
