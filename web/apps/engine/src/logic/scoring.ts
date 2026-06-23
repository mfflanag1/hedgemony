/**
 * Endgame scoring & Governance Regime determination (Phase 5c).
 *
 * Evaluates each faction's victory conditions and the overall Governance Regime
 * at game end, populating state.winners and state.regime.
 *
 * IMPORTANT — pragmatic mapping: several spec victory conditions reference
 * subsystems the engine doesn't track as flags (Slowdown-Branch trigger,
 * International Compute Treaty in force, weight-theft success, kinetic losses,
 * Cartel jurisdictions). Those are approximated from the modeled state (tracks,
 * per-lab CL, nationalization, resources). The precedence is exact; the
 * per-faction checks are best-effort proxies. White Cell can still override the
 * narrative. See 01_FACTION_GUIDES.md / 05_QUICK_REFERENCE.md for the canon.
 *
 * Precedence:
 *   1. Singleton — any lab at CL 8 (via Capability Consolidation) wins alone.
 *   2. Rogue Successor — an active, non-disclosed Successor at CL ≥ 7 wins alone.
 *   3. Otherwise evaluate per-faction conditions + a Governance Regime.
 */
import type { FactionId, GovernanceRegime } from "@hedgemony/shared";
import type { HedgemonyState } from "../schema/state";

export interface EndgameResult {
  regime: GovernanceRegime;
  winners: FactionId[];
}

function cl(state: HedgemonyState, id: FactionId): number {
  return state.factions.get(id)?.capabilityLevel ?? 0;
}
function nationalized(state: HedgemonyState, id: FactionId): boolean {
  return (state.factions.get(id)?.nationalizedBy ?? "") !== "";
}

export function resolveEndgame(state: HedgemonyState): EndgameResult {
  const obCL = cl(state, "OpenBrain");
  const dcCL = cl(state, "DeepCent");
  const suCL = cl(state, "Successor");
  const M = state.tracks.M;
  const X = state.tracks.X;
  const suDisclosed = (state.factions.get("Successor")?.nationalizedBy ?? "") === "self-disclosed";

  // 1. Singleton — a lab consolidated to CL 8.
  const singletonLab = ([
    ["OpenBrain", obCL],
    ["DeepCent", dcCL],
    ["Successor", state.successorActive ? suCL : 0],
  ] as Array<[FactionId, number]>).find(([, c]) => c >= 8);
  if (singletonLab) {
    return apply(state, "singleton", [singletonLab[0]]);
  }

  // 2. Rogue Successor takeover (activated, undisclosed, CL ≥ 7).
  if (state.successorActive && suCL >= 7 && !suDisclosed) {
    return apply(state, "singleton", ["Successor"]);
  }

  // 3. Per-faction victory conditions (inclusive of primary OR secondary).
  const leadLabCL = Math.max(obCL, dcCL);
  const winners: FactionId[] = [];
  const win = (id: FactionId) => winners.push(id);

  // OpenBrain: top lab with M ≤ 5 & un-nationalized, OR survival at CL ≥ 6.
  if ((obCL >= dcCL && M <= 5 && !nationalized(state, "OpenBrain")) || obCL >= 6) win("OpenBrain");
  // DeepCent: within 1 CL of the leader, OR CL ≥ 4.
  if (dcCL >= leadLabCL - 1 || dcCL >= 4) win("DeepCent");
  // Hegemon: US-side lab (OpenBrain) leading. M ≤ 5 & X ≤ 6 is the strong win.
  if (obCL >= dcCL) win("Hegemon");
  // Politburo: China-side lab (DeepCent) leading or at parity (X ≤ 6), OR DeepCent ≥ 4.
  if ((dcCL >= obCL && X <= 6) || dcCL >= 4) win("Politburo");
  // Cartel: survives un-nationalized (≥ 40 K is the strong win; proxy: not nationalized).
  if (!nationalized(state, "Cartel")) win("Cartel");
  // Coalition: safety win — M ≤ 3, OR M ≤ 5 with no runaway frontier (lead ≤ 6).
  if (M <= 3 || (M <= 5 && leadLabCL <= 6)) win("Coalition");
  // Successor (active but below takeover): secondary win at CL ≥ 6.
  if (state.successorActive && !suDisclosed && suCL >= 6) win("Successor");

  const regime = determineRegime({ obCL, dcCL, M, X, hasWinner: winners.length > 0 });
  // A failed-state outcome means no faction achieved its goals.
  return apply(state, regime, regime === "failed" ? [] : winners);
}

function determineRegime(p: {
  obCL: number;
  dcCL: number;
  M: number;
  X: number;
  hasWinner: boolean;
}): GovernanceRegime {
  // Catastrophe dominates: high misalignment + high tension with no singleton.
  if (p.M >= 8 && p.X >= 8) return "failed";
  // US hegemony: American lab leads at frontier with risk contained.
  if (p.obCL >= p.dcCL && p.obCL >= 7 && p.M <= 5) return "hegemonic";
  // Bipolar stability: both poles at high capability, tension contained.
  if (p.obCL >= 6 && p.dcCL >= 6 && p.X <= 6) return "bipolar";
  // Multipolar / treaty: low misalignment, capability held in check.
  if (p.M <= 4) return "multipolar";
  if (p.hasWinner) return p.obCL === p.dcCL ? "bipolar" : "hegemonic";
  return "failed";
}

function apply(state: HedgemonyState, regime: GovernanceRegime, winners: FactionId[]): EndgameResult {
  state.regime = regime;
  state.winners.length = 0;
  for (const w of winners) state.winners.push(w);
  return { regime, winners };
}
