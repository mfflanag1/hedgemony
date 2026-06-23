/**
 * Colyseus schema for the original RAND Hedgemony (TL301) — "classic" mode.
 *
 * Distinct from the Takeoff schema (Force Factors / Influence Points / AOR map /
 * 5-phase turn). Reuses the generic Participant/Log/Dice/Thread schemas from the
 * Takeoff schema module. LOCAL STUDY USE ONLY — see ORIGINAL/NOTICE.md.
 */
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import {
  ParticipantSchema,
  LogEntrySchema,
  DiceRollSchema,
  ThreadSchema,
} from "../schema/state";

/** A stack of identical Force Factors (same faction, same Mod Level) in an AOR. */
export class ClassicForceSchema extends Schema {
  @type("string") factionId: string = "";
  @type("number") count: number = 0;
  @type("number") modLevel: number = 1;
}

export class ClassicAorSchema extends Schema {
  @type("string") id: string = "";
  @type([ClassicForceSchema]) forces: ArraySchema<ClassicForceSchema> =
    new ArraySchema<ClassicForceSchema>();
}

export class ClassicFactionSchema extends Schema {
  @type("string") id: string = "";
  @type("string") side: string = "blue"; // "blue" | "red"
  @type("number") rp: number = 0;
  @type("number") ip: number = 0;
  @type("number") perTurnRp: number = 0;
  @type("number") techLevel: number = 0;
  /** U.S. only; 0 for others. */
  @type("number") readiness: number = 0;
  /** Critical-capability Mod Levels keyed by capability id (LRF, C4ISR, …). */
  @type({ map: "number" }) modLevels: MapSchema<number> = new MapSchema<number>();
  /** True once this faction has confirmed the current phase. */
  @type("boolean") ready: boolean = false;
  /** Red Signaling (Phase 1): card ids signaled to Blue this turn. Public by design. */
  @type(["string"]) signaledCards: ArraySchema<string> = new ArraySchema<string>();
  /** Card ids announced/played this game. Effects remain White-Cell adjudicated. */
  @type(["string"]) playedCards: ArraySchema<string> = new ArraySchema<string>();
}

export class ClassicState extends Schema {
  @type("string") status: string = "lobby"; // GameStatus
  @type("number") turn: number = 1;
  @type("number") phase: number = 1; // 1..5
  @type({ map: ClassicFactionSchema }) factions: MapSchema<ClassicFactionSchema> =
    new MapSchema<ClassicFactionSchema>();
  @type({ map: ClassicAorSchema }) aors: MapSchema<ClassicAorSchema> =
    new MapSchema<ClassicAorSchema>();
  @type({ map: ParticipantSchema }) participants: MapSchema<ParticipantSchema> =
    new MapSchema<ParticipantSchema>();
  @type([LogEntrySchema]) log: ArraySchema<LogEntrySchema> = new ArraySchema<LogEntrySchema>();
  @type([DiceRollSchema]) dice: ArraySchema<DiceRollSchema> = new ArraySchema<DiceRollSchema>();
  @type({ map: ThreadSchema }) threads: MapSchema<ThreadSchema> = new MapSchema<ThreadSchema>();
  @type("boolean") gameEnded: boolean = false;
  @type(["string"]) winners: ArraySchema<string> = new ArraySchema<string>();
  @type("string") ownerSessionId: string = "";
  @type("string") seed: string = "";
  @type("number") rollCounter: number = 0;
}
