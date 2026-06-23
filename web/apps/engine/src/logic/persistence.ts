/**
 * Postgres persistence layer for game state.
 *
 * All calls are fail-soft: if the DB is unreachable or DATABASE_URL is
 * unset, operations log a warning and no-op so the engine keeps running
 * in in-memory-only mode.
 *
 * Phase 4c scope: snapshot saves on phase advance and game-end. Live
 * restoration (rebuild room from snapshot after server restart) is Phase 4d.
 */
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@hedgemony/db";
import {
  HedgemonyState,
  FactionStateSchema,
  Resources,
  ActiveEffectSchema,
  ParticipantSchema,
  LogEntrySchema,
  DiceRollSchema,
  ThreadSchema,
  NegotiationMessageSchema,
} from "../schema/state";
import {
  ClassicAorSchema,
  ClassicFactionSchema,
  ClassicForceSchema,
  ClassicState,
} from "../classic/state";

const { games, gameSnapshots } = schema;

/** Convert Colyseus Schema state to a plain JSON object for storage. */
export function serializeState(state: HedgemonyState): unknown {
  return JSON.parse(JSON.stringify(state));
}

export function serializeClassicState(state: ClassicState): unknown {
  return JSON.parse(JSON.stringify(state));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any, d = 0): number => (typeof v === "number" ? v : d);
const str = (v: any, d = ""): string => (typeof v === "string" ? v : d);
const bool = (v: any): boolean => v === true;

/**
 * Rebuild a Colyseus HedgemonyState from a stored snapshot (the inverse of
 * serializeState). Used by Phase 4d live restoration on room creation. The
 * snapshot is the server's full, unfiltered state, so all private data is
 * recovered. Defensive about missing fields so older snapshots still load.
 */
