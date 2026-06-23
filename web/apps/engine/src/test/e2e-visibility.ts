/**
 * Visibility-filtering tests (Phase 4 / @filterChildren).
 *
 * Verifies each client only sees its own private data: hands/decks are hidden
 * from rivals (visible to the owner + White Cell), and a hidden Frontier-Push
 * commit isn't visible to opponents.
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { HedgemonyRoom } from "../rooms/HedgemonyRoom";
import type { HedgemonyState } from "../schema/state";

type TypedRoom = Room<HedgemonyState>;
const PORT = 2994;
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) { console.error(`  ✗ ${msg}`); fails++; } else { console.log(`  ✓ ${msg}`); }
}

function handLen(room: TypedRoom, id: string): number {
  const f = room.state.factions.get(id);
  return f ? f.handCardIds.length : -1;
}

async function main() {
  const http = createServer();
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
  server.define("hedgemony", HedgemonyRoom);
  await server.listen(PORT);

  try {
    const client = new Client(`ws://localhost:${PORT}`);
    const alice: TypedRoom = await client.create<HedgemonyState>("hedgemony", { role: "player", displayName: "Alice" });
    const roomId = alice.roomId;
    await wait(60);
    const bob: TypedRoom = await client.joinById<HedgemonyState>(roomId, { role: "player", displayName: "Bob" });
    await wait(60);
    const wc: TypedRoom = await client.joinById<HedgemonyState>(roomId, { role: "white-cell", displayName: "Facilitator" });
    await wait(60);

    alice.send("claim-faction", { factionId: "OpenBrain" });
    bob.send("claim-faction", { factionId: "DeepCent" });
    await wait(100);
    alice.send("start-game");
    await wait(250);

    console.log("\n[V1] hands are private to their owner");
    ok(handLen(alice, "OpenBrain") > 0, `Alice sees her own hand (got ${handLen(alice, "OpenBrain")})`);
    ok(handLen(alice, "DeepCent") === 0, `Alice cannot see DeepCent's hand (got ${handLen(alice, "DeepCent")})`);
    ok(handLen(bob, "DeepCent") > 0, `Bob sees his own hand (got ${handLen(bob, "DeepCent")})`);
    ok(handLen(bob, "OpenBrain") === 0, `Bob cannot see OpenBrain's hand (got ${handLen(bob, "OpenBrain")})`);

    console.log("\n[V2] White Cell sees all hands");
    ok(handLen(wc, "OpenBrain") > 0, `WC sees OpenBrain hand (got ${handLen(wc, "OpenBrain")})`);
    ok(handLen(wc, "DeepCent") > 0, `WC sees DeepCent hand (got ${handLen(wc, "DeepCent")})`);

    console.log("\n[V3] decks are private too");
    ok((bob.state.factions.get("OpenBrain")?.deckCardIds.length ?? -1) === 0, "Bob cannot see OpenBrain's deck");
    ok((alice.state.factions.get("OpenBrain")?.deckCardIds.length ?? 0) > 0, "Alice sees her own deck");

    console.log("\n[V4] hidden Frontier-Push commit not visible to rivals");
    // Advance to Phase 2 (both confirm Phase 1).
    alice.send("confirm-phase");
    bob.send("confirm-phase");
    await wait(150);
    ok(alice.state.phase === 2, `at Phase 2 (got ${alice.state.phase})`);
    alice.send("frontier-push", { spendK: 5, spendC: 5, spendT: 5, spendA: 0, targetCL: 1 });
    await wait(150);
    ok(alice.state.factions.get("OpenBrain")?.frontierPushCommit?.committed === true, "Alice sees her own commit");
    const bobView = bob.state.factions.get("OpenBrain")?.frontierPushCommit;
    ok(!bobView || bobView.committed === false, `Bob cannot see Alice's commit (got ${bobView?.committed})`);

    await alice.leave();
    await bob.leave();
    await wc.leave();
  } catch (e) {
    console.error("\n[visibility] error:", e);
    fails++;
  }

  await server.gracefullyShutdown(false);
  if (fails > 0) {
    console.error(`\n✗ visibility test FAILED (${fails} assertions)`);
    process.exit(1);
  }
  console.log("\n✓ visibility test passed");
}

main().catch((e) => { console.error(e); process.exit(1); });
