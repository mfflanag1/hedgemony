"use client";

import { useEffect, useState } from "react";
import { catalog } from "@hedgemony/spec";
import { FACTIONS, getPrimaryFactionAccent } from "@hedgemony/shared";
import type { Card, FactionId, ResourceKind } from "@hedgemony/shared";

export function Hand({
  cardIdKeys,
  onPlay,
  myFaction,
  myResources,
}: {
  cardIdKeys: string[];
  onPlay: (cardIdKey: string) => void;
  myFaction: FactionId;
  myResources: Record<ResourceKind, number>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Reset selection and hover whenever the hand changes (e.g. after play,
  // after turn-end refill). Without this, the selected key can point at a
  // card that's no longer in hand, leading to a silent server rejection on
  // the next Play click.
  useEffect(() => {
    setSelected(null);
    setHovered(null);
  }, [cardIdKeys]);

  const cards = cardIdKeys
    .map((key) => ({ key, card: catalog.byId[key] }))
    .filter((x): x is { key: string; card: Card } => x.card !== undefined);

  const activeKey = hovered ?? selected;
  const activeCard = activeKey ? catalog.byId[activeKey] : null;

  const canAfford = (card: Card) => {
    const c = card.cost;
    return (
      (c.K ?? 0) <= myResources.K &&
      (c.C ?? 0) <= myResources.C &&
      (c.T ?? 0) <= myResources.T &&
      (c.E ?? 0) <= myResources.E &&
      (c.A ?? 0) <= myResources.A &&
      (c.P ?? 0) <= myResources.P
    );
  };

  return (
    <div className="bg-bg-panel border-t border-bg-line">
      {activeCard && (
        <CardPreview card={activeCard} canAfford={canAfford(activeCard)} />
      )}
      <div className="px-4 py-3 overflow-x-auto flex gap-2">
        {cards.length === 0 && (
          <p className="font-mono text-xs text-zinc-600 italic py-4">
            empty hand — refills at turn end
          </p>
        )}
        {cards.map(({ key, card }) => {
          const affordable = canAfford(card);
          const isSelected = selected === key;
          const accent = getPrimaryFactionAccent(card);
          return (
            <button
              key={key}
              onClick={() => setSelected(isSelected ? null : key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              className={`shrink-0 w-48 text-left border rounded-sm p-2.5 transition-all ${
                isSelected
                  ? "bg-bg-card ring-1"
                  : "bg-bg-card hover:bg-bg-panel"
              } ${!affordable ? "opacity-50" : ""}`}
              style={{
                borderColor: isSelected ? accent : "#252a4a",
                borderLeftColor: accent,
                borderLeftWidth: 3,
                ...(isSelected ? { boxShadow: `0 0 0 1px ${accent}66` } : {}),
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-mono text-[10px] text-zinc-500">{card.id}</span>
                <span className="font-mono text-[10px] text-zinc-300">
                  {formatCost(card)}
                </span>
              </div>
              <h4 className="font-sans text-sm font-semibold leading-snug line-clamp-2">
                {card.name}
              </h4>
              <p className="font-sans text-xs text-zinc-500 mt-1 leading-snug line-clamp-3">
                {card.effect.raw}
              </p>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="px-4 py-2 bg-bg-card border-t border-bg-line flex items-center justify-between">
          <span className="font-mono text-xs text-zinc-400">
            {catalog.byId[selected]?.name}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(null)}
              className="font-mono text-xs text-zinc-500 hover:text-zinc-200 px-3 py-1 rounded-sm border border-bg-line"
            >
              cancel
            </button>
            <button
              onClick={() => {
                const key = selected;
                if (!key) return;
                onPlay(key);
                setSelected(null);
              }}
              disabled={!activeCard || !canAfford(activeCard)}
              className="font-mono text-xs uppercase tracking-wider text-openbrain border border-openbrain px-3 py-1 rounded-sm hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Play →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CardPreview({ card, canAfford }: { card: Card; canAfford: boolean }) {
  return (
    <div className="px-4 py-3 bg-bg-card border-b border-bg-line">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          {card.id} · {card.category}
          {card.singleUse ? " · single-use" : ""}
        </span>
        <span className={`font-mono text-xs ${canAfford ? "text-openbrain" : "text-deepcent"}`}>
          {canAfford ? "affordable" : "insufficient resources"}
        </span>
      </div>
      <h3 className="font-sans text-base font-semibold mt-1">{card.name}</h3>
      <p className="font-sans text-sm text-zinc-300 mt-1 leading-snug">{card.effect.raw}</p>
      {card.risk && (
        <p className="font-sans text-xs text-zinc-500 mt-2 italic leading-snug">
          <span className="text-deepcent">Risk:</span> {card.risk}
        </p>
      )}
      {card.flavor && (
        <p className="font-serif text-xs text-zinc-400 mt-2 italic leading-snug">
          "{card.flavor}"
        </p>
      )}
    </div>
  );
}

function formatCost(card: Card): string {
  const parts: string[] = [];
  const c = card.cost;
  if (c.K) parts.push(`${c.K}K`);
  if (c.C) parts.push(`${c.C}C`);
  if (c.T) parts.push(`${c.T}T`);
  if (c.A) parts.push(`${c.A}A`);
  if (c.E) parts.push(`${c.E}E`);
  return parts.join(" + ") || "free";
}
