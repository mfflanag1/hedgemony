/**
 * Records audited dice rolls into the shared state so clients can render them
 * (see the frontend DiceLog component). All rolls go through SeededRng for
 * reproducibility; this just captures the result for display/audit.
 */
import { DICE_CAP } from "@hedgemony/shared";
import type { ArraySchema } from "@colyseus/schema";
import { DiceRollSchema } from "../schema/state";

/** Minimal shape both Takeoff and Classic states satisfy. */
interface Diceable {
  turn: number;
  phase: number;
  dice: ArraySchema<DiceRollSchema>;
}

export interface DiceInput {
  rollType: string;
  actor?: string;
  dice: number[];
  modifierTotal?: number;
  modifierSummary?: string;
  result: number;
  visibility?: string;
}

let counter = 0;

export function pushDice(state: Diceable, input: DiceInput): DiceRollSchema {
  const d = new DiceRollSchema();
  d.id = `d${Date.now().toString(36)}-${counter++}`;
  d.turn = state.turn;
  d.phase = state.phase;
  d.rollType = input.rollType;
  d.actor = input.actor ?? "system";
  for (const v of input.dice) d.dice.push(v);
  d.modifierTotal = input.modifierTotal ?? 0;
  d.modifierSummary = input.modifierSummary ?? "";
  d.result = input.result;
  d.visibility = input.visibility ?? "all";
  state.dice.push(d);
  while (state.dice.length > DICE_CAP) state.dice.shift();
  return d;
}
