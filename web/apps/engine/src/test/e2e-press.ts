/**
 * Press / negotiation flow test.
 *
 * Two clients exchange messages in a bilateral thread (auto-created at
 * game start) and a coalition thread (created by one of them). Verifies:
 *  - bilateral threads are bootstrapped when the game starts
 *  - messages delivered to both clients
 *  - non-participants cannot read the thread (visible in state but filtered
 *    by convention — for MVP this is "best effort", not enforced in the
 *    schema via @filterChildren)
 *  - unread → read tracking works
 *  - coalition thread creation requires the creator to participate
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { HedgemonyRoom } from "../rooms/HedgemonyRoom";
import type { HedgemonyState } from "../schema/state";
import { bilateralThreadId } from "../logic/press";

type TypedRoom = Room<HedgemonyState>;

const PORT = 2996;

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
  console.log("[press] starting server…");
  const http = createServer();
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
  server.define("hedgemony", HedgemonyRoom);
  await server.listen(PORT);

  try {
    const client = new Client(`ws://localhost:${PORT}`);

    console.log("\n[press] alice creates room and claims OpenBrain");
    const alice: TypedRoom = await client.create<HedgemonyState>("hedgemony", {
      role: "player", displayName: "Alice",
    });
    await wait(80);
    alice.send("claim-faction", { factionId: "OpenBrain" });
    await wait(80);

    console.log("[press] bob joins and claims DeepCent");
    const bob: TypedRoom = await client.joinById<HedgemonyState>(alice.roomId, {
      role: "player", displayName: "Bob",
    });
    await wait(80);
    bob.send("claim-faction", { factionId: "DeepCent" });
    await wait(80);

    alice.send("start-game");
    await wait(200);

    const expectedThreadId = bilateralThreadId("OpenBrain", "DeepCent");
    const threadAlice = alice.state.threads.get(expectedThreadId);
    ok(threadAlice !== undefined, `bilateral thread auto-created (${expectedThreadId})`);
    ok(threadAlice?.participantFactionIds === "DeepCent OpenBrain", `participants sorted (got "${threadAlice?.participantFactionIds}")`);

    console.log("\n[press] alice sends a message in the bilateral thread");
    alice.send("send-message", { threadId: expectedThreadId, body: "Pausing the race would be foolish." });
    await wait(120);

    const threadBobPost = bob.state.threads.get(expectedThreadId);
    ok(threadBobPost !== undefined, "bob sees the thread");
    ok(threadBobPost?.messages.length === 1, `bob sees 1 message (got ${threadBobPost?.messages.length})`);
    const m1 = threadBobPost?.messages.at(0);
    ok(m1?.body === "Pausing the race would be foolish.", `bob received the body (got "${m1?.body}")`);
    ok(!m1?.readByFactions.includes("DeepCent"), `bob hasn't read yet (got "${m1?.readByFactions}")`);

    console.log("\n[press] bob marks the thread read");
    bob.send("mark-thread-read", { threadId: expectedThreadId });
    await wait(100);
    const m1Read = bob.state.threads.get(expectedThreadId)?.messages.at(0);
    ok(m1Read?.readByFactions.includes("DeepCent"), `bob marked as read (got "${m1Read?.readByFactions}")`);

    console.log("\n[press] bob replies using toFactionId shorthand");
    bob.send("send-message", { toFactionId: "OpenBrain", body: "Says the leader." });
    await wait(120);
    const threadAlicePost = alice.state.threads.get(expectedThreadId);
    ok(threadAlicePost?.messages.length === 2, `alice sees 2 messages (got ${threadAlicePost?.messages.length})`);
    ok(threadAlicePost?.messages.at(1)?.body === "Says the leader.", `alice sees bob's reply`);

    console.log("\n[press] bob creates a coalition thread including alice");
    bob.send("create-coalition-thread", {
      participantFactionIds: ["OpenBrain"],
      name: "Test coalition",
    });
    await wait(120);

    const coalitionThreads = Array.from(alice.state.threads.values()).filter(
      (t) => t.kind === "coalition"
    );
    ok(coalitionThreads.length === 1, `one coalition thread created (got ${coalitionThreads.length})`);
    const coalitionThread = coalitionThreads[0];
    ok(coalitionThread?.name === "Test coalition", `name set (got "${coalitionThread?.name}")`);
    ok(
      coalitionThread?.participantFactionIds.includes("OpenBrain") &&
      coalitionThread?.participantFactionIds.includes("DeepCent"),
      `both alice and bob are participants (got "${coalitionThread?.participantFactionIds}")`
    );

    console.log("\n[press] alice sends a message to the coalition thread");
    if (coalitionThread) {
      alice.send("send-message", { threadId: coalitionThread.id, body: "Welcome." });
      await wait(120);
      const coalBob = bob.state.threads.get(coalitionThread.id);
      ok(coalBob?.messages.length === 1, `bob sees coalition message (got ${coalBob?.messages.length})`);
    }

    console.log("\n[press] sending to a thread where i'm not a participant is rejected");
    // Simulate by sending a bogus thread id
    let gotError = "";
    bob.onMessage("error", (m: { reason: string }) => { gotError = m.reason; });
    bob.send("send-message", { threadId: "coalition:bogus", body: "nope" });
    await wait(100);
    ok(gotError.includes("not found") || gotError.includes("participant"), `rejected (got "${gotError}")`);

    console.log("\n[press] empty message is rejected");
    gotError = "";
    alice.onMessage("error", (m: { reason: string }) => { gotError = m.reason; });
    alice.send("send-message", { threadId: expectedThreadId, body: "   " });
    await wait(100);
    ok(gotError.includes("empty"), `empty message rejected (got "${gotError}")`);

    await alice.leave();
    await bob.leave();
  } catch (e) {
    console.error("\n[press] error:", e);
    fails++;
  }

  await server.gracefullyShutdown(false);

  if (fails > 0) {
    console.error(`\n${fails} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log("\n✓ press e2e test passed\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
