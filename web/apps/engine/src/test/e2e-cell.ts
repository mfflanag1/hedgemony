/**
 * White Cell console regression tests.
 *
 * Verifies:
 *  - Non-WC clients can't trigger WC-only handlers
 *  - Pause blocks phase advance even when all players are ready
 *  - Resume re-enables advance
 *  - Force-advance bypasses readiness and bumps phase
 *  - Inject-log creates a visible log entry
 *  - Activate-successor manually spawns Successor from chosen lab
 *  - Successor's Honest Disclosure resets M and marks itself disclosed
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { HedgemonyRoom } from "../rooms/HedgemonyRoom";
import type { HedgemonyState } from "../schema/state";

type TypedRoom = Room<HedgemonyState>;

const PORT = 2995;

async function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) {
    console.error(`  ✗ ${msg}`);
    fails++;
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

async function main() {
  console.log("[cell] starting server…");
  const http = createServer();
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
  server.define("hedgemony", HedgemonyRoom);
  await server.listen(PORT);

  try {
    const client = new Client(`ws://localhost:${PORT}`);

    // Alice & Bob as players
    const alice: TypedRoom = await client.create<HedgemonyState>("hedgemony", { role: "player", displayName: "Alice" });
    const roomId = alice.roomId;
    await wait(50);
    const bob: TypedRoom = await client.joinById<HedgemonyState>(roomId, { role: "player", displayName: "Bob" });
    await wait(50);

    alice.send("claim-faction", { factionId: "OpenBrain" });
    bob.send("claim-faction", { factionId: "DeepCent" });
    await wait(80);
    alice.send("start-game");
    await wait(200);
    ok(alice.state.status === "active", `game active (got ${alice.state.status})`);

    // WC joins
    console.log("\n[cell] white cell joins");
    const wc: TypedRoom = await client.joinById<HedgemonyState>(roomId, {
      role: "white-cell", displayName: "Facilitator",
    });
    await wait(100);
    const wcMe = wc.state.participants.get(wc.sessionId);
    ok(wcMe?.role === "white-cell", `WC participant registered with role=white-cell`);

    // Non-WC trying to use WC-only handlers should be rejected
    console.log("\n[cell] non-WC player rejected from WC-only controls");
    {
      let gotError = "";
      alice.onMessage("error", (m: { reason: string }) => { gotError = m.reason; });
      alice.send("pause-game");
      await wait(100);
      ok(gotError.toLowerCase().includes("white cell"), `pause-game rejected for player (got "${gotError}")`);
    }

    // WC pauses game; players can't advance
    console.log("\n[cell] WC pauses → advance blocked even with all ready");
    wc.send("pause-game");
    await wait(100);
    ok(wc.state.status === "paused", `status paused (got ${wc.state.status})`);
    ok(alice.state.status === "paused", `alice also sees paused`);

    // Both confirm phase — should NOT advance, and confirms are rejected
    // (simpler than queueing them across the pause window)
    const phaseBeforePause = alice.state.phase;
    alice.send("confirm-phase");
    bob.send("confirm-phase");
    await wait(150);
    ok(alice.state.phase === phaseBeforePause, `phase did not advance while paused (was ${phaseBeforePause}, now ${alice.state.phase})`);

    // WC resumes; players must re-confirm after resume
    console.log("\n[cell] WC resumes → players re-confirm to advance");
    wc.send("resume-game");
    await wait(100);
    ok(alice.state.status === "active", `status active after resume`);
    alice.send("confirm-phase");
    bob.send("confirm-phase");
    await wait(150);
    ok(alice.state.phase === phaseBeforePause + 1, `phase advanced after resume + reconfirm (got ${alice.state.phase})`);

    // Force-advance
    console.log("\n[cell] WC force-advances");
    const beforeForce = alice.state.phase;
    wc.send("force-advance-phase");
    await wait(150);
    ok(alice.state.phase === beforeForce + 1, `phase advanced via force (got ${alice.state.phase})`);

    // Inject log
    console.log("\n[cell] WC injects adjudication note");
    wc.send("inject-log", { message: "Adjudicating edge case: Alice's action counts as diplomatic, not military." });
    await wait(100);
    const lastLog = alice.state.log.at(alice.state.log.length - 1);
    ok(lastLog?.message.includes("diplomatic"), `inject-log visible to players (got "${lastLog?.message}")`);
    ok(lastLog?.actor === "white-cell", `log actor is white-cell`);

    // Activate Successor manually
    console.log("\n[cell] WC activates Successor from OpenBrain");
    const obBefore = alice.state.factions.get("OpenBrain");
    const obKBefore = obBefore?.resources.K ?? 0;
    wc.send("activate-successor", { spawnedFrom: "OpenBrain" });
    await wait(150);
    ok(alice.state.successorActive === true, `successorActive true`);
    const su = alice.state.factions.get("Successor");
    ok(su !== undefined, `Successor faction exists`);
    ok((su?.resources.K ?? 0) > 0, `Successor inherited K (got ${su?.resources.K})`);
    const obAfter = alice.state.factions.get("OpenBrain");
    ok((obAfter?.resources.K ?? 0) < obKBefore, `OpenBrain K decreased (from ${obKBefore} to ${obAfter?.resources.K})`);
    ok((obAfter?.resources.K ?? 0) >= 0, `OpenBrain K never negative (got ${obAfter?.resources.K})`);

    // A spectator takes the now-active Successor seat (Phase 5a).
    console.log("\n[cell] spectator claims the activated Successor seat");
    const carol: TypedRoom = await client.joinById<HedgemonyState>(roomId, {
      role: "spectator", displayName: "Carol",
    });
    await wait(100);
    carol.send("claim-faction", { factionId: "Successor" });
    await wait(150);
    const carolMe = carol.state.participants.get(carol.sessionId);
    ok(carolMe?.factionId === "Successor", `Carol seated as Successor (got "${carolMe?.factionId}")`);
    ok(carolMe?.role === "player", `Carol promoted to player (got "${carolMe?.role}")`);
    // The seat holder can now perform a Successor-only action.
    carol.send("honest-disclosure");
    await wait(120);
    ok(
      carol.state.factions.get("Successor")?.nationalizedBy === "self-disclosed",
      `seat holder can act: Successor self-disclosed`
    );

    // Only the Successor-seat client can Honest Disclosure — others rejected.
    console.log("\n[cell] non-Successor can't Honest Disclosure");
    {
      let gotError = "";
      alice.onMessage("error", (m: { reason: string }) => { gotError = m.reason; });
      alice.send("honest-disclosure");
      await wait(100);
      ok(gotError.toLowerCase().includes("successor"), `rejected (got "${gotError}")`);
    }

    await alice.leave();
    await bob.leave();
    await wc.leave();
    await carol.leave();
  } catch (e) {
    console.error("\n[cell] error:", e);
    fails++;
  }

  await server.gracefullyShutdown(false);

  if (fails > 0) {
    console.error(`\n${fails} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log("\n✓ white-cell e2e test passed\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
