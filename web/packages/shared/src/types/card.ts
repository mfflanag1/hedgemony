import type { FactionId } from "./faction";
import type { ResourceKind } from "./resources";

export type CardType = "action" | "investment" | "event";

export type CardCategory =
  // Action card categories
  | "frontier"
  | "espionage"
  | "trade"
  | "talent-public"
  | "crisis"
  | "safety"
  | "cartel"
  | "successor-triggered"
  | "consolidation-international"   // I16–I20
  // Investment card categories
  | "infrastructure"
  | "rnd"
  | "talent"
  | "diplomacy"
  | "reserve"
  | "moonshot"
  // Event card categories
  | "international-event"
  | "domestic-event"
  | "capability-event"
  | "crisis-event"
  | "wild-event";

/** Structured cost: any resource may be required to play a card. */
export type CardCost = Partial<Record<ResourceKind, number>>;

/**
 * Structured card effect. The parser extracts the raw text; effect_spec is a
 * best-effort parse into executable primitives. When the parser cannot infer a
 * structured effect, it leaves `spec` empty and the engine falls back to the
 * raw text (which requires White Cell adjudication or hard-coded card logic).
 */
export interface CardEffect {
  raw: string;
  spec: CardEffectOp[];
}

export type CardEffectOp =
  | { op: "resource"; target: "self" | "all" | FactionId; delta: Partial<Record<ResourceKind, number>> }
  | { op: "track"; track: "CL" | "M" | "X" | "ET"; delta: number }
  | { op: "roll"; dice: "1d6" | "1d10" | "2d6" | "2d10"; against?: string; modifiers?: string[] }
  | { op: "persistent"; description: string; durationTurns?: number }
  | { op: "meta"; description: string }; // unstructured; adjudicator handles

export interface Card {
  /** ID like "F01", "I16", "M06", etc. (prefix indicates category) */
  id: string;
  type: CardType;
  category: CardCategory;
  name: string;
  /** Factions able to play this card. Empty = playable by any faction. */
  factions: FactionId[];
  cost: CardCost;
  /** Build time in turns; 0 or undefined = immediate */
  buildTime?: number;
  effect: CardEffect;
  /** Risk/failure modes described (unstructured for MVP) */
  risk?: string;
  flavor?: string;
  /** Whether this card is single-use per game */
  singleUse?: boolean;
  /** Phase restriction hint (e.g. "Intelligence" | "Frontier Push" | etc.) */
  phaseHint?: string;
  /** Raw source markdown for debugging/audit */
  rawMarkdown: string;
}

export interface CardCatalog {
  action: Card[];
  investment: Card[];
  event: Card[];
  byId: Record<string, Card>;
  generatedAt: string;
  sourceCommit?: string;
}
