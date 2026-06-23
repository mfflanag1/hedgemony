/**
 * Reproduces the "two tabs opening same room URL" flow.
 *
 * Client A creates a room, claims OpenBrain. Client B (simulating a second
 * tab in the same browser) does `joinById` to the same room, claims DeepCent.
 * Verifies that both participants exist simultaneously and their claims hold.
 *
 * This isolates engine behavior from any browser/React quirks.
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { HedgemonyRoom } from "../rooms/HedgemonyRoom";
import type { HedgemonyState } from "../schema/state";

type TypedRoom = Room<HedgemonyState>;

const PORT = 2998;

async function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  console.log("[lobby] starting server…");
  const http = createServer();
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
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

    // Simulate: tab 1 opens /games/new → creates room → redirects → joins
    console.log("\n[lobby] tab 1 creates room");
    const createSocket: TypedRoom = await client.create<HedgemonyState>("hedgemony", { role: "player", displayName: "Alice" });
    const roomId = createSocket.roomId;
    await wait(50);
    // Simulate navigation: creator-socket leaves (unmount)
    await createSocket.leave();
    await wait(50);

    // Tab 1 rejoins from /games/[id]
    console.log("[lobby] tab 1 joins by id");
    const tab1: TypedRoom = await client.joinById<HedgemonyState>(roomId, { role: "player", displayName: "Alice" });
    await wait(100);

    assert(tab1.state.status === "lobby", `tab1 sees status=lobby (got ${tab1.state.status})`);
    assert(tab1.state.participants.size === 1, `tab1 sees 1 participant (got ${tab1.state.participants.size})`);
    assert(tab1.state.ownerSessionId === tab1.sessionId, `tab1 is owner`);

    console.log("\n[lobby] tab 1 claims OpenBrain");
    tab1.send("claim-faction", { factionId: "OpenBrain" });
    await wait(100);

    const tab1P = tab1.state.participants.get(tab1.sessionId);
    assert(tab1P?.factionId === "OpenBrain", `tab1 participant has factionId=OpenBrain (got ${tab1P?.factionId})`);

    // Simulate: tab 2 opens same URL → joinById directly
    console.log("\n[lobby] tab 2 joins same room");
    const tab2: TypedRoom = await client.joinById<HedgemonyState>(roomId, { role: "player", displayName: "Bob" });
    await wait(100);

    assert(tab1.sessionId !== tab2.sessionId, `tab1/tab2 sessionIds differ`);
    assert(tab2.state.participants.size === 2, `tab2 sees 2 participants (got ${tab2.state.participants.size})`);
    const tab2Me = tab2.state.participants.get(tab2.sessionId);
    assert(tab2Me !== undefined, `tab2 can find its own participant`);
    assert(tab2Me?.factionId === "", `tab2 starts with no faction`);
    const tab2SeesTab1 = tab2.state.participants.get(tab1.sessionId);
    assert(tab2SeesTab1?.factionId === "OpenBrain", `tab2 sees tab1's OpenBrain claim (got ${tab2SeesTab1?.factionId})`);

    console.log("\n[lobby] tab 2 claims DeepCent");
    tab2.send("claim-faction", { factionId: "DeepCent" });
    await wait(100);

    const tab2MeAfter = tab2.state.participants.get(tab2.sessionId);
    assert(tab2MeAfter?.factionId === "DeepCent", `tab2 participant has factionId=DeepCent (got ${tab2MeAfter?.factionId})`);

    // Tab 1 should also see tab 2's claim
    const tab1SeesTab2 = tab1.state.participants.get(tab2.sessionId);
    assert(tab1SeesTab2?.factionId === "DeepCent", `tab1 sees tab2's DeepCent claim (got ${tab1SeesTab2?.factionId})`);

    // Owner tab 1 starts the game
    console.log("\n[lobby] tab 1 (owner) starts game");
    tab1.send("start-game");
    await wait(200);

    assert(tab1.state.status === "active", `game started (status=${tab1.state.status})`);
    assert(tab2.state.status === "active", `tab2 also sees active`);

    await tab1.leave();
    await tab2.leave();
  } catch (e) {
    console.error("\n[lobby] error:", e);
    fails++;
  }

  await server.gracefullyShutdown(false);

  if (fails > 0) {
    console.error(`\n${fails} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log("\n✓ lobby multi-tab test passed\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
