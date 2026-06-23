/**
 * Snapshot round-trip test (Phase 4d): serializeState → deserializeState
 * preserves the game state. No DB required — exercises the deserializer that
 * live restoration relies on.
 */
import { HedgemonyState, FactionStateSchema, Resources, ActiveEffectSchema, ParticipantSchema } from "../schema/state";
import { serializeState, deserializeState } from "../logic/persistence";
import type { FactionId } from "@hedgemony/shared";

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) { console.error(`  ✗ ${msg}`); fails++; } else { console.log(`  ✓ ${msg}`); }
}

function buildState(): HedgemonyState {
  const s = new HedgemonyState();
  s.status = "active";
  s.turn = 7;
  s.phase = 4;
  s.seed = "deadbeef";
  s.rollCounter = 42;
  s.tracks.CL = 6; s.tracks.M = 5; s.tracks.X = 4; s.tracks.ET = 3;
  s.successorActive = true;
  s.consolidation.faction = "OpenBrain";
  s.consolidation.progressTurns = 2;
  s.consolidation.startedTurn = 5;
  s.consolidation.lastProgressTurn = 6;
  s.regime = "unresolved";
  s.winners.push("OpenBrain");

  const f = new FactionStateSchema();
  f.id = "OpenBrain";
  const r = new Resources();
  Object.assign(r, { K: 11, C: 22, T: 33, E: 4, A: 5, P: 6 });
  f.resources = r;
  f.capabilityLevel = 7;
  f.handCardIds.push("action:F03", "action:T06");
  f.deckCardIds.push("action:S01");
  f.discardCardIds.push("action:P02");
  f.signaledCardIds.push("action:S04");
  const ae = new ActiveEffectSchema();
  ae.source = "action:F03"; ae.description = "+25% C"; ae.remainingTurns = 0;
  f.activeEffects.push(ae);
  f.frontierPushCommit.committed = true;
  f.frontierPushCommit.spendC = 9;
  f.frontierPushCommit.targetCL = 8;
  f.nationalizedBy = "";
  s.factions.set("OpenBrain", f);

  const p = new ParticipantSchema();
  p.sessionId = "abc123"; p.displayName = "Alice"; p.factionId = "OpenBrain"; p.role = "player"; p.connected = true;
  s.participants.set("abc123", p);

  return s;
}

function main() {
  const original = buildState();
  const json = serializeState(original);
  const restored = deserializeState(json);

  console.log("\n[R1] scalars + tracks");
  ok(restored.status === "active", "status");
  ok(restored.turn === 7 && restored.phase === 4, "turn/phase");
  ok(restored.seed === "deadbeef" && restored.rollCounter === 42, "seed/rollCounter");
  ok(restored.tracks.CL === 6 && restored.tracks.M === 5 && restored.tracks.X === 4 && restored.tracks.ET === 3, "tracks");
  ok(restored.successorActive === true, "successorActive");

  console.log("\n[R2] consolidation + endgame fields");
  ok(restored.consolidation.faction === "OpenBrain" && restored.consolidation.progressTurns === 2, "consolidation");
  ok(restored.consolidation.lastProgressTurn === 6, "consolidation.lastProgressTurn");
  ok(restored.winners.length === 1 && restored.winners[0] === "OpenBrain", "winners");

  console.log("\n[R3] faction deep state");
  const f = restored.factions.get("OpenBrain" as FactionId)!;
  ok(f !== undefined, "faction restored");
  ok(f.resources.K === 11 && f.resources.C === 22 && f.resources.T === 33 && f.resources.P === 6, "resources");
  ok(f.capabilityLevel === 7, "capabilityLevel");
  ok(f.handCardIds.length === 2 && f.handCardIds[0] === "action:F03", "handCardIds");
  ok(f.deckCardIds.length === 1 && f.signaledCardIds.length === 1, "deck/signaled arrays");
  ok(f.activeEffects.length === 1 && f.activeEffects[0]!.source === "action:F03", "activeEffects");
  ok(f.frontierPushCommit.committed === true && f.frontierPushCommit.targetCL === 8, "frontierPushCommit");

  console.log("\n[R4] participants");
  const p = restored.participants.get("abc123")!;
  ok(p !== undefined && p.factionId === "OpenBrain" && p.role === "player", "participant restored");

  console.log("\n[R5] re-serialization is stable (idempotent round-trip)");
  ok(JSON.stringify(serializeState(restored)) === JSON.stringify(json), "second round-trip identical");

  if (fails > 0) {
    console.error(`\n✗ restore test FAILED (${fails} assertions)`);
    process.exit(1);
  }
  console.log("\n✓ restore test passed");
}

main();
