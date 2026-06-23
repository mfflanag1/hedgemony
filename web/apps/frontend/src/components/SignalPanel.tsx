"use client";

import { useEffect, useState } from "react";
import { catalog } from "@hedgemony/spec";
import type { FactionSnapshot } from "@/lib/useGameRoom";

/**
 * Intelligence Briefing (Phase 1) control for DeepCent / Politburo: pick up to
 * 3 hand cards to signal to the US side. Sends `signal-cards`.
 */
export function SignalPanel({
  myFaction,
  send,
}: {
  myFaction: FactionSnapshot;
  send: (type: string, payload?: unknown) => void;
}) {
  const handKeys = Array.from(myFaction.handCardIds);
  const signaled = new Set(Array.from(myFaction.signaledCardIds ?? []));
  const [selected, setSelected] = useState<string[]>(Array.from(signaled));

  // Re-sync local selection when the server's signaled set changes (e.g. on
  // turn rollover the server clears them).
  useEffect(() => {
    setSelected(Array.from(myFaction.signaledCardIds ?? []));
  }, [myFaction.signaledCardIds]);

  const toggle = (key: string) => {
    setSelected((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      if (cur.length >= 3) return cur; // cap at 3
      return [...cur, key];
    });
  };

  return (
    <div className="border border-deepcent/50 bg-deepcent/5 rounded-sm px-3 py-2">
      <p className="font-mono text-xs uppercase tracking-wider text-deepcent mb-1">
        Intelligence Briefing — signal up to 3
      </p>
      <p className="font-mono text-[10px] text-zinc-500 mb-2">
        Reveal cards as a deterrence message to the US side.
      </p>
      <ul className="space-y-1 mb-2">
        {handKeys.map((key) => {
          const card = catalog.byId[key];
          const on = selected.includes(key);
          return (
            <li key={key}>
              <button
                onClick={() => toggle(key)}
                className={`w-full text-left font-mono text-[11px] px-2 py-1 rounded-sm border transition-colors ${
                  on
                    ? "border-deepcent text-deepcent bg-deepcent/10"
                    : "border-bg-line text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {on ? "◉" : "○"} {card?.id ?? key} {card?.name ?? ""}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2">
        <button
          onClick={() => send("signal-cards", { cardIds: selected })}
          className="font-mono text-[11px] uppercase tracking-wider border border-deepcent text-deepcent px-3 py-1 rounded-sm hover:bg-deepcent hover:text-bg-base transition-colors"
        >
          Signal ({selected.length})
        </button>
        <button
          onClick={() => {
            setSelected([]);
            send("signal-cards", { cardIds: [] });
          }}
          className="font-mono text-[11px] uppercase tracking-wider border border-zinc-600 text-zinc-400 px-3 py-1 rounded-sm hover:bg-bg-card"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
