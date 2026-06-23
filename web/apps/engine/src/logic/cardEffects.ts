/**
 * Card-effect dispatcher (hybrid).
 *
 * Applies the structured `effect.spec` ops the spec package attaches to the
 * mechanically-simple cards (see packages/spec/src/effects/overrides.ts).
 * Cards with an empty spec — the majority — fall through untouched and remain
 * White-Cell-adjudicated; the caller still logs the raw effect text.
 *
 * `meta` ops are explicit "adjudicate this" markers and are intentionally not
 * auto-applied.
 */
import type { Card, CardEffectOp, FactionId, ResourceKind } from "@hedgemony/shared";
import type { HedgemonyState } from "../schema/state";
import { ActiveEffectSchema } from "../schema/state";
import type { SeededRng } from "./rng";
import { pushDice } from "./dice";

/** Public Trust may legitimately go negative (e.g. the Successor). Others floor at 0. */
const RESOURCE_FLOOR_EXEMPT: ReadonlySet<ResourceKind> = new Set<ResourceKind>(["P"]);
const TRACK_MAX: Record<"CL" | "M" | "X" | "ET", number> = { CL: 8, M: 10, X: 10, ET: 10 };

/**
 * Apply a card's structured effect. Returns human-readable summary fragments
 * for the action log (empty if the card has no structured spec).
 */
export function applyCardEffect(
  state: HedgemonyState,
  player: FactionId,
  card: Card,
  rng: SeededRng
): string[] {
  const lines: string[] = [];
  for (const op of card.effect.spec) {
    switch (op.op) {
      case "resource":
        lines.push(...applyResource(state, player, op));
        break;
      case "track":
        lines.push(applyTrack(state, op));
        break;
      case "persistent":
        lines.push(applyPersistent(state, player, card, op));
        break;
      case "roll":
        lines.push(applyRoll(state, player, op, rng));
        break;
      case "meta":
        // Adjudicated by White Cell; nothing to apply automatically.
        break;
    }
  }
  return lines;
}

function resolveTargets(
  state: HedgemonyState,
  player: FactionId,
  target: "self" | "all" | FactionId
): FactionId[] {
  if (target === "self") return [player];
  if (target === "all") return Array.from(state.factions.keys()) as FactionId[];
  return [target];
}

function applyResource(
  state: HedgemonyState,
  player: FactionId,
  op: Extract<CardEffectOp, { op: "resource" }>
): string[] {
  const lines: string[] = [];
  for (const t of resolveTargets(state, player, op.target)) {
    const f = state.factions.get(t);
    if (!f) continue;
    const bag = f.resources as unknown as Record<ResourceKind, number>;
    const parts: string[] = [];
    for (const [kind, d] of Object.entries(op.delta) as Array<[ResourceKind, number]>) {
      let next = bag[kind] + d;
      if (!RESOURCE_FLOOR_EXEMPT.has(kind)) next = Math.max(0, next);
      bag[kind] = next;
      parts.push(`${kind}${d >= 0 ? "+" : ""}${d}`);
    }
    if (parts.length) lines.push(`${t} ${parts.join(" ")}`);
  }
  return lines;
}

function applyTrack(
  state: HedgemonyState,
  op: Extract<CardEffectOp, { op: "track" }>
): string {
  const tracks = state.tracks as unknown as Record<"CL" | "M" | "X" | "ET", number>;
  const max = TRACK_MAX[op.track];
  tracks[op.track] = Math.max(0, Math.min(max, tracks[op.track] + op.delta));
  return `${op.track} ${op.delta >= 0 ? "+" : ""}${op.delta} → ${tracks[op.track]}`;
}

function applyPersistent(
  state: HedgemonyState,
  player: FactionId,
  card: Card,
  op: Extract<CardEffectOp, { op: "persistent" }>
): string {
  const f = state.factions.get(player);
  if (!f) return "";
  const e = new ActiveEffectSchema();
  e.source = `${card.type}:${card.id}`;
  e.description = op.description;
  e.remainingTurns = op.durationTurns ?? 0; // 0 = permanent
  f.activeEffects.push(e);
  return `persistent: ${op.description}`;
}

function applyRoll(
  state: HedgemonyState,
  player: FactionId,
  op: Extract<CardEffectOp, { op: "roll" }>,
  rng: SeededRng
): string {
  const sides = op.dice.endsWith("d10") ? 10 : 6;
  const count = op.dice.startsWith("2") ? 2 : 1;
  const dice = rng.rollN(count, sides);
  const result = dice.reduce((a, b) => a + b, 0);
  pushDice(state, {
    rollType: "card-roll",
    actor: player,
    dice,
    result,
    modifierSummary: op.against ?? "",
  });
  return `rolled ${op.dice} = ${result}`;
}