export function deserializeState(json: unknown): HedgemonyState {
  const j = (json ?? {}) as any;
  const s = new HedgemonyState();

  s.status = str(j.status, "lobby");
  s.turn = num(j.turn, 1);
  s.phase = num(j.phase, 1);
  s.dpaInvoked = bool(j.dpaInvoked);
  s.whistleblowerPlayed = bool(j.whistleblowerPlayed);

  s.tracks.CL = num(j.tracks?.CL);
  s.tracks.M = num(j.tracks?.M);
  s.tracks.X = num(j.tracks?.X);
  s.tracks.ET = num(j.tracks?.ET);

  for (const [id, fj0] of Object.entries(j.factions ?? {})) {
    const fj = fj0 as any;
    const f = new FactionStateSchema();
    f.id = str(fj.id, id);
    const r = new Resources();
    r.K = num(fj.resources?.K); r.C = num(fj.resources?.C); r.T = num(fj.resources?.T);
    r.E = num(fj.resources?.E); r.A = num(fj.resources?.A); r.P = num(fj.resources?.P);
    f.resources = r;
    f.capabilityLevel = num(fj.capabilityLevel);
    for (const c of fj.handCardIds ?? []) f.handCardIds.push(c);
    for (const c of fj.deckCardIds ?? []) f.deckCardIds.push(c);
    for (const c of fj.discardCardIds ?? []) f.discardCardIds.push(c);
    for (const c of fj.signaledCardIds ?? []) f.signaledCardIds.push(c);
    for (const e of fj.activeEffects ?? []) {
      const ae = new ActiveEffectSchema();
      ae.source = str(e.source); ae.description = str(e.description); ae.remainingTurns = num(e.remainingTurns);
      f.activeEffects.push(ae);
    }
    f.ready = bool(fj.ready);
    f.frontierPushCommit.committed = bool(fj.frontierPushCommit?.committed);
    f.frontierPushCommit.spendK = num(fj.frontierPushCommit?.spendK);
    f.frontierPushCommit.spendC = num(fj.frontierPushCommit?.spendC);
    f.frontierPushCommit.spendT = num(fj.frontierPushCommit?.spendT);
    f.frontierPushCommit.spendA = num(fj.frontierPushCommit?.spendA);
    f.frontierPushCommit.targetCL = num(fj.frontierPushCommit?.targetCL);
    f.nationalizedBy = str(fj.nationalizedBy);
    s.factions.set(id, f);
  }

  for (const [sid, pj0] of Object.entries(j.participants ?? {})) {
    const pj = pj0 as any;
    const p = new ParticipantSchema();
    p.sessionId = str(pj.sessionId, sid);
    p.displayName = str(pj.displayName);
    p.factionId = str(pj.factionId);
    p.role = str(pj.role, "player");
    p.connected = bool(pj.connected);
    s.participants.set(sid, p);
  }

  for (const lj of j.log ?? []) {
    const l = new LogEntrySchema();
    l.id = str(lj.id); l.turn = num(lj.turn); l.phase = num(lj.phase);
    l.actor = str(lj.actor, "system"); l.eventType = str(lj.eventType);
    l.message = str(lj.message); l.visibility = str(lj.visibility, "all");
    l.createdAt = str(lj.createdAt);
    s.log.push(l);
  }

  for (const dj of j.dice ?? []) {
    const d = new DiceRollSchema();
    d.id = str(dj.id); d.turn = num(dj.turn); d.phase = num(dj.phase);
    d.rollType = str(dj.rollType); d.actor = str(dj.actor, "system");
    for (const n of dj.dice ?? []) d.dice.push(num(n));
    d.modifierTotal = num(dj.modifierTotal); d.modifierSummary = str(dj.modifierSummary);
    d.result = num(dj.result); d.visibility = str(dj.visibility, "all");
    s.dice.push(d);
  }

  for (const [tid, tj0] of Object.entries(j.threads ?? {})) {
    const tj = tj0 as any;
    const t = new ThreadSchema();
    t.id = str(tj.id, tid); t.kind = str(tj.kind, "bilateral"); t.name = str(tj.name);
    t.participantFactionIds = str(tj.participantFactionIds); t.createdAt = str(tj.createdAt);
    for (const mj of tj.messages ?? []) {
      const m = new NegotiationMessageSchema();
      m.id = str(mj.id); m.threadId = str(mj.threadId); m.senderFactionId = str(mj.senderFactionId);
      m.body = str(mj.body); m.createdAt = str(mj.createdAt); m.readByFactions = str(mj.readByFactions);
      t.messages.push(m);
    }
    s.threads.set(tid, t);
  }

  s.successorActive = bool(j.successorActive);
  s.consolidation.faction = str(j.consolidation?.faction);
  s.consolidation.progressTurns = num(j.consolidation?.progressTurns);
  s.consolidation.startedTurn = num(j.consolidation?.startedTurn);
  s.consolidation.lastProgressTurn = num(j.consolidation?.lastProgressTurn);
  s.consolidation.suspended = bool(j.consolidation?.suspended);
  s.regime = str(j.regime, "unresolved");
  for (const w of j.winners ?? []) s.winners.push(w);
  s.ownerSessionId = str(j.ownerSessionId);
  s.seed = str(j.seed);
  s.rollCounter = num(j.rollCounter);
  return s;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function deserializeClassicState(json: unknown): ClassicState {
  const j = (json ?? {}) as any;
  const s = new ClassicState();

  s.status = str(j.status, "lobby");
  s.turn = num(j.turn, 1);
  s.phase = num(j.phase, 1);
  s.gameEnded = bool(j.gameEnded);

  for (const [id, fj0] of Object.entries(j.factions ?? {})) {
    const fj = fj0 as any;
    const f = new ClassicFactionSchema();
    f.id = str(fj.id, id);
    f.side = str(fj.side, "blue");
    f.rp = num(fj.rp);
    f.ip = num(fj.ip);
    f.perTurnRp = num(fj.perTurnRp);
    f.techLevel = num(fj.techLevel);
    f.readiness = num(fj.readiness);
    f.ready = bool(fj.ready);
    for (const [cap, level] of Object.entries(fj.modLevels ?? {})) f.modLevels.set(cap, num(level));
    for (const card of fj.signaledCards ?? []) f.signaledCards.push(str(card));
    for (const card of fj.playedCards ?? []) f.playedCards.push(str(card));
    s.factions.set(id, f);
  }

  for (const [id, aj0] of Object.entries(j.aors ?? {})) {
    const aj = aj0 as any;
    const a = new ClassicAorSchema();
    a.id = str(aj.id, id);
    for (const force0 of aj.forces ?? []) {
      const force = force0 as any;
      const stack = new ClassicForceSchema();
      stack.factionId = str(force.factionId);
      stack.count = num(force.count);
      stack.modLevel = num(force.modLevel, 1);
      a.forces.push(stack);
    }
    s.aors.set(id, a);
  }

  for (const [sid, pj0] of Object.entries(j.participants ?? {})) {
    const pj = pj0 as any;
    const p = new ParticipantSchema();
    p.sessionId = str(pj.sessionId, sid);
    p.displayName = str(pj.displayName);
    p.factionId = str(pj.factionId);
    p.role = str(pj.role, "player");
    p.connected = bool(pj.connected);
    s.participants.set(sid, p);
  }

  for (const lj of j.log ?? []) {
    const l = new LogEntrySchema();
    l.id = str(lj.id); l.turn = num(lj.turn); l.phase = num(lj.phase);
    l.actor = str(lj.actor, "system"); l.eventType = str(lj.eventType);
    l.message = str(lj.message); l.visibility = str(lj.visibility, "all");
    l.createdAt = str(lj.createdAt);
    s.log.push(l);
  }

  for (const dj of j.dice ?? []) {
    const d = new DiceRollSchema();
    d.id = str(dj.id); d.turn = num(dj.turn); d.phase = num(dj.phase);
    d.rollType = str(dj.rollType); d.actor = str(dj.actor, "system");
    for (const n of dj.dice ?? []) d.dice.push(num(n));
    d.modifierTotal = num(dj.modifierTotal); d.modifierSummary = str(dj.modifierSummary);
    d.result = num(dj.result); d.visibility = str(dj.visibility, "all");
    s.dice.push(d);
  }

  s.ownerSessionId = str(j.ownerSessionId);
  s.seed = str(j.seed);
  s.rollCounter = num(j.rollCounter);
  for (const w of j.winners ?? []) s.winners.push(str(w));
  return s;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Upsert the game metadata row. Called at every significant transition so
 * the `games` table always reflects current status.
 */
export async function saveGameMeta(
  roomId: string,
  state: HedgemonyState
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const status = state.status;
    const now = new Date();
    const values = {
      id: roomId,
      seed: state.seed,
      status,
      turn: state.turn,
      phase: state.phase,
      successorActive: state.successorActive,
      regime: state.regime,
      updatedAt: now,
      endedAt: status === "ended" ? now : null,
    };
    await db
      .insert(games)
      .values(values)
      .onConflictDoUpdate({
        target: games.id,
        set: {
          status: values.status,
          turn: values.turn,
          phase: values.phase,
          successorActive: values.successorActive,
          regime: values.regime,
          updatedAt: values.updatedAt,
          endedAt: values.endedAt,
        },
      });
  } catch (err) {
    console.warn(`[persistence] saveGameMeta(${roomId}) failed:`, (err as Error).message);
  }
}

export async function saveClassicGameMeta(
  roomId: string,
  state: ClassicState
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const status = state.status;
    const now = new Date();
    const values = {
      id: roomId,
      seed: state.seed,
      status,
      turn: state.turn,
      phase: state.phase,
      successorActive: false,
      regime: "classic",
      updatedAt: now,
      endedAt: status === "ended" ? now : null,
    };
    await db
      .insert(games)
      .values(values)
      .onConflictDoUpdate({
        target: games.id,
        set: {
          status: values.status,
          turn: values.turn,
          phase: values.phase,
          successorActive: values.successorActive,
          regime: values.regime,
          updatedAt: values.updatedAt,
          endedAt: values.endedAt,
        },
      });
  } catch (err) {
    console.warn(`[persistence] saveClassicGameMeta(${roomId}) failed:`, (err as Error).message);
  }
}

