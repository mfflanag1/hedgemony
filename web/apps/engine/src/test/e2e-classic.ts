/**
 * Original Hedgemony (classic) tests: scenario bootstrap, 5-phase machine +
 * annual income, endgame scoring (unit), plus a compact client smoke of the
 * room handlers (claim / start / signal / WC force placement / phase advance).
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { HedgemonyClassicRoom } from "../rooms/HedgemonyClassicRoom";
import { ClassicState } from "../classic/state";
import { bootstrapClassicScenario, advanceClassicPhase, resolveClassicEndgame } from "../classic/phases";
import { CLASSIC_TOTAL_TURNS } from "@hedgemony/shared";

type TypedRoom = Room<ClassicState>;
const PORT = 2993;
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

let fails = 0;
function ok(cond: unknown, msg: string) {
  if (!cond) { console.error(`  ✗ ${msg}`); fails++; } else { console.log(`  ✓ ${msg}`); }
}

function unitTests() {
  console.log("\n[CL1] scenario bootstrap");
  {
    const s = new ClassicState();
    bootstrapClassicScenario(s);
    ok(s.factions.size === 6, `6 factions seeded (got ${s.factions.size})`);
    ok(s.factions.get("US")!.ip === 50 && s.factions.get("US")!.rp === 40, "US starts IP 50 / RP 40");
    ok(s.factions.get("US")!.modLevels.get("C4ISR") === 3, "US C4ISR Mod 3");
    const northcom = s.aors.get("NORTHCOM")!;
    const usConus = northcom.forces.find((f) => f.factionId === "US" && f.modLevel === 3);
    ok(usConus?.count === 14, `NORTHCOM has US 14×Mod3 (got ${usConus?.count})`);
    // PRC total in INDOPACOM = 5+5+5 = 15
    const indo = s.aors.get("INDOPACOM")!;
    const prcTotal = indo.forces.filter((f) => f.factionId === "PRC").reduce((a, f) => a + f.count, 0);
    ok(prcTotal === 15, `PRC has 15 FF in INDOPACOM (got ${prcTotal})`);
  }

  console.log("\n[CL2] 5-phase machine + annual income on Phase 4");
  {
    const s = new ClassicState();
    bootstrapClassicScenario(s);
    s.status = "active";
    s.phase = 3;
    const usRpBefore = s.factions.get("US")!.rp; // 40
    advanceClassicPhase(s); // → Phase 4, income applies (+perTurnRp)
    ok(s.phase === 4, `advanced to Phase 4 (got ${s.phase})`);
    ok(s.factions.get("US")!.rp === usRpBefore + 30, `US RP +30 income (got ${s.factions.get("US")!.rp})`);
    ok(s.factions.get("PRC")!.rp === 15 + 4, `PRC RP +4 income (got ${s.factions.get("PRC")!.rp})`);
  }

  console.log("\n[CL3] turn rollover clears Red signals; end at turn 16");
  {
    const s = new ClassicState();
    bootstrapClassicScenario(s);
    s.status = "active";
    s.factions.get("RU")!.signaledCards.push("X-01");
    s.phase = 5;
    advanceClassicPhase(s); // → turn 2, phase 1
    ok(s.turn === 2 && s.phase === 1, `rolled to T2P1 (got T${s.turn}P${s.phase})`);
    ok(s.factions.get("RU")!.signaledCards.length === 0, "Red signals cleared at turn rollover");

    s.turn = CLASSIC_TOTAL_TURNS; s.phase = 5;
    const r = advanceClassicPhase(s);
    ok(r.gameEnded && s.status === "ended", "game ends after turn 16 phase 5");
  }

  console.log("\n[CL4] endgame scoring (Table A.2)");
  {
    const s = new ClassicState();
    bootstrapClassicScenario(s);
    // Clean US runaway: US 100, all others 10.
    for (const id of ["US", "NATO_EU", "RU", "PRC", "DPRK", "IR"] as const) {
      s.factions.get(id)!.ip = id === "US" ? 100 : 10;
    }
    let winners = resolveClassicEndgame(s);
    ok(winners.includes("US") && winners.length === 1, `US sole winner (got ${winners.join(",")})`);

    // DPRK > 15 wins and denies the US win.
    s.factions.get("DPRK")!.ip = 20;
    winners = resolveClassicEndgame(s);
    ok(winners.includes("DPRK"), "DPRK wins at IP 20");
    ok(!winners.includes("US"), "US denied because DPRK wins");
  }
}

async function clientSmoke() {
  const http = createServer();
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
  server.define("hedgemony-classic", HedgemonyClassicRoom);
  await server.listen(PORT);

  try {
    const client = new Client(`ws://localhost:${PORT}`);
    const us: TypedRoom = await client.create<ClassicState>("hedgemony-classic", { role: "player", displayName: "US-player" });
    const roomId = us.roomId;
    await wait(60);
    const ru: TypedRoom = await client.joinById<ClassicState>(roomId, { role: "player", displayName: "RU-player" });
    await wait(60);
    const wc: TypedRoom = await client.joinById<ClassicState>(roomId, { role: "white-cell", displayName: "WC" });
    await wait(60);

    us.send("claim-faction", { factionId: "US" });
    ru.send("claim-faction", { factionId: "RU" });
    await wait(100);
    us.send("start-game");
    await wait(150);
    console.log("\n[CL5] room: start + signal + WC adjudication");
    ok(us.state.status === "active", `game active (got ${us.state.status})`);

    // RU signals in Phase 1.
    ru.send("signal-cards", { cardIds: ["RU-A", "RU-B"] });
    await wait(120);
    ok(us.state.factions.get("RU")?.signaledCards.length === 2, "RU signaled 2 cards (visible to all)");

    // WC places a force and adjusts IP.
    wc.send("wc-place-force", { aor: "AFRICOM", factionId: "RU", count: 2, modLevel: 2 });
    wc.send("wc-adjust-tracker", { factionId: "US", field: "ip", delta: 5 });
    wc.send("wc-roll", { sides: 10, label: "CRT A" });
    await wait(150);
    const af = us.state.aors.get("AFRICOM");
    ok((af?.forces.find((f) => f.factionId === "RU")?.count ?? 0) === 2, "WC placed 2 RU FF in AFRICOM");
    ok(us.state.factions.get("US")?.ip === 55, `US IP 50→55 via WC (got ${us.state.factions.get("US")?.ip})`);
    ok(us.state.dice.length === 1, "WC roll recorded in dice log");

    // A non-WC player cannot adjudicate.
    let err = "";
    us.onMessage("error", (m: { reason: string }) => { err = m.reason; });
    us.send("wc-adjust-tracker", { factionId: "US", field: "ip", delta: 99 });
    await wait(120);
    ok(err.toLowerCase().includes("white cell"), `player blocked from WC move (got "${err}")`);

    // Advance Phase 1 → 2 (both players confirm).
    us.send("confirm-phase");
    ru.send("confirm-phase");
    await wait(150);
    ok(us.state.phase === 2, `advanced to Phase 2 (got ${us.state.phase})`);

    await us.leave(); await ru.leave(); await wc.leave();
  } catch (e) {
    console.error("\n[classic] client error:", e);
    fails++;
  }
  await server.gracefullyShutdown(false);
}

async function main() {
  unitTests();
  await clientSmoke();
  if (fails > 0) {
    console.error(`\n✗ classic test FAILED (${fails} assertions)`);
    process.exit(1);
  }
  console.log("\n✓ classic test passed");
}

main().catch((e) => { console.error(e); process.exit(1); });
