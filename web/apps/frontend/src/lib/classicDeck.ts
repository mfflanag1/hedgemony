"use client";

import type { ClassicCard } from "@hedgemony/shared";
import { CLASSIC_SAMPLE_CARDS } from "@hedgemony/spec";
import { PHOTO_CLASSIC_CARDS } from "./photoCards.generated";

/**
 * Local, browser-side deck store for the classic/custom-photo mode. Seed data
 * includes the free sample cards plus photographed card faces with OCR drafts.
 * User edits live in localStorage only and can be shared with JSON export.
 */
const KEY = "hedgemony:classic:deck";

export const BASE_CLASSIC_DECK: ClassicCard[] = [
  ...CLASSIC_SAMPLE_CARDS,
  ...PHOTO_CLASSIC_CARDS,
];

export function loadDeck(): ClassicCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [...BASE_CLASSIC_DECK];
    const parsed = JSON.parse(raw) as ClassicCard[];
    return Array.isArray(parsed) ? mergeWithBaseDeck(parsed) : [...BASE_CLASSIC_DECK];
  } catch {
    return [...BASE_CLASSIC_DECK];
  }
}

export function saveDeck(cards: ClassicCard[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(cards));
}

export async function loadDeckFromServer(): Promise<ClassicCard[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/classic/cards", { cache: "no-store" });
    const body = await res.json() as { cards?: ClassicCard[] };
    if (!Array.isArray(body.cards) || body.cards.length === 0) return null;
    return mergeWithBaseDeck(body.cards);
  } catch {
    return null;
  }
}

export async function saveDeckToServer(cards: ClassicCard[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/classic/cards", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cards }),
    });
  } catch {
    // Local storage remains the offline fallback.
  }
}

export async function removeCardFromServer(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/classic/cards", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch {
    // Local storage remains the offline fallback.
  }
}

export function upsertCard(cards: ClassicCard[], card: ClassicCard): ClassicCard[] {
  const i = cards.findIndex((c) => c.id === card.id);
  const next = [...cards];
  if (i >= 0) next[i] = card;
  else next.push(card);
  next.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return next;
}

function mergeWithBaseDeck(cards: ClassicCard[]): ClassicCard[] {
  const byId = new Map<string, ClassicCard>();
  for (const card of BASE_CLASSIC_DECK) byId.set(card.id, card);
  for (const card of cards) byId.set(card.id, card);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export function removeCard(cards: ClassicCard[], id: string): ClassicCard[] {
  return cards.filter((c) => c.id !== id);
}

export function exportDeck(cards: ClassicCard[]): void {
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hedgemony-classic-deck.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportVerifiedDeck(cards: ClassicCard[]): void {
  const verified = cards.filter((card) => card.transcriptionStatus === "verified");
  const blob = new Blob([JSON.stringify(verified, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hedgemony-classic-verified-cards.json";
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDeckFile(file: File): Promise<ClassicCard[]> {
  const text = await file.text();
  const parsed = JSON.parse(text) as ClassicCard[];
  if (!Array.isArray(parsed)) throw new Error("not a card array");
  return parsed;
}
