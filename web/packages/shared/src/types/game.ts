import type { FactionId } from "./faction";
import type { ResourceBag, TrackState } from "./resources";
import type { PhasePosition } from "./phase";

export type GameStatus = "lobby" | "active" | "paused" | "ended";

export type GovernanceRegime =
  | "hegemonic"
  | "bipolar"
  | "multipolar"
  | "singleton"
  | "failed"
  | "unresolved";

export interface FactionState {
  id: FactionId;
  resources: ResourceBag;
  /** Current CL for labs; undefined for non-lab factions */
  capabilityLevel?: number;
  /** Card IDs currently in hand (private to this faction + White Cell) */
  handCardIds: string[];
  /** Active persistent effects */
  activeEffects: ActiveEffect[];
  /** Nationalization status (for labs) */
  nationalizedBy?: FactionId;
  /** Whether Successor is active and which lab spawned it */
  spawnedSuccessorFrom?: FactionId;
}

export interface ActiveEffect {
  source: string; // card ID that created this effect
  description: string;
  remainingTurns?: number; // undefined = permanent
}

export interface GameState {
  /** Server-side stable id */
  id: string;
  status: GameStatus;
  position: PhasePosition;
  /** Global tracks (CL/M/X/ET) */
  tracks: TrackState;
  /** Per-faction state, keyed by FactionId */
  factions: Record<FactionId, FactionState>;
  /** Whether Successor has been activated as a player */
  successorActive: boolean;
  /** Governance regime (only set at game end) */
  regime?: GovernanceRegime;
  /** Winning factions (empty until game end) */
  winners: FactionId[];
}

/**
 * A player's intent to act this phase. Server validates legality and applies
 * side effects when all required intents are received.
 */
export type Move =
  | { kind: "play-card"; cardId: string; target?: FactionId }
  | { kind: "frontier-push"; spend: Partial<ResourceBag>; targetCL: number; alignmentSpend: number }
  | { kind: "signal-cards"; cardIds: string[] } // Intelligence phase
  | { kind: "allocate-compute"; allocations: Record<FactionId, number> } // Cartel
  | { kind: "pause-request" }
  | { kind: "confirm-phase" };

export interface LogEntry {
  id: string;
  position: PhasePosition;
  actor: FactionId | "white-cell" | "system";
  eventType: string;
  payload: Record<string, unknown>;
  visibleToFactions: FactionId[] | "all";
  createdAt: string;
}

export interface DiceRoll {
  id: string;
  position: PhasePosition;
  rollType: string;
  faction: FactionId | "white-cell";
  dice: number[];
  modifiers: Array<{ source: string; delta: number }>;
  result: number;
  success?: boolean;
  visibleTo: FactionId[] | "all";
}

export interface NegotiationMessage {
  id: string;
  threadId: string;
  senderId: FactionId;
  recipientIds: FactionId[]; // multiple for coalition threads
  body: string;
  createdAt: string;
  readByFactions: FactionId[];
}
