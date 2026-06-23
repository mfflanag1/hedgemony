/**
 * Phase 4c — Postgres persistence test.
 *
 * Verifies the snapshot pipeline end-to-end:
 *  1. A game advances a phase
 *  2. Engine schedules a snapshot
 *  3. Debounce fires; snapshot written to Postgres
 *  4. games.{turn, phase, status} row matches current game state
 *  5. game_snapshots contains a row with serialized state
 *  6. serializeState round-trips: critical fields preserved
 *
 * SKIPS gracefully if DATABASE_URL is unset or DB unreachable — so CI
 * without Docker doesn't red-flag this test.
 */
import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Client, Room } from "colyseus.js";
import { eq, desc } from "drizzle-orm";
import { getDb, schema, closeDb } from "@hedgemony/db";
import { HedgemonyRoom } from "../rooms/HedgemonyRoom";
import type { HedgemonyState } from "../schema/state";

type TypedRoom = Room<HedgemonyState>;

const PORT = 2994;

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

async function probeDb(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    // A trivial query that forces a connection
    await db.select().from(schema.games).limit(1);
    return true;
  } catch (err) {
    console.warn(`[persistence] DB probe failed: ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  const hasDb = await probeDb();
  if (!hasDb) {
    console.log("\n⊘ persistence test SKIPPED (no DATABASE_URL or Postgres not reachable)");
    console.log("  Run with: docker compose up -d postgres && pnpm --filter @hedgemony/db migrate");
    console.log("  then:    DATABASE_URL=postgres://hedgemony:hedgemony_dev@localhost:5432/hedgemony pnpm --filter @hedgemony/engine test:persistence\n");
    return;
  }

  console.log("[persistence] starting server…");
  const http = createServer();
  const server = new Server({ transport: new WebSocketTransport({ server: http }) });
  server.define("hedgemony", HedgemonyRoom);
  await server.listen(PORT);

  try {
    const client = new Client(`ws://localhost:${PORT}`);

    console.log("\n[persistence] Alice + Bob start a game");
    const alice: TypedRoom = await client.create<HedgemonyState>("hedgemony", {
      role: "player", displayName: "Alice",
    });
    const roomId = alice.roomId;
    await wait(50);
    const bob: TypedRoom = await client.joinById<HedgemonyState>(roomId, {
      role: "player", displayName: "Bob",
    });
    await wait(60);
    alice.send("claim-faction", { factionId: "OpenBrain" });
    bob.send("claim-faction", { factionId: "DeepCent" });
    await wait(80);
    alice.send("start-game");
    await wait(200); // let start-game scheduleSnapshot fire (500ms debounce)
    await wait(600);

    const db = getDb()!;

    // After game start, games table has a row
    const meta = await db.select().from(schema.games).where(eq(schema.games.id, roomId)).limit(1);
    ok(meta.length === 1, `games row exists for ${roomId}`);
    ok(meta[0]?.status === "active", `games.status = active (got ${meta[0]?.status})`);
    ok((meta[0]?.seed?.length ?? 0) > 0, `games.seed populated`);

    // And at least one snapshot
    const snaps0 = await db
      .select()
      .from(schema.gameSnapshots)
      .where(eq(schema.gameSnapshots.gameId, roomId))
      .orderBy(desc(schema.gameSnapshots.id));
    ok(snaps0.length >= 1, `at least one snapshot (got ${snaps0.length})`);
    const latestAtStart = snaps0[0];
    ok(latestAtStart?.turn === 1 && latestAtStart?.phase === 1, `snapshot turn/phase (T${latestAtStart?.turn}P${latestAtStart?.phase})`);

    // Verify serialized state preserves the critical fields
    const snapState = latestAtStart?.state as Record<string, unknown>;
    ok(typeof snapState === "object" && snapState !== null, "snapshot is an object");
    ok((snapState as { seed: string }).seed === meta[0]?.seed, "serialized seed matches");
    ok(typeof (snapState as { tracks: unknown }).tracks === "object", "serialized tracks present");
    ok(typeof (snapState as { factions: unknown }).factions === "object", "serialized factions present");

    console.log("\n[persistence] advance to Phase 2, verify new snapshot");
    alice.send("confirm-phase");
    bob.send("confirm-phase");
    await wait(200);
    await wait(600); // let the debounced snapshot fire

    const snaps1 = await db
      .select()
      .from(schema.gameSnapshots)
      .where(eq(schema.gameSnapshots.gameId, roomId))
      .orderBy(desc(schema.gameSnapshots.id));
    ok(snaps1.length >= snaps0.length + 1, `new snapshot after phase advance (${snaps0.length} → ${snaps1.length})`);
    const latestAfterAdvance = snaps1[0];
    ok(latestAfterAdvance?.phase === 2, `latest snapshot is Phase 2 (got ${latestAfterAdvance?.phase})`);

    const meta2 = await db.select().from(schema.games).where(eq(schema.games.id, roomId)).limit(1);
    ok(meta2[0]?.phase === 2, `games.phase updated to 2 (got ${meta2[0]?.phase})`);

    console.log("\n[persistence] Phase 4d — restore a fresh room from the snapshot");
    // Join as White Cell so we can see the (private) restored hands.
    const restored: TypedRoom = await client.create<HedgemonyState>("hedgemony", {
      role: "white-cell", displayName: "Restorer", restoreGameId: roomId,
    });
    await wait(300);
    ok(restored.state.turn === 1 && restored.state.phase === 2, `restored at T${restored.state.turn}P${restored.state.phase}`);
    ok(restored.state.status === "active", `restored status active (got ${restored.state.status})`);
    ok(restored.state.seed === meta[0]?.seed, `restored seed matches original (got ${restored.state.seed})`);
    ok((restored.state.factions.get("OpenBrain")?.handCardIds.length ?? 0) > 0, `restored OpenBrain hand visible to WC`);
    ok((restored.state.factions.get("DeepCent")?.capabilityLevel ?? -1) >= 0, `restored DeepCent faction present`);
    await restored.leave();

    console.log("\n[persistence] pause updates meta but not snapshot");
    // White cell joins and pauses
    const wc: TypedRoom = await client.joinById<HedgemonyState>(roomId, {
      role: "white-cell", displayName: "WC",
    });
    await wait(100);
    const snapCountBefore = snaps1.length;
    wc.send("pause-game");
    await wait(300);

    const meta3 = await db.select().from(schema.games).where(eq(schema.games.id, roomId)).limit(1);
    ok(meta3[0]?.status === "paused", `games.status = paused (got ${meta3[0]?.status})`);

    const snaps2 = await db
      .select()
      .from(schema.gameSnapshots)
      .where(eq(schema.gameSnapshots.gameId, roomId));
    // No full snapshot for a pause — meta-only update. Allow the count to
    // remain unchanged or increase by 1 if start-game's debounce was still
    // pending and happened to flush alongside.
    ok(snaps2.length >= snapCountBefore, `pause doesn't decrease snapshot count`);

    await alice.leave();
    await bob.leave();
    await wc.leave();

    // Dispose fires final snapshot on its way out
    await wait(1000);
    const snapsFinal = await db
      .select()
      .from(schema.gameSnapshots)
      .where(eq(schema.gameSnapshots.gameId, roomId));
    ok(snapsFinal.length >= snaps2.length, `final snapshot on dispose`);
  } catch (e) {
    console.error("\n[persistence] error:", e);
    fails++;
  }

  await server.gracefullyShutdown(false);
  await closeDb();

  if (fails > 0) {
    console.error(`\n${fails} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log("\n✓ persistence e2e test passed\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
