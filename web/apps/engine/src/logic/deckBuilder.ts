import type { Card, CardCatalog, FactionId } from "@hedgemony/shared";
import { SeededRng } from "./rng";

/** Starting hand size per faction, per 05_QUICK_REFERENCE.md setup checklist. */
export const STARTING_HAND_SIZE: Record<FactionId, number> = {
  OpenBrain: 5,
  DeepCent: 5,
  Hegemon: 4,
  Politburo: 4,
  Cartel: 4,
  Coalition: 5,
  Successor: 0, // Successor draws on activation; see Phase 5
};

/** Hand size refilled to at end of each turn. */
export const HAND_REFILL_SIZE: Record<FactionId, number> = STARTING_HAND_SIZE;

/**
 * Which action cards belong in each faction's deck.
 * A card is in the deck if:
 *   - Its `factions` includes this faction, OR
 *   - Its `factions` is empty (universal — playable by any)
 *
 * Per 02_ACTION_CARDS.md index, some cards are listed for multiple factions
 * (shared). Those appear in each faction's deck. This matches the tabletop
 * design where multiple players may draw the same action type.
 */
export function deckForFaction(catalog: CardCatalog, faction: FactionId): Card[] {
  return catalog.action.filter((c) => {
    if (c.factions.length === 0) return true;
    return c.factions.includes(faction);
  });
}

/**
 * Build initial shuffled deck for a faction and deal a starting hand.
 * Returns { hand, deck } where deck = remaining (undrawn) card ids.
 */
export function dealStartingHand(
  catalog: CardCatalog,
  faction: FactionId,
  rng: SeededRng
): { hand: string[]; deck: string[] } {
  const eligible = deckForFaction(catalog, faction);
  const shuffled = rng.shuffle(eligible.map((c) => `action:${c.id}`));
  const n = STARTING_HAND_SIZE[faction];
  return {
    hand: shuffled.slice(0, n),
    deck: shuffled.slice(n),
  };
}

/** Draw up to `target` cards from deck into hand. Returns updated arrays. */
export function drawTo(
  hand: string[],
  deck: string[],
  target: number
): { hand: string[]; deck: string[]; drawn: string[] } {
  const need = Math.max(0, target - hand.length);
  const drawn = deck.slice(0, need);
  return {
    hand: [...hand, ...drawn],
    deck: deck.slice(drawn.length),
    drawn,
  };
}
