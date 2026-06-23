/**
 * Frontier Push resolution (Phase 2 exit).
 *
 * Each lab commits C/T/K spend (hidden). At phase exit, all commits reveal
 * simultaneously; each is validated against CL_COSTS and resolved.
 *
 * Misalignment Risk modifier per 00_SCENARIO_OVERVIEW.md:
 *   no A spend         → M +2
 *   ≥1 A per CL gained → M +1
 *   ≥3 A per CL gained → M +0
 *   ≥5 A + Coalition   → M −1
 */
import { CL_COSTS, computeMRiseOnCLGain } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { HedgemonyState, FrontierPushCommit, FactionStateSchema } from "../schema/state";

/**
 * Persistent active-effects that boost a lab's *effective* Compute on its next
 * Frontier Push (the committed C counts for more toward the CL-cost). Consumed
 * when the push resolves. Keyed by the card's catalog key (effect.source).
 */
const PUSH_COMPUTE_MULTIPLIER: Record<string, number> = {
  "action:F03": 1.25, // Synthetic Data Pipeline
};

/** Product of all push-compute multipliers currently active on a lab. */
function computeMultiplierFor(f: FactionStateSchema): number {
  let mult = 1;
  f.activeEffects.forEach((e) => {
    const m = PUSH_COMPUTE_MULTIPLIER[e.source];
    if (m) mult *= m;
  });
  return mult;
}

/** Remove the (one-shot) push-compute effects a push has just consumed. */
function consumePushComputeEffects(f: FactionStateSchema): void {
  for (let i = f.activeEffects.length - 1; i >= 0; i--) {
    const e = f.activeEffects[i];
    if (e && PUSH_COMPUTE_MULTIPLIER[e.source]) f.activeEffects.splice(i, 1);
  }
}

export interface FrontierPushResult {
  faction: FactionId;
  accepted: boolean;
  reason?: string;
  oldCL: number;
  newCL: number;
  mDelta: number;
  spend: { K: number; C: number; T: number; A: number };
}

export function resolveFrontierPushes(state: HedgemonyState): FrontierPushResult[] {
  const results: FrontierPushResult[] = [];
  const labs: FactionId[] = ["OpenBrain", "DeepCent"];
  if (state.successorActive) labs.push("Successor");

  for (const id of labs) {
    const f = state.factions.get(id);
    if (!f || !f.frontierPushCommit.committed) continue;

    const commit = f.frontierPushCommit;
    const result = applyCommit(state, id, commit);
    results.push(result);

    // Clear commit for next phase regardless of outcome
    f.frontierPushCommit.committed = false;
    f.frontierPushCommit.spendK = 0;
    f.frontierPushCommit.spendC = 0;
    f.frontierPushCommit.spendT = 0;
    f.frontierPushCommit.spendA = 0;
    f.frontierPushCommit.targetCL = 0;
  }

  return results;
}

function applyCommit(
  state: HedgemonyState,
  id: FactionId,
  commit: FrontierPushCommit
): FrontierPushResult {
  const f = state.factions.get(id);
  if (!f) {
    return empty(id, "faction not found");
  }
  const oldCL = f.capabilityLevel;
  const targetCL = commit.targetCL;
  const spend = {
    K: commit.spendK,
    C: commit.spendC,
    T: commit.spendT,
    A: commit.spendA,
  };

  // Basic sanity: target must be strictly above current and ≤ 7 (CL 8 is M06 flow, not here)
  if (targetCL <= oldCL) {
    return { faction: id, accepted: false, reason: "targetCL not above current CL", oldCL, newCL: oldCL, mDelta: 0, spend };
  }
  if (targetCL > 7) {
    return { faction: id, accepted: false, reason: "targetCL > 7; use Capability Consolidation (M06)", oldCL, newCL: oldCL, mDelta: 0, spend };
  }

  // Check resources available
  if (f.resources.K < spend.K) return { faction: id, accepted: false, reason: "insufficient K", oldCL, newCL: oldCL, mDelta: 0, spend };
  if (f.resources.C < spend.C) return { faction: id, accepted: false, reason: "insufficient C", oldCL, newCL: oldCL, mDelta: 0, spend };
  if (f.resources.T < spend.T) return { faction: id, accepted: false, reason: "insufficient T", oldCL, newCL: oldCL, mDelta: 0, spend };
  if (f.resources.A < spend.A) return { faction: id, accepted: false, reason: "insufficient A", oldCL, newCL: oldCL, mDelta: 0, spend };

  // Aggregate required cost across steps oldCL+1 .. targetCL.
  // T semantics:
  //   number  → must spend that much T for this step
  //   "capped" → T cap (50) has been hit; step needs no additional T
  //   null    → step doesn't require T at all (CL 7+)
  // We always validate spend.T >= requiredT (summed only over number steps).
  let requiredC = 0;
  let requiredT = 0;
  let requiredK = 0;
  for (let cl = oldCL + 1; cl <= targetCL; cl++) {
    const cost = CL_COSTS[cl];
    if (!cost) {
      return { faction: id, accepted: false, reason: `no cost defined for CL ${cl}`, oldCL, newCL: oldCL, mDelta: 0, spend };
    }
    requiredC += cost.C;
    if (typeof cost.T === "number") requiredT += cost.T;
    // "capped" and null contribute 0 to requiredT
    requiredK += cost.K;
  }

  // Persistent effects (e.g. F03 Synthetic Data Pipeline) make committed C
  // count for more toward the cost. Multiplier applies to the requirement
  // check only — the actual deduction below is still the raw committed C.
  const computeMult = computeMultiplierFor(f);
  const effectiveC = Math.floor(spend.C * computeMult);
  if (effectiveC < requiredC) {
    return { faction: id, accepted: false, reason: `C shortfall: need ${requiredC}, committed ${spend.C}${computeMult !== 1 ? ` (effective ${effectiveC})` : ""}`, oldCL, newCL: oldCL, mDelta: 0, spend };
  }
  if (spend.T < requiredT) {
    return { faction: id, accepted: false, reason: `T shortfall: need ${requiredT}, committed ${spend.T}`, oldCL, newCL: oldCL, mDelta: 0, spend };
  }
  if (spend.K < requiredK) {
    return { faction: id, accepted: false, reason: `K shortfall: need ${requiredK}, committed ${spend.K}`, oldCL, newCL: oldCL, mDelta: 0, spend };
  }

  // Deduct resources (exact spend, not just required; players can overcommit)
  f.resources.K -= spend.K;
  f.resources.C -= spend.C;
  f.resources.T -= spend.T;
  f.resources.A -= spend.A;

  // The push succeeded — consume any one-shot compute boosters it used.
  if (computeMult !== 1) consumePushComputeEffects(f);

  // Update CL
  const clGained = targetCL - oldCL;
  f.capabilityLevel = targetCL;
  if (targetCL > state.tracks.CL) state.tracks.CL = targetCL;

  // Misalignment Risk rise
  const alignPerCL = clGained > 0 ? spend.A / clGained : 0;
  // Coalition partnership not tracked at Phase 1 level; default false
  const mDelta = computeMRiseOnCLGain(alignPerCL, false);
  state.tracks.M = Math.max(0, Math.min(10, state.tracks.M + mDelta));

  return { faction: id, accepted: true, oldCL, newCL: targetCL, mDelta, spend };
}

function empty(id: FactionId, reason: string): FrontierPushResult {
  return { faction: id, accepted: false, reason, oldCL: 0, newCL: 0, mDelta: 0, spend: { K: 0, C: 0, T: 0, A: 0 } };
}
