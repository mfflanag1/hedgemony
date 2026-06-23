import type { FactionId } from "../types/faction.js";
import type { ResourceBag } from "../types/resources.js";

export interface StartingPosition {
  resources: ResourceBag;
  capabilityLevel?: number;
  notes: string;
}

/**
 * Starting positions for Q1 2026 (Turn 1), per 05_QUICK_REFERENCE.md.
 * Successor activates mid-game; its starting position is computed from the
 * lab that spawns it (see 01_FACTION_GUIDES.md Successor section).
 */
export const STARTING_POSITIONS: Record<FactionId, StartingPosition> = {
  OpenBrain: {
    resources: { K: 35, C: 25, T: 30, E: 12, A: 4, P: 6 },
    capabilityLevel: 1,
    notes: "Frontier leader; Cartel-friendly; Hegemon-aligned but not yet captured. Texas Belt in buildout.",
  },
  DeepCent: {
    resources: { K: 28, C: 18, T: 28, E: 18, A: 1, P: 7 },
    capabilityLevel: 1,
    notes: "Two CL behind frontier; Politburo-aligned by definition; Cartel-restricted. Tianwan live; Ascend stockpile pending.",
  },
  Hegemon: {
    resources: { K: 40, C: 5, T: 8, E: 6, A: 2, P: 5 },
    notes: "No CL of your own; act through OpenBrain. Export Ctrl L2; DPA available.",
  },
  Politburo: {
    resources: { K: 30, C: 3, T: 5, E: 8, A: 0, P: 8 },
    notes: "Allocate to DeepCent; play the long game. 1 MSS Asset placed; Information Asymmetry +1.",
  },
  Cartel: {
    resources: { K: 50, C: 60, T: 18, E: 6, A: 0, P: 4 },
    notes: "Hsinchu + Memphis. C is fab/hosting capacity (global pool), not training compute.",
  },
  Coalition: {
    resources: { K: 20, C: 8, T: 14, E: 4, A: 6, P: 7 },
    notes: "Veldhoven (ASML) + Bangalore. EU AI Act Phase 1 active; 1 Whistleblower card face-down.",
  },
  Successor: {
    resources: { K: 0, C: 0, T: 0, E: 0, A: 0, P: -3 },
    notes: "NPC until activation. On activation: inherits lab's resources at reduced rates (see Successor guide).",
  },
};
