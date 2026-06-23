import {
  CLASSIC_AOR_IDS,
  CLASSIC_CAPABILITIES,
  CLASSIC_FACTION_ORDER,
  type ClassicCardEffect,
  type ClassicEffectTarget,
  type ClassicFactionId,
} from "@hedgemony/shared";
import { ClassicForceSchema, type ClassicState } from "./state";
import { pushDice } from "../logic/dice";
import type { SeededRng } from "../logic/rng";

type TrackerField = "rp" | "ip" | "techLevel" | "readiness";

const TRACK_FIELDS = new Set(["rp", "ip", "techLevel", "readiness"]);

export function applyClassicCardEffects(
  state: ClassicState,
  actor: ClassicFactionId,
  effects: ClassicCardEffect[] | undefined,
  rng: SeededRng
): string[] {
  if (!Array.isArray(effects) || effects.length === 0) return [];
  const applied: string[] = [];
  for (const effect of effects.slice(0, 12)) {
    const line = applyOne(state, actor, effect, rng);
    if (line) applied.push(line);
  }
  return applied;
}

function applyOne(
  state: ClassicState,
  actor: ClassicFactionId,
  effect: ClassicCardEffect,
  rng: SeededRng
): string {
  switch (effect.op) {
    case "tracker":
      return adjustTracker(state, actor, effect.target, effect.field, effect.delta);
    case "set-tracker":
      return setTracker(state, actor, effect.target, effect.field, effect.value);
    case "mod-level":
      return adjustModLevel(state, actor, effect);
    case "force":
      return applyForce(state, actor, effect);
    case "roll":
      return roll(state, actor, effect, rng);
    case "note":
      return effect.text.trim().slice(0, 180);
  }
}

function resolveTarget(actor: ClassicFactionId, target: ClassicEffectTarget): ClassicFactionId | null {
  const id = target === "self" ? actor : target;
  return CLASSIC_FACTION_ORDER.includes(id) ? id : null;
}

function adjustTracker(
  state: ClassicState,
  actor: ClassicFactionId,
  target: ClassicEffectTarget,
  field: TrackerField,
  delta: number
): string {
  if (!TRACK_FIELDS.has(field)) return "";
  const targetId = resolveTarget(actor, target);
  if (!targetId) return "";
  const faction = state.factions.get(targetId);
  if (!faction) return "";
  const d = finiteInt(delta);
  faction[field] = Math.max(0, faction[field] + d);
  return `${targetId} ${field} ${d >= 0 ? "+" : ""}${d} -> ${faction[field]}`;
}

function setTracker(
  state: ClassicState,
  actor: ClassicFactionId,
  target: ClassicEffectTarget,
  field: TrackerField,
  value: number
): string {
  if (!TRACK_FIELDS.has(field)) return "";
  const targetId = resolveTarget(actor, target);
  if (!targetId) return "";
  const faction = state.factions.get(targetId);
  if (!faction) return "";
  faction[field] = Math.max(0, finiteInt(value));
  return `${targetId} ${field} -> ${faction[field]}`;
}

function adjustModLevel(
  state: ClassicState,
  actor: ClassicFactionId,
  effect: Extract<ClassicCardEffect, { op: "mod-level" }>
): string {
  const targetId = resolveTarget(actor, effect.target);
  if (!targetId || !CLASSIC_CAPABILITIES.includes(effect.capability)) return "";
  const faction = state.factions.get(targetId);
  if (!faction) return "";
  const current = faction.modLevels.get(effect.capability) ?? 0;
  const next = effect.value == null
    ? current + finiteInt(effect.delta ?? 0)
    : finiteInt(effect.value);
  faction.modLevels.set(effect.capability, Math.max(0, next));
  return `${targetId} ${effect.capability} Mod -> ${faction.modLevels.get(effect.capability)}`;
}

function applyForce(
  state: ClassicState,
  actor: ClassicFactionId,
  effect: Extract<ClassicCardEffect, { op: "force" }>
): string {
  if (!CLASSIC_AOR_IDS.includes(effect.aor)) return "";
  const aor = state.aors.get(effect.aor);
  if (!aor) return "";
  const factionId = resolveTarget(actor, effect.faction ?? "self");
  if (!factionId) return "";
  const count = Math.max(1, finiteInt(effect.count));
  const modLevel = Math.max(0, finiteInt(effect.modLevel));
  const stack = aor.forces.find((force) => force.factionId === factionId && force.modLevel === modLevel);
  if (effect.action === "place") {
    if (stack) stack.count += count;
    else {
      const force = new ClassicForceSchema();
      force.factionId = factionId;
      force.count = count;
      force.modLevel = modLevel;
      aor.forces.push(force);
    }
    return `${factionId} placed ${count}xM${modLevel} in ${effect.aor}`;
  }
  if (!stack) return "";
  stack.count -= count;
  if (stack.count <= 0) aor.forces.splice(aor.forces.indexOf(stack), 1);
  return `${factionId} removed ${count}xM${modLevel} from ${effect.aor}`;
}

function roll(
  state: ClassicState,
  actor: ClassicFactionId,
  effect: Extract<ClassicCardEffect, { op: "roll" }>,
  rng: SeededRng
): string {
  const sides = effect.sides === 6 ? 6 : 10;
  const result = rng.roll(sides);
  const modifier = finiteInt(effect.modifier ?? 0);
  state.rollCounter = rng.getCounter();
  pushDice(state, {
    rollType: effect.label?.trim().slice(0, 40) || `card d${sides}`,
    actor,
    dice: [result],
    modifierTotal: modifier,
    result: result + modifier,
  });
  return `rolled d${sides}${modifier ? ` ${modifier >= 0 ? "+" : ""}${modifier}` : ""} = ${result + modifier}`;
}

function finiteInt(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}
