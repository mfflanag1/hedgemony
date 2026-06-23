/**
 * End-to-end smoke test: 2 clients, 1 turn.
 *
 * Starts a Colyseus server in-process, connects 2 clients (Alice as OpenBrain,
 * Bob as DeepCent), drives them through lobby → phase 1 → frontier push at
 * phase 2 → remaining phases → phase 8 (end of turn).
 *
 * Runs without the frontend. Success = state after one turn matches
 * expectations.
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { HedgemonyRoom } from "../rooms/HedgemonyRoom";
import type { HedgemonyState } from "../schema/state";

type TypedRoom = Room<HedgemonyState>;

const PORT = 2999;

async function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  console.log("[smoke] starting server…");
  const http = createServer();
  const server = new Server({
    transport: new WebSocketTransport({ server: http }),
  });
  server.define("hedgemony", HedgemonyRoom);
  await server.listen(PORT);

  let fails = 0;
  const assert = (cond: unknown, msg: string) => {
    if (!cond) {
      console.error(`  ✗ ${msg}`);
      fails++;
    } else {
      console.log(`  ✓ ${msg}`);
    }
  };

  try {
    const client = new Client(`ws://localhost:${PORT}`);

    console.log("\n[smoke] Alice creates room");
    const alice: TypedRoom = await client.create<HedgemonyState>("hedgemony", { role: "player", displayName: "Alice" });
    const roomId = alice.roomId;
    assert(roomId, `room id returned: ${roomId}`);

    await wait(100);
    console.log("\n[smoke] Bob joins by id");
    const bob: TypedRoom = await client.joinById<HedgemonyState>(roomId, { role: "player", displayName: "Bob" });
    await wait(100);

    assert(alice.state.participants.size === 2, `2 participants in state, got ${alice.state.participants.size}`);

    console.log("\n[smoke] claim factions");
    alice.send("claim-faction", { factionId: "OpenBrain" });
    bob.send("claim-faction", { factionId: "DeepCent" });
    await wait(100);

    const aliceP = alice.state.participants.get(alice.sessionId);
    const bobP = alice.state.participants.get(bob.sessionId);
    assert(aliceP?.factionId === "OpenBrain", `Alice claimed OpenBrain (got ${aliceP?.factionId})`);
    assert(bobP?.factionId === "DeepCent", `Bob claimed DeepCent (got ${bobP?.factionId})`);

    console.log("\n[smoke] start game");
    alice.send("start-game");
    await wait(150);

    assert(alice.state.status === "active", `status=active (got ${alice.state.status})`);
    // Hands are private (per-faction @filterChildren): each player sees only
    // their own, so read each from its owner's client.
    const aliceF = alice.state.factions.get("OpenBrain");
    const bobF = bob.state.factions.get("DeepCent");
    assert((aliceF?.handCardIds.length ?? 0) >= 3, `Alice has hand (${aliceF?.handCardIds.length} cards)`);
    assert((bobF?.handCardIds.length ?? 0) >= 3, `Bob has hand (${bobF?.handCardIds.length} cards)`);

    console.log("\n[smoke] Phase 1 — both confirm");
    alice.send("confirm-phase");
    bob.send("confirm-phase");
    await wait(150);

    assert(alice.state.phase === 2, `advanced to Phase 2 (got ${alice.state.phase})`);

    console.log("\n[smoke] Phase 2 — Alice Frontier Push to CL 2");
    alice.send("frontier-push", {
      spendK: 8,
      spendC: 10,
      spendT: 8,
      spendA: 2,
      targetCL: 2,
    });
    await wait(100);

    const aliceFAfterCommit = alice.state.factions.get("OpenBrain");
    assert(aliceFAfterCommit?.frontierPushCommit.committed === true, `Alice committed Frontier Push`);

    // Bob confirms without pushing (skips)
    bob.send("confirm-phase");
    alice.send("confirm-phase");
    await wait(200);

    assert(alice.state.phase === 3, `advanced past Frontier Push to Phase 3 (got ${alice.state.phase})`);
    const obLab = alice.state.factions.get("OpenBrain");
    assert(obLab?.capabilityLevel === 2, `OpenBrain CL advanced to 2 (got ${obLab?.capabilityLevel})`);
    assert(alice.state.tracks.CL === 2, `global CL track at 2 (got ${alice.state.tracks.CL})`);
    assert(alice.state.tracks.M > 0, `M rose due to alignment spend <3 per CL (got ${alice.state.tracks.M})`);

    console.log("\n[smoke] Phases 3-8 — confirm through to end of turn");
    for (let i = 0; i < 6; i++) {
      alice.send("confirm-phase");
      bob.send("confirm-phase");
      await wait(150);
    }

    assert(alice.state.turn === 2, `advanced to turn 2 (got ${alice.state.turn})`);
    assert(alice.state.phase === 1, `new turn starts at phase 1 (got ${alice.state.phase})`);

    const obStart = 35; // starting K
    const obAfter = alice.state.factions.get("OpenBrain")?.resources.K ?? 0;
    assert(obAfter > 0, `OpenBrain still has K (got ${obAfter})`);

    const aliceLog = alice.state.log.length;
    console.log(`\n[smoke] log entries: ${aliceLog}`);

    await alice.leave();
    await bob.leave();
  } catch (e) {
    console.error("\n[smoke] error:", e);
    fails += 1;
  }

  await server.gracefullyShutdown(false);

  if (fails > 0) {
    console.error(`\n${fails} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log("\n✓ end-to-end smoke test passed\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
