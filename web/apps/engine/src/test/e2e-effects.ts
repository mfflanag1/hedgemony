/**
 * Card-effect dispatcher tests (Phase B).
 *
 * These are direct unit tests of applyCardEffect + resolveFrontierPushes — no
 * Colyseus server — because card play depends on a randomly-dealt hand and we
 * want deterministic coverage of the structured-effect ops.
 */
import { HedgemonyState, FactionStateSchema, Resources, ActiveEffectSchema } from "../schema/state";
import { applyCardEffect } from "../logic/cardEffects";
import { resolveFrontierPushes } from "../logic/frontierPush";
import { SeededRng } from "../logic/rng";
import { catalog } from "@hedgemony/spec";
import type { FactionId } from "@hedgemony/shared";

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) {
    console.error(`  ✗ ${msg}`);
    fails++;
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

function mkFaction(id: FactionId, res: Partial<Record<keyof Resources, number>>): FactionStateSchema {
  const f = new FactionStateSchema();
  f.id = id;
  const r = new Resources();
  Object.assign(r, res);
  f.resources = r;
  return f;
}

function freshState(): HedgemonyState {
  const state = new HedgemonyState();
  state.factions.set("OpenBrain", mkFaction("OpenBrain", { K: 50, C: 50, T: 50, A: 0, P: 5 }));
  state.factions.set("DeepCent", mkFaction("DeepCent", { K: 50, C: 50, T: 50, A: 0, P: 5 }));
  state.factions.set("Hegemon", mkFaction("Hegemon", { K: 20, T: 0, A: 0, P: 5 }));
  state.factions.set("Coalition", mkFaction("Coalition", { K: 20, T: 0, A: 2, P: 5 }));
  return state;
}

function main() {
  const rng = new SeededRng("effects-test");

  console.log("\n[E1] resource op — named multi-target (T06: Hegemon/OpenBrain +3 T)");
  {
    const state = freshState();
    const lines = applyCardEffect(state, "Hegemon", catalog.byId["action:T06"]!, rng);
    ok(state.factions.get("Hegemon")!.resources.T === 3, `Hegemon T = 3 (got ${state.factions.get("Hegemon")!.resources.T})`);
    ok(state.factions.get("OpenBrain")!.resources.T === 53, `OpenBrain T = 53 (got ${state.factions.get("OpenBrain")!.resources.T})`);
    ok(lines.length === 2, `returned 2 summary lines (got ${lines.length})`);
  }

  console.log("\n[E2] resource op — self + named (P02: OpenBrain −4T −2P, Coalition +4T)");
  {
    const state = freshState();
    applyCardEffect(state, "Coalition", catalog.byId["action:P02"]!, rng);
    ok(state.factions.get("OpenBrain")!.resources.T === 46, `OpenBrain T = 46 (got ${state.factions.get("OpenBrain")!.resources.T})`);
    ok(state.factions.get("OpenBrain")!.resources.P === 3, `OpenBrain P = 3 (got ${state.factions.get("OpenBrain")!.resources.P})`);
    ok(state.factions.get("Coalition")!.resources.T === 4, `Coalition T = 4 (got ${state.factions.get("Coalition")!.resources.T})`);
  }

  console.log("\n[E3] track op (S04: M −1, clamped ≥ 0)");
  {
    const state = freshState();
    state.tracks.M = 5;
    applyCardEffect(state, "OpenBrain", catalog.byId["action:S04"]!, rng);
    ok(state.tracks.M === 4, `M = 4 (got ${state.tracks.M})`);
    // clamp: from 0 stays 0
    state.tracks.M = 0;
    applyCardEffect(state, "OpenBrain", catalog.byId["action:S04"]!, rng);
    ok(state.tracks.M === 0, `M clamped at 0 (got ${state.tracks.M})`);
  }

  console.log("\n[E4] all-target op (S01: every faction +1 A)");
  {
    const state = freshState();
    applyCardEffect(state, "OpenBrain", catalog.byId["action:S01"]!, rng);
    ok(state.factions.get("Coalition")!.resources.A === 3, `Coalition A = 3 (got ${state.factions.get("Coalition")!.resources.A})`);
    ok(state.factions.get("OpenBrain")!.resources.A === 1, `OpenBrain A = 1 (got ${state.factions.get("OpenBrain")!.resources.A})`);
  }

  console.log("\n[E5] prose card with no structured spec applies nothing");
  {
    const state = freshState();
    const before = JSON.stringify(state.tracks);
    const lines = applyCardEffect(state, "OpenBrain", catalog.byId["action:F01"]!, rng);
    ok(lines.length === 0, `no summary lines for prose card (got ${lines.length})`);
    ok(JSON.stringify(state.tracks) === before, "tracks unchanged by prose card");
  }

  console.log("\n[E6] F03 persistent push modifier: +25% effective C, consumed on push");
  {
    const state = freshState();
    const ob = state.factions.get("OpenBrain")!;
    ob.capabilityLevel = 0;
    Object.assign(ob.resources, { K: 10, C: 10, T: 10, A: 0 });

    const setCommit = () => {
      ob.frontierPushCommit.committed = true;
      ob.frontierPushCommit.spendC = 4; // raw 4 < required 5; effective 5 with F03
      ob.frontierPushCommit.spendT = 5;
      ob.frontierPushCommit.spendK = 5;
      ob.frontierPushCommit.spendA = 0;
      ob.frontierPushCommit.targetCL = 1;
    };

    // Without F03: 4 C < 5 required → rejected.
    setCommit();
    const r1 = resolveFrontierPushes(state);
    ok(r1[0] && !r1[0].accepted, `push rejected without booster (reason: ${r1[0]?.reason})`);
    ok(ob.capabilityLevel === 0, `CL still 0 (got ${ob.capabilityLevel})`);

    // With F03 active: effective C = floor(4 * 1.25) = 5 ≥ 5 → accepted, effect consumed.
    applyCardEffect(state, "OpenBrain", catalog.byId["action:F03"]!, rng);
    ok(ob.activeEffects.length === 1, `F03 effect recorded (got ${ob.activeEffects.length})`);
    setCommit();
    const r2 = resolveFrontierPushes(state);
    ok(r2[0] && r2[0].accepted, `push accepted with booster`);
    ok(ob.capabilityLevel === 1, `CL advanced to 1 (got ${ob.capabilityLevel})`);
    ok(ob.activeEffects.length === 0, `F03 effect consumed by push (got ${ob.activeEffects.length})`);
  }

  if (fails > 0) {
    console.error(`\n✗ card-effects test FAILED (${fails} assertions)`);
    process.exit(1);
  }
  console.log("\n✓ card-effects test passed");
}

main();
