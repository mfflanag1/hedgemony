/**
 * Capability Level advancement costs per 00_SCENARIO_OVERVIEW.md.
 * Keys are the target CL; values are the cost to reach it from CL-1.
 * CL 8 is special: 30C + 20K per turn for 3 turns (Capability Consolidation).
 */
export const CL_COSTS: Record<number, { C: number; T: number | "capped" | null; K: number }> = {
  1: { C: 5, T: 5, K: 5 },
  2: { C: 10, T: 8, K: 8 },
  3: { C: 20, T: 12, K: 12 },
  4: { C: 35, T: 15, K: 18 },
  5: { C: 60, T: 20, K: 25 },
  6: { C: 100, T: "capped", K: 40 }, // T cap reached at 50; only C+K spent
  7: { C: 150, T: null, K: 60 },
  8: { C: 30 * 3, T: null, K: 20 * 3 }, // Capability Consolidation; 3-turn build
};

/** Progress required to cross CL via RSI (from CL ≥ 5) */
export const RSI_PROGRESS_REQUIRED: Record<number, number> = {
  6: 5,
  7: 8,
  8: 12,
};

/**
 * Misalignment Risk modifiers per CL crossing, as a function of alignment
 * spend per CL gained.
 */
export function computeMRiseOnCLGain(alignmentSpendPerCL: number, withCoalitionPartner: boolean): number {
  if (alignmentSpendPerCL >= 5 && withCoalitionPartner) return -1;
  if (alignmentSpendPerCL >= 3) return 0;
  if (alignmentSpendPerCL >= 1) return 1;
  return 2;
}
