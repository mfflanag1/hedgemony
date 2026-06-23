/**
 * 5-phase turn machine + scenario bootstrap + endgame scoring for classic mode.
 *
 * Phases: 1 Red Signaling · 2 Blue Inv/Actions · 3 Red Inv/Actions ·
 * 4 Annual Resources · 5 State-of-the-World Summary. Up to 16 turns.
 */
import {
  CLASSIC_DEFAULT_SCENARIO,
  CLASSIC_FACTION_ORDER,
  CLASSIC_FACTIONS,
  CLASSIC_AOR_IDS,
  CLASSIC_TOTAL_TURNS,
  type ClassicFactionId,
} from "@hedgemony/shared";
import { ClassicState, ClassicFactionSchema, ClassicAorSchema, ClassicForceSchema } from "./state";

/** Seed factions + AOR force laydown from the default scenario. */
export function bootstrapClassicScenario(state: ClassicState): void {
  const s = CLASSIC_DEFAULT_SCENARIO;
  for (const id of CLASSIC_FACTION_ORDER) {
    const start = s.starting[id];
    const f = new ClassicFactionSchema();
    f.id = id;
    f.side = CLASSIC_FACTIONS[id].side;
    f.rp = start.rp;
    f.ip = start.ip;
    f.perTurnRp = start.perTurnRp;
    f.techLevel = start.techLevel;
    f.readiness = start.readiness ?? 0;
    for (const [cap, lvl] of Object.entries(start.modLevels)) {
      f.modLevels.set(cap, lvl as number);
    }
    state.factions.set(id, f);
  }
  for (const aorId of CLASSIC_AOR_IDS) {
    const aor = new ClassicAorSchema();
    aor.id = aorId;
    state.aors.set(aorId, aor);
  }
  for (const entry of s.laydown) {
    const aor = state.aors.get(entry.aor);
    if (!aor) continue;
    const fc = new ClassicForceSchema();
    fc.factionId = entry.factionId;
    fc.count = entry.count;
    fc.modLevel = entry.modLevel;
    aor.forces.push(fc);
  }
}

export function requiredConfirmers(state: ClassicState): ClassicFactionId[] {
  const ids: ClassicFactionId[] = [];
  state.participants.forEach((p) => {
    if (p.role === "player" && p.factionId) ids.push(p.factionId as ClassicFactionId);
  });
  return ids;
}

export function allReady(state: ClassicState): boolean {
  const required = requiredConfirmers(state);
  if (required.length === 0) return false;
  for (const id of required) {
    const f = state.factions.get(id);
    if (!f || !f.ready) return false;
  }
  return true;
}

export interface ClassicAdvanceResult {
  turn: number;
  phase: number;
  gameEnded: boolean;
  events: string[];
}

/** Advance one phase; apply income on entering Phase 4; score at end of Turn 16. */
export function advanceClassicPhase(state: ClassicState): ClassicAdvanceResult {
  const events: string[] = [];

  state.factions.forEach((f) => { f.ready = false; });

  let gameEnded = false;
  if (state.phase < 5) {
    state.phase += 1;
  } else if (state.turn < CLASSIC_TOTAL_TURNS) {
    state.turn += 1;
    state.phase = 1;
    // Red signals are turn-scoped; clear at turn rollover.
    state.factions.forEach((f) => { f.signaledCards.length = 0; });
  } else {
    state.status = "ended";
    state.gameEnded = true;
    gameEnded = true;
  }

  if (!gameEnded && state.phase === 4) {
    // Annual Resources Allocation.
    state.factions.forEach((f) => { f.rp += f.perTurnRp; });
    events.push("Annual Resources allocated (per-turn RP added to all factions).");
  }

  if (gameEnded) {
    const winners = resolveClassicEndgame(state);
    events.push(
      winners.length > 0
        ? `Game ended after turn ${state.turn}. Winner(s): ${winners.join(", ")}.`
        : `Game ended after turn ${state.turn}. No faction met its victory conditions.`
    );
  }

  return { turn: state.turn, phase: state.phase, gameEnded, events };
}

/**
 * Evaluate Table A.2 victory conditions. Some are relative/conditional, so resolve
 * the dependencies (DPRK win/lose, RU win) first. The "US leaves Korean Peninsula"
 * DPRK clause is a White-Cell judgment and isn't auto-evaluated.
 */
export function resolveClassicEndgame(state: ClassicState): ClassicFactionId[] {
  const ip = (id: ClassicFactionId) => state.factions.get(id)?.ip ?? 0;
  const usIp = ip("US");

  const dprkWins = ip("DPRK") > 15;
  const dprkLoses = ip("DPRK") === 0;
  const ruWins = ip("RU") >= usIp - 5;
  const irWins = ip("IR") > 20;
  const prcWins = ip("PRC") >= usIp - 3 && !dprkWins && !dprkLoses;
  const othersMax = Math.max(ip("NATO_EU"), ip("RU"), ip("PRC"), ip("DPRK"), ip("IR"));
  const usWins = usIp > othersMax && !dprkWins;
  const natoWins = ip("NATO_EU") > ip("RU") && !ruWins;

  const winners: ClassicFactionId[] = [];
  if (usWins) winners.push("US");
  if (natoWins) winners.push("NATO_EU");
  if (ruWins) winners.push("RU");
  if (prcWins) winners.push("PRC");
  if (dprkWins) winners.push("DPRK");
  if (irWins) winners.push("IR");

  state.winners.length = 0;
  for (const w of winners) state.winners.push(w);
  return winners;
}
