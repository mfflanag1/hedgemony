/**
 * Colyseus schema for the Hedgemony game state.
 *
 * MVP note: visibility filtering not yet implemented — hands and private
 * state are sent to all clients; the client is trusted not to render them.
 * Production must use `@filterChildren` to partition per-faction visibility.
 */
import { Schema, type, filter, filterChildren, MapSchema, ArraySchema } from "@colyseus/schema";
import type { FactionId, GameStatus, GovernanceRegime } from "@hedgemony/shared";

// ---------- per-faction visibility filters ----------
//
// Colyseus sends each client a filtered view. Private per-faction data (hands,
// decks, hidden Frontier-Push commits) is visible only to the owning faction's
// player and the White Cell. Signaled cards are additionally visible to the US
// side (Hegemon / OpenBrain) per the rules. The server keeps the full state;
// only what's broadcast to each client is filtered.

interface ClientRef { sessionId: string }

function clientFaction(client: ClientRef, root: HedgemonyState): string {
  return root.participants.get(client.sessionId)?.factionId ?? "";
}
function clientRole(client: ClientRef, root: HedgemonyState): string {
  return root.participants.get(client.sessionId)?.role ?? "";
}
/** Owner (by faction id) or White Cell may see a faction's private data. */
function canSeePrivate(ownerId: string, client: ClientRef, root: HedgemonyState): boolean {
  return clientRole(client, root) === "white-cell" || clientFaction(client, root) === ownerId;
}
/** Signals are also visible to the US side (the deterrence audience). */
function canSeeSignal(ownerId: string, client: ClientRef, root: HedgemonyState): boolean {
  if (canSeePrivate(ownerId, client, root)) return true;
  const f = clientFaction(client, root);
  return f === "Hegemon" || f === "OpenBrain";
}

// ---------- primitives ----------

export class Resources extends Schema {
  @type("number") K: number = 0;
  @type("number") C: number = 0;
  @type("number") T: number = 0;
  @type("number") E: number = 0;
  @type("number") A: number = 0;
  @type("number") P: number = 0;
}

export class Tracks extends Schema {
  @type("number") CL: number = 0;
  @type("number") M: number = 0;
  @type("number") X: number = 0;
  @type("number") ET: number = 0;
}

// ---------- faction state ----------

export class ActiveEffectSchema extends Schema {
  @type("string") source: string = ""; // card id
  @type("string") description: string = "";
  @type("number") remainingTurns: number = 0; // 0 = permanent
}

/** Per-faction frontier push intent during Phase 2 (hidden until reveal). */
export class FrontierPushCommit extends Schema {
  @type("boolean") committed: boolean = false;
  @type("number") spendK: number = 0;
  @type("number") spendC: number = 0;
  @type("number") spendT: number = 0;
  @type("number") spendA: number = 0;
  @type("number") targetCL: number = 0;
}

export class FactionStateSchema extends Schema {
  @type("string") id: string = "";
  @type(Resources) resources: Resources = new Resources();
  /** Current CL for labs (and Successor post-activation); 0 for non-labs */
  @type("number") capabilityLevel: number = 0;
  /** Card ids in hand (format: "type:id" e.g. "action:F01"). Private to owner + WC. */
  @filterChildren(function (this: FactionStateSchema, client: ClientRef, _k: number, _v: string, root: HedgemonyState) {
    return canSeePrivate(this.id, client, root);
  })
  @type(["string"]) handCardIds: ArraySchema<string> = new ArraySchema<string>();
  /** Remaining draw deck (shuffled; server-authoritative order). Private to owner + WC. */
  @filterChildren(function (this: FactionStateSchema, client: ClientRef, _k: number, _v: string, root: HedgemonyState) {
    return canSeePrivate(this.id, client, root);
  })
  @type(["string"]) deckCardIds: ArraySchema<string> = new ArraySchema<string>();
  /** Played/discarded cards (public log) */
  @type(["string"]) discardCardIds: ArraySchema<string> = new ArraySchema<string>();
  /**
   * Cards this faction signaled during Phase 1 (Intelligence Briefing).
   * Only DeepCent/Politburo populate this; reset each turn. Per the rules,
   * signals are a deterrence message visible to the US side (Hegemon/OpenBrain).
   */
  @filterChildren(function (this: FactionStateSchema, client: ClientRef, _k: number, _v: string, root: HedgemonyState) {
    return canSeeSignal(this.id, client, root);
  })
  @type(["string"]) signaledCardIds: ArraySchema<string> = new ArraySchema<string>();
  @type([ActiveEffectSchema]) activeEffects: ArraySchema<ActiveEffectSchema> =
    new ArraySchema<ActiveEffectSchema>();
  /** True once the faction has confirmed actions for the current phase */
  @type("boolean") ready: boolean = false;
  /** Frontier Push pending commitment (Phase 2 only); hidden from rivals until
   *  it resolves (cleared at phase advance). Visible to owner + WC. */
  @filter(function (this: FactionStateSchema, client: ClientRef, _v: FrontierPushCommit, root: HedgemonyState) {
    return canSeePrivate(this.id, client, root);
  })
  @type(FrontierPushCommit) frontierPushCommit: FrontierPushCommit = new FrontierPushCommit();
  /** If non-empty, which faction nationalized this one (for labs) */
  @type("string") nationalizedBy: string = "";
}

// ---------- participants ----------

