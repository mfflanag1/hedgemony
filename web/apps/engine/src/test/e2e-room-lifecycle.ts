/**
 * End-to-end room lifecycle smoke for both game surfaces.
 *
 * Covers the browser flows that have regressed during local development:
 * create → leave creator socket → join by id → claim factions → start game,
 * plus classic Red signaling and card-play logging.
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { HedgemonyRoom } from "../rooms/HedgemonyRoom";
import { HedgemonyClassicRoom } from "../rooms/HedgemonyClassicRoom";
import type { HedgemonyState } from "../schema/state";
import type { ClassicState } from "../classic/state";

const PORT = 2992;
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ ${msg}`); fails++; }
}

async function smokeTakeoff(client: Client) {
  console.log("\n[rooms] takeoff lifecycle");
  const created: Room<HedgemonyState> = await client.create("hedgemony", { role: "player", displayName: "Alice" });
  const roomId = created.roomId;
  await wait(50);
  await created.leave();
  await wait(50);

  const alice: Room<HedgemonyState> = await client.joinById(roomId, { role: "player", displayName: "Alice" });
  const bob: Room<HedgemonyState> = await client.joinById(roomId, { role: "player", displayName: "Bob" });
  await wait(100);
  alice.send("claim-faction", { factionId: "OpenBrain" });
  bob.send("claim-faction", { factionId: "DeepCent" });
  await wait(150);
  ok(alice.state.participants.get(alice.sessionId)?.factionId === "OpenBrain", "takeoff creator rejoins and claims OpenBrain");
  ok(bob.state.participants.get(bob.sessionId)?.factionId === "DeepCent", "takeoff second player claims DeepCent");
  alice.send("start-game");
  await wait(200);
  ok(alice.state.status === "active", `takeoff game starts (got ${alice.state.status})`);
  await alice.leave();
  await bob.leave();
}

async function smokeClassic(client: Client) {
  console.log("\n[rooms] classic lifecycle");
  const created: Room<ClassicState> = await client.create("hedgemony-classic", { role: "player", displayName: "US-player" });
  const roomId = created.roomId;
  await wait(50);
  await created.leave();
  await wait(50);

  const us: Room<ClassicState> = await client.joinById(roomId, { role: "player", displayName: "US-player" });
  const ru: Room<ClassicState> = await client.joinById(roomId, { role: "player", displayName: "RU-player" });
  const wc: Room<ClassicState> = await client.joinById(roomId, { role: "white-cell", displayName: "WC" });
  await wait(120);

  us.send("claim-faction", { factionId: "US" });
  ru.send("claim-faction", { factionId: "RU" });
  await wait(120);
  us.send("start-game");
  await wait(150);
  ok(us.state.status === "active", `classic game starts (got ${us.state.status})`);

  ru.send("signal-cards", { cardIds: ["RU-ACTION-01"] });
  await wait(120);
  ok(us.state.factions.get("RU")?.signaledCards.includes("RU-ACTION-01"), "classic red signal is visible");

  us.send("confirm-phase");
  ru.send("confirm-phase");
  await wait(150);
  ok(us.state.phase === 2, `classic advances to Blue phase (got ${us.state.phase})`);

  const usBefore = us.state.factions.get("US");
  const usIpBefore = usBefore?.ip ?? 0;
  const usRpBefore = usBefore?.rp ?? 0;
  us.send("play-card", {
    cardId: "US-FREE-PLAY",
    title: "Free-play intent",
    costRp: 1,
    effects: [{ op: "tracker", target: "self", field: "ip", delta: 1 }],
  });
  await wait(120);
  ok(us.state.factions.get("US")?.playedCards.includes("US-FREE-PLAY"), "classic blue play is logged");
  ok(us.state.factions.get("US")?.ip === usIpBefore + 1, "classic blue card auto-applies IP effect");
  ok(us.state.factions.get("US")?.rp === usRpBefore - 1, "classic blue card spends RP cost");

  us.send("confirm-phase");
  ru.send("confirm-phase");
  await wait(150);
  ok(us.state.phase === 3, `classic advances to Red phase (got ${us.state.phase})`);

  ru.send("play-card", { cardId: "RU-ACTION-01", title: "Signaled action" });
  await wait(120);
  ok(us.state.factions.get("RU")?.playedCards.includes("RU-ACTION-01"), "classic red signaled card play is logged");

  wc.send("wc-roll", { sides: 10, label: "Lifecycle smoke" });
  await wait(120);
  ok(us.state.dice.length > 0, "classic White Cell roll is recorded");

  await us.leave();
  await ru.leave();
  await wc.leave();
}

async function main() {
  const http = createServer();
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
  server.define("hedgemony", HedgemonyRoom);
  server.define("hedgemony-classic", HedgemonyClassicRoom);
  await server.listen(PORT);

  try {
    const client = new Client(`ws://localhost:${PORT}`);
    await smokeTakeoff(client);
    await smokeClassic(client);
  } catch (e) {
    console.error("\n[rooms] error:", e);
    fails++;
  }

  await server.gracefullyShutdown(false);
  if (fails > 0) {
    console.error(`\n✗ room lifecycle smoke FAILED (${fails} assertions)`);
    process.exit(1);
  }
  console.log("\n✓ room lifecycle smoke passed");
}

main().catch((e) => { console.error(e); process.exit(1); });
