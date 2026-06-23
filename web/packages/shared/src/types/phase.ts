export const PHASE_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

export interface PhaseMeta {
  id: PhaseId;
  name: string;
  shortName: string;
  /** Factions expected to act during this phase */
  activeFactions: "all" | "red-signaling" | "labs" | "states" | "coalition-cartel" | "white-cell";
  description: string;
}

/**
 * Game phase — combination of turn + phase within turn.
 * Turn 1 Phase 1 is the start; Turn 16 Phase 8 is the end.
 */
export interface PhasePosition {
  turn: number; // 1..16
  phase: PhaseId; // 1..8
}