/**
 * Append a full-state snapshot. Caller decides when — typically on phase
 * advance, game-start, game-end, and dispose.
 */
export async function saveSnapshot(
  roomId: string,
  state: HedgemonyState
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    // Save meta first so the FK resolves on the snapshot insert below
    await saveGameMeta(roomId, state);
    await db.insert(gameSnapshots).values({
      gameId: roomId,
      turn: state.turn,
      phase: state.phase,
      state: serializeState(state),
    });
  } catch (err) {
    console.warn(`[persistence] saveSnapshot(${roomId}) failed:`, (err as Error).message);
  }
}

export async function saveClassicSnapshot(
  roomId: string,
  state: ClassicState
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await saveClassicGameMeta(roomId, state);
    await db.insert(gameSnapshots).values({
      gameId: roomId,
      turn: state.turn,
      phase: state.phase,
      state: serializeClassicState(state),
    });
  } catch (err) {
    console.warn(`[persistence] saveClassicSnapshot(${roomId}) failed:`, (err as Error).message);
  }
}

/**
 * Fetch the most recent snapshot for a game. Used by the (future)
 * Phase 4d live-restoration path and by AAR export in Phase 6.
 */
export async function loadLatestSnapshot(
  roomId: string
): Promise<unknown | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const row = await db
      .select()
      .from(gameSnapshots)
      .where(eq(gameSnapshots.gameId, roomId))
      .orderBy(desc(gameSnapshots.id))
      .limit(1);
    return row[0]?.state ?? null;
  } catch (err) {
    console.warn(`[persistence] loadLatestSnapshot(${roomId}) failed:`, (err as Error).message);
    return null;
  }
}

/**
 * Fetch all snapshots for a game in chronological order. Used by AAR
 * timeline scrubber (Phase 6).
 */
export async function loadAllSnapshots(
  roomId: string
): Promise<Array<{ turn: number; phase: number; state: unknown; createdAt: Date }>> {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = await db
      .select({
        turn: gameSnapshots.turn,
        phase: gameSnapshots.phase,
        state: gameSnapshots.state,
        createdAt: gameSnapshots.createdAt,
      })
      .from(gameSnapshots)
      .where(eq(gameSnapshots.gameId, roomId))
      .orderBy(gameSnapshots.id);
    return rows.map((r) => ({
      turn: r.turn,
      phase: r.phase,
      state: r.state,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.warn(`[persistence] loadAllSnapshots(${roomId}) failed:`, (err as Error).message);
    return [];
  }
}
