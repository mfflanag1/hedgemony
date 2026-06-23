/**
 * Default timeline per 05_QUICK_REFERENCE.md. White Cell uses this as the
 * expected trajectory; player actions can deviate.
 */
export interface DefaultTurn {
  turn: number;
  calendar: string;
  defaultCL: string; // may be range
  defaultX: number | string;
  defaultET: number | string;
  keyEvent: string;
}

export const DEFAULT_TIMELINE: DefaultTurn[] = [
  // Race Phase
  { turn: 1, calendar: "Q1 2026", defaultCL: "1", defaultX: 3, defaultET: 0, keyEvent: "I02 Stargate, I04 Trump AI Plan, I06 EU Phase 1" },
  { turn: 2, calendar: "Q2 2026", defaultCL: "2", defaultX: 3, defaultET: 0, keyEvent: "Agent-1 arrives" },
  { turn: 3, calendar: "Q3 2026", defaultCL: "2", defaultX: 4, defaultET: 0, keyEvent: "China consolidates (F07 plays for Politburo)" },
  { turn: 4, calendar: "Q4 2026", defaultCL: "2", defaultX: 4, defaultET: 1, keyEvent: "Mini-release wave; markets surge" },
  { turn: 5, calendar: "Q1 2027", defaultCL: "3", defaultX: 5, defaultET: 2, keyEvent: "I06 EU GPAI rules; Agent-2" },
  { turn: 6, calendar: "Q2 2027", defaultCL: "3", defaultX: 6, defaultET: 3, keyEvent: "Weight theft window opens" },
  { turn: 7, calendar: "Q3 2027", defaultCL: "4", defaultX: 6, defaultET: 4, keyEvent: "Agent-3; C02 Bioweapon Capability triggers" },
  { turn: 8, calendar: "Q4 2027", defaultCL: "5", defaultX: 7, defaultET: 5, keyEvent: "C03 RSI Confirmed; ET tracking begins; X07 kinetic threats" },
  { turn: 9, calendar: "Q1 2028", defaultCL: "5", defaultX: 7, defaultET: 5, keyEvent: "I06 EU full enforcement; Slowdown window opens" },
  { turn: 10, calendar: "Q2 2028", defaultCL: "6 if race", defaultX: 8, defaultET: 6, keyEvent: "Successor risk peaks; I16 Mass Unemployment Crisis" },
  { turn: 11, calendar: "Q3 2028", defaultCL: "6", defaultX: 8, defaultET: 6, keyEvent: "Endgame moves" },
  { turn: 12, calendar: "Q4 2028", defaultCL: "7 if race / 5 if slowdown", defaultX: "branch resolved", defaultET: 6, keyEvent: "Race phase ends" },
  // Consolidation Phase
  { turn: 13, calendar: "Q1 2029", defaultCL: "7 holds; CL 8 attempts begin", defaultX: "8 race / 4 slowdown", defaultET: 6, keyEvent: "I17 AI Rights Movement window" },
  { turn: 14, calendar: "Q2 2029", defaultCL: "Singleton attempt", defaultX: "9 race / 4 slow", defaultET: 7, keyEvent: "I18 Late-Game Pause Push; coordinated sabotage opportunities" },
  { turn: 15, calendar: "Q3 2029", defaultCL: "Final consolidation push", defaultX: "9 race / 5 slow", defaultET: 8, keyEvent: "I19 Geopolitical Realignment; treaty erosion or crystallization" },
  { turn: 16, calendar: "Q4 2029", defaultCL: "Apex resolved or fails", defaultX: "resolved", defaultET: 9, keyEvent: "Governance Regime crystallizes; final scoring" },
];

export const RACE_PHASE_LAST_TURN = 12;
export const CONSOLIDATION_PHASE_FIRST_TURN = 13;
export const TOTAL_TURNS = 16;

/** Map a 1-based turn number to its calendar quarter label. */
export function turnToQuarter(turn: number): string {
  const year = 2026 + Math.floor((turn - 1) / 4);
  const quarter = ((turn - 1) % 4) + 1;
  return `Q${quarter} ${year}`;
}
