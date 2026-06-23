/**
 * Endgame scoring tests (Phase 5c).
 *
 * Direct unit tests of resolveEndgame over constructed states, plus an
 * integration check that advancePhase scores the game when it ends at Turn 16.
 */
import { HedgemonyState, FactionStateSchema, Resources } from "../schema/state";
import { resolveEndgame } from "../logic/scoring";
import { advancePhase } from "../logic/phases";
import { SeededRng } from "../logic/rng";
import { TOTAL_TURNS } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) { console.error(`  ✗ ${msg}`); fails++; } else { console.log(`  ✓ ${msg}`); }
}

function mkFaction(id: FactionId, capabilityLevel: number, res: Partial<Record<keyof Resources, number>> = {}): FactionStateSchema {
  const f = new FactionStateSchema();
  f.id = id;
  f.capabilityLevel = capabilityLevel;
  const r = new Resources();
  Object.assign(r, res);
  f.resources = r;
  return f;
}

/** Build a full faction set with given lab CLs; non-labs default CL 0. */
function stateWith(opts: { obCL: number; dcCL: number; suCL?: number; successorActive?: boolean; M?: number; X?: number; cartelK?: number }): HedgemonyState {
  const state = new HedgemonyState();
  state.factions.set("OpenBrain", mkFaction("OpenBrain", opts.obCL));
  state.factions.set("DeepCent", mkFaction("DeepCent", opts.dcCL));
  state.factions.set("Hegemon", mkFaction("Hegemon", 0));
  state.factions.set("Politburo", mkFaction("Politburo", 0));
  state.factions.set("Cartel", mkFaction("Cartel", 0, { K: opts.cartelK ?? 50 }));
  state.factions.set("Coalition", mkFaction("Coalition", 0));
  state.factions.set("Successor", mkFaction("Successor", opts.suCL ?? 0));
  state.successorActive = opts.successorActive ?? false;
  state.tracks.M = opts.M ?? 3;
  state.tracks.X = opts.X ?? 4;
  return state;
}

function main() {
  console.log("\n[S1] Singleton — a lab at CL 8 wins alone");
  {
    const state = stateWith({ obCL: 8, dcCL: 6 });
    const r = resolveEndgame(state);
    ok(r.regime === "singleton", `regime singleton (got ${r.regime})`);
    ok(r.winners.length === 1 && r.winners[0] === "OpenBrain", `OpenBrain sole winner (got ${r.winners.join(",")})`);
    ok(state.regime === "singleton", "state.regime written");
    ok(state.winners.length === 1, "state.winners written");
  }

  console.log("\n[S2] Rogue Successor at CL 7 takes over");
  {
    const state = stateWith({ obCL: 6, dcCL: 5, suCL: 7, successorActive: true });
    const r = resolveEndgame(state);
    ok(r.regime === "singleton", `regime singleton (got ${r.regime})`);
    ok(r.winners.length === 1 && r.winners[0] === "Successor", `Successor sole winner (got ${r.winners.join(",")})`);
  }

  console.log("\n[S3] Hegemonic — US lab leads at CL 7, risk contained");
  {
    const state = stateWith({ obCL: 7, dcCL: 5, M: 4, X: 5 });
    const r = resolveEndgame(state);
    ok(r.regime === "hegemonic", `regime hegemonic (got ${r.regime})`);
    ok(r.winners.includes("OpenBrain"), "OpenBrain wins");
    ok(r.winners.includes("Hegemon"), "Hegemon wins");
    ok(!r.winners.includes("Successor"), "Successor not a winner");
  }

  console.log("\n[S4] Bipolar — both poles at CL 6, tension contained");
  {
    const state = stateWith({ obCL: 6, dcCL: 6, M: 6, X: 5 });
    const r = resolveEndgame(state);
    ok(r.regime === "bipolar", `regime bipolar (got ${r.regime})`);
    ok(r.winners.includes("Hegemon") && r.winners.includes("Politburo"), "both states win");
  }

  console.log("\n[S5] Failed state — catastrophic M & X, no winners");
  {
    const state = stateWith({ obCL: 5, dcCL: 5, M: 9, X: 9 });
    const r = resolveEndgame(state);
    ok(r.regime === "failed", `regime failed (got ${r.regime})`);
    ok(r.winners.length === 0, `no winners (got ${r.winners.length})`);
  }

  console.log("\n[S6] Integration — advancePhase scores the game at Turn 16 Phase 8");
  {
    const state = stateWith({ obCL: 7, dcCL: 5, M: 4, X: 5 });
    state.turn = TOTAL_TURNS;
    state.phase = 8;
    state.status = "active";
    // mark all (lab) factions ready is irrelevant here — advancePhase is called directly
    const rng = new SeededRng("scoring-int");
    const result = advancePhase(state, rng);
    ok(result.gameEnded, "advancePhase reports gameEnded");
    ok(state.status === "ended", `status ended (got ${state.status})`);
    ok(state.regime !== "unresolved", `regime resolved (got ${state.regime})`);
    ok(state.winners.length > 0, `winners populated (got ${state.winners.length})`);
  }

  if (fails > 0) {
    console.error(`\n✗ scoring test FAILED (${fails} assertions)`);
    process.exit(1);
  }
  console.log("\n✓ scoring test passed");
}

main();