export class ParticipantSchema extends Schema {
  /** Colyseus sessionId of the client */
  @type("string") sessionId: string = "";
  @type("string") displayName: string = "";
  /** "" while unassigned; FactionId once they pick a faction */
  @type("string") factionId: string = "";
  /** "player" | "white-cell" | "spectator" */
  @type("string") role: string = "player";
  @type("boolean") connected: boolean = true;
}

// ---------- log entries & dice ----------

export class LogEntrySchema extends Schema {
  @type("string") id: string = "";
  @type("number") turn: number = 0;
  @type("number") phase: number = 0;
  /** Actor: faction id, "white-cell", or "system" */
  @type("string") actor: string = "system";
  @type("string") eventType: string = "";
  /** Human-readable message for the log UI */
  @type("string") message: string = "";
  /** Space-separated list of factions that can see this (or "all") */
  @type("string") visibility: string = "all";
  @type("string") createdAt: string = "";
}

export class DiceRollSchema extends Schema {
  @type("string") id: string = "";
  @type("number") turn: number = 0;
  @type("number") phase: number = 0;
  @type("string") rollType: string = "";
  @type("string") actor: string = "system";
  @type(["number"]) dice: ArraySchema<number> = new ArraySchema<number>();
  @type("number") modifierTotal: number = 0;
  @type("string") modifierSummary: string = "";
  @type("number") result: number = 0;
  @type("string") visibility: string = "all";
}

// ---------- press / negotiation ----------

export class NegotiationMessageSchema extends Schema {
  @type("string") id: string = "";
  @type("string") threadId: string = "";
  @type("string") senderFactionId: string = "";
  @type("string") body: string = "";
  @type("string") createdAt: string = "";
  /** Space-separated list of faction ids that have read this message. */
  @type("string") readByFactions: string = "";
}

export class ThreadSchema extends Schema {
  @type("string") id: string = "";
  /** "bilateral" (auto-created per pair) or "coalition" (ad-hoc) */
  @type("string") kind: string = "bilateral";
  /** Human-readable label; blank for bilateral threads (UI derives from participants) */
  @type("string") name: string = "";
  /** Space-separated participant faction ids */
  @type("string") participantFactionIds: string = "";
  @type([NegotiationMessageSchema]) messages: ArraySchema<NegotiationMessageSchema> =
    new ArraySchema<NegotiationMessageSchema>();
  @type("string") createdAt: string = "";
}

// ---------- capability consolidation (CL 8) ----------

/**
 * Tracks an in-progress Capability Consolidation (the CL-8 "Singleton" path).
 * `faction` is "" when no consolidation is active. Per the rules, a CL-7 lab
 * spends CONSOLIDATION_COST for CONSOLIDATION_TURNS uninterrupted turns; on
 * completion it reaches CL 8 and wins by Apex Victory.
 */
export class ConsolidationSchema extends Schema {
  @type("string") faction: string = ""; // "" = none active
  @type("number") progressTurns: number = 0; // 0..CONSOLIDATION_TURNS
  @type("number") startedTurn: number = 0;
  /** Last turn a progress step was paid — enforces one step per turn. */
  @type("number") lastProgressTurn: number = 0;
  /** Suspended (sabotage / misalignment) — blocks progress this turn. */
  @type("boolean") suspended: boolean = false;
}

// ---------- root state ----------

export class HedgemonyState extends Schema {
  @type("string") status: string = "lobby"; // GameStatus
  @type("number") turn: number = 1;
  @type("number") phase: number = 1;
  /** One-shot flags tracking single-use faction levers so the UI can hide them */
  @type("boolean") dpaInvoked: boolean = false;
  @type("boolean") whistleblowerPlayed: boolean = false;
  @type(Tracks) tracks: Tracks = new Tracks();
  @type({ map: FactionStateSchema }) factions: MapSchema<FactionStateSchema> =
    new MapSchema<FactionStateSchema>();
  @type({ map: ParticipantSchema }) participants: MapSchema<ParticipantSchema> =
    new MapSchema<ParticipantSchema>();
  @type([LogEntrySchema]) log: ArraySchema<LogEntrySchema> = new ArraySchema<LogEntrySchema>();
  @type([DiceRollSchema]) dice: ArraySchema<DiceRollSchema> = new ArraySchema<DiceRollSchema>();
  /** Press threads keyed by thread id ("bilateral:A:B" sorted, or "coalition:<ts>-<rand>"). */
  @type({ map: ThreadSchema }) threads: MapSchema<ThreadSchema> =
    new MapSchema<ThreadSchema>();
  @type("boolean") successorActive: boolean = false;
  @type(ConsolidationSchema) consolidation: ConsolidationSchema = new ConsolidationSchema();
  @type("string") regime: string = "unresolved";
  @type(["string"]) winners: ArraySchema<string> = new ArraySchema<string>();
  /** Owner sessionId (first joiner) */
  @type("string") ownerSessionId: string = "";
  /** Server-side RNG seed (audit; can be exposed at game end) */
  @type("string") seed: string = "";
  /** Monotonic counter for deterministic dice */
  @type("number") rollCounter: number = 0;
}

// ---------- cast helpers ----------

export function asStatus(s: string): GameStatus {
  return s as GameStatus;
}

export function asFactionId(s: string): FactionId {
  return s as FactionId;
}

export function asRegime(s: string): GovernanceRegime {
  return s as GovernanceRegime;
}
