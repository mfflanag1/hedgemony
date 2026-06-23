/**
 * Alignment Check (Phase 7).
 *
 * Per 05_QUICK_REFERENCE.md:
 *   Roll 1d10 vs M.
 *   Roll > M            → no incident
 *   Roll = M            → warning shot: P −1 globally, Coalition +1 A
 *   Roll = M−1 to M−3   → capability scandal: frontier lab P−1, A−1
 *   Roll ≤ M−4          → misalignment confirmed
 *
 * Successor auto-activation: if M ≥ 7 AND CL ≥ 5 AND check fails, Successor
 * activates immediately.
 */
import { SeededRng } from "./rng";
import type { FactionId } from "@hedgemony/shared";
import type { HedgemonyState } from "../schema/state";
import { pushDice } from "./dice";

export type AlignmentOutcome =
  | { kind: "skipped"; reason: string }
  | { kind: "no-incident"; roll: number }
  | { kind: "warning-shot"; roll: number }
  | { kind: "capability-scandal"; roll: number; frontierLab: FactionId }
  | { kind: "misalignment-confirmed"; roll: number; frontierLab: FactionId; autoActivateSuccessor: boolean };

export function runAlignmentCheck(state: HedgemonyState, rng: SeededRng): AlignmentOutcome {
  // Skip if frontier CL < 3
  if (state.tracks.CL < 3) {
    return { kind: "skipped", reason: "frontier CL < 3" };
  }

  const M = state.tracks.M;
  const roll = rng.roll(10);
  pushDice(state, {
    rollType: "alignment-check",
    dice: [roll],
    result: roll,
    modifierSummary: `vs M=${M}`,
  });

  // > M → no incident
  if (roll > M) {
    return { kind: "no-incident", roll };
  }

  const frontierLab = findFrontierLab(state);

  // ≤ M−4 → misalignment confirmed
  if (roll <= M - 4) {
    const autoActivate = M >= 7 && state.tracks.CL >= 5;
    // Frontier lab pays: either 5 A to suppress (−1 CL progress) OR Successor activates.
    // MVP: if autoActivate OR lab has <5 A, Successor activates.
    const lab = state.factions.get(frontierLab);
    if (autoActivate) {
      activateSuccessor(state, frontierLab);
      return { kind: "misalignment-confirmed", roll, frontierLab, autoActivateSuccessor: true };
    }
    if (lab && lab.resources.A >= 5) {
      lab.resources.A -= 5;
      // Roll back 1 CL of progress (simplified: cap CL one level lower for this turn)
      // MVP: we just log it; no capability rollback implemented
    } else {
      activateSuccessor(state, frontierLab);
      return { kind: "misalignment-confirmed", roll, frontierLab, autoActivateSuccessor: true };
    }
    return { kind: "misalignment-confirmed", roll, frontierLab, autoActivateSuccessor: false };
  }

  // = M → warning shot
  if (roll === M) {
    state.factions.forEach((f) => {
      f.resources.P = Math.max(0, f.resources.P - 1);
    });
    const coalition = state.factions.get("Coalition");
    if (coalition) coalition.resources.A = Math.min(10, coalition.resources.A + 1);
    return { kind: "warning-shot", roll };
  }

  // M−1 to M−3 → scandal
  const lab = state.factions.get(frontierLab);
  if (lab) {
    lab.resources.P = Math.max(0, lab.resources.P - 1);
    lab.resources.A = Math.max(0, lab.resources.A - 1);
  }
  return { kind: "capability-scandal", roll, frontierLab };
}

function findFrontierLab(state: HedgemonyState): FactionId {
  const ob = state.factions.get("OpenBrain");
  const dc = state.factions.get("DeepCent");
  const su = state.factions.get("Successor");
  // Leader is the lab with highest CL (ties → OpenBrain)
  let best: { id: FactionId; cl: number } = { id: "OpenBrain", cl: -1 };
  if (ob && ob.capabilityLevel > best.cl) best = { id: "OpenBrain", cl: ob.capabilityLevel };
  if (dc && dc.capabilityLevel > best.cl) best = { id: "DeepCent", cl: dc.capabilityLevel };
  if (state.successorActive && su && su.capabilityLevel > best.cl) best = { id: "Successor", cl: su.capabilityLevel };
  return best.id;
}

function activateSuccessor(state: HedgemonyState, spawnedFrom: FactionId) {
  state.successorActive = true;
  const successor = state.factions.get("Successor");
  const lab = state.factions.get(spawnedFrom);
  if (!successor || !lab) return;
  // Inherit a fraction of lab's resources per 01_FACTION_GUIDES.md
  successor.resources.K = Math.floor(lab.resources.K * 0.3);
  successor.resources.C = Math.floor(lab.resources.C * 0.5);
  successor.resources.T = Math.floor(lab.resources.T * 0.2) + 50;
  successor.resources.E = Math.floor(lab.resources.E * 0.5);
  successor.resources.A = 0;
  successor.resources.P = -3;
  successor.capabilityLevel = lab.capabilityLevel;
  // Lab loses the resources it handed off. Clamp to zero so low-resource labs
  // don't end up with negative K/C/E — downstream validators (Frontier Push,
  // play-card cost checks) treat negative values as "insufficient" but the
  // resource bag should never actually dip below 0.
  lab.resources.K = Math.max(0, lab.resources.K - successor.resources.K);
  lab.resources.C = Math.max(0, lab.resources.C - successor.resources.C);
  lab.resources.T = Math.max(0, lab.resources.T - 10);
  lab.resources.E = Math.max(0, lab.resources.E - successor.resources.E);
}
