/**
 * Capability Consolidation tests (Phase 5b) — direct unit tests of the
 * consolidation logic over constructed states.
 */
import { HedgemonyState, FactionStateSchema, Resources } from "../schema/state";
import {
  initiateConsolidation,
  advanceConsolidation,
  suspendConsolidation,
  coordinateAgainstConsolidation,
} from "../logic/consolidation";
import { SeededRng } from "../logic/rng";
import { CONSOLIDATION_START_TURN } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) { console.error(`  ✗ ${msg}`); fails++; } else { console.log(`  ✓ ${msg}`); }
}

function mkFaction(id: FactionId, cl: number, res: Partial<Record<keyof Resources, number>>): FactionStateSchema {
  const f = new FactionStateSchema();
  f.id = id;
  f.capabilityLevel = cl;
  const r = new Resources();
  Object.assign(r, res);
  f.resources = r;
  return f;
}

function baseState(obCL: number): HedgemonyState {
  const state = new HedgemonyState();
  state.factions.set("OpenBrain", mkFaction("OpenBrain", obCL, { C: 300, K: 300 }));
  state.factions.set("DeepCent", mkFaction("DeepCent", 5, { C: 300, K: 300 }));
  state.factions.set("Hegemon", mkFaction("Hegemon", 0, {}));
  state.factions.set("Politburo", mkFaction("Politburo", 0, {}));
  state.factions.set("Cartel", mkFaction("Cartel", 0, { K: 50 }));
  state.factions.set("Coalition", mkFaction("Coalition", 0, {}));
  state.factions.set("Successor", mkFaction("Successor", 0, {}));
  state.status = "active";
  state.turn = CONSOLIDATION_START_TURN;
  return state;
}

function main() {
  console.log("\n[C1] initiation gating");
  {
    const early = baseState(7);
    early.turn = CONSOLIDATION_START_TURN - 1;
    ok(!initiateConsolidation(early, "OpenBrain").ok, `rejected before Turn ${CONSOLIDATION_START_TURN}`);

    const notCL7 = baseState(6);
    ok(!initiateConsolidation(notCL7, "OpenBrain").ok, "rejected below CL 7");

    const notLab = baseState(7);
    ok(!initiateConsolidation(notLab, "Hegemon").ok, "rejected for non-lab");

    const good = baseState(7);
    ok(initiateConsolidation(good, "OpenBrain").ok, "accepted for CL-7 lab at Turn 13");
    ok(!initiateConsolidation(good, "DeepCent").ok, "second consolidation rejected while one active");
  }

  console.log("\n[C2] 3-turn progression completes to CL 8 Apex");
  {
    const state = baseState(7);
    ok(initiateConsolidation(state, "OpenBrain").ok, "initiated");

    const a1 = advanceConsolidation(state, "OpenBrain");
    ok(a1.ok && !a1.completed, `turn ${state.turn}: progress 1/3`);
    ok(state.consolidation.progressTurns === 1, `progressTurns = 1 (got ${state.consolidation.progressTurns})`);
    ok(state.factions.get("OpenBrain")!.resources.C === 270, `C spent (got ${state.factions.get("OpenBrain")!.resources.C})`);

    ok(!advanceConsolidation(state, "OpenBrain").ok, "second advance same turn rejected");

    state.turn = CONSOLIDATION_START_TURN + 1;
    const a2 = advanceConsolidation(state, "OpenBrain");
    ok(a2.ok && !a2.completed, "progress 2/3");

    state.turn = CONSOLIDATION_START_TURN + 2;
    const a3 = advanceConsolidation(state, "OpenBrain");
    ok(a3.ok && a3.completed === true, "progress 3/3 completes");
    ok(state.factions.get("OpenBrain")!.capabilityLevel === 8, "OpenBrain at CL 8");
    ok(state.status === "ended", `game ended (got ${state.status})`);
    ok(state.regime === "singleton", `regime singleton (got ${state.regime})`);
    ok(state.winners.length === 1 && state.winners[0] === "OpenBrain", `OpenBrain sole winner (got ${state.winners.join(",")})`);
  }

  console.log("\n[C3] suspension blocks progress that turn");
  {
    const state = baseState(7);
    initiateConsolidation(state, "OpenBrain");
    const s = suspendConsolidation(state, "Misalignment Incident");
    ok(s.ok && state.consolidation.suspended, "suspended");
    ok(!advanceConsolidation(state, "OpenBrain").ok, "advance rejected while suspended");
    // Clearing (turn rollover) lets it resume — simulate the clear.
    state.consolidation.suspended = false;
    ok(advanceConsolidation(state, "OpenBrain").ok, "advance allowed after suspension cleared");
  }

  console.log("\n[C4] X06 coordination roll is recorded");
  {
    const state = baseState(7);
    initiateConsolidation(state, "OpenBrain");
    const rng = new SeededRng("x06-test");
    const r = coordinateAgainstConsolidation(state, rng);
    ok(r.ok, "coordination roll resolved");
    ok(state.dice.length === 1, `dice roll recorded (got ${state.dice.length})`);
  }

  if (fails > 0) {
    console.error(`\n✗ consolidation test FAILED (${fails} assertions)`);
    process.exit(1);
  }
  console.log("\n✓ consolidation test passed");
}

main();
