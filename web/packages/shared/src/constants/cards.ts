import { FACTIONS } from "./factions";
import type { Card, FactionId } from "../types";

/** Neutral accent for cards without a faction affinity (universal cards). */
export const UNIVERSAL_CARD_ACCENT = "#888";

/**
 * Returns the color that should accent a card in the UI.
 * - If the card names at least one faction, use the first one's accent.
 * - Otherwise (universal / "any faction" cards), return the neutral accent.
 */
export function getPrimaryFactionAccent(card: Pick<Card, "factions">): string {
  if (card.factions.length === 0) return UNIVERSAL_CARD_ACCENT;
  const primary = card.factions[0] as FactionId;
  return FACTIONS[primary].accentColor;
}
