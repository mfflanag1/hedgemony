"use client";

import { TRACKS } from "@hedgemony/shared";
import type { TrackId } from "@hedgemony/shared";

export function Tracks({ values }: { values: Record<TrackId, number> }) {
  const ids: TrackId[] = ["CL", "M", "X", "ET"];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {ids.map((id) => {
        const meta = TRACKS[id];
        const val = values[id];
        const pct = ((val - meta.min) / (meta.max - meta.min)) * 100;
        return (
          <div
            key={id}
            className="flex items-center gap-3"
            title={`${meta.id} — ${meta.longName}`}
          >
            <span className="font-mono text-xs text-zinc-400 w-12">{meta.id}</span>
            <div className="w-40 h-2 bg-bg-base border border-bg-line rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all ${colorFor(id)}`}
                style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
              />
            </div>
            <span className="font-mono text-xs text-zinc-300 w-12">
              {val}/{meta.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function colorFor(id: TrackId): string {
  switch (id) {
    case "CL":
      return "bg-openbrain";
    case "M":
      return "bg-deepcent";
    case "X":
      return "bg-politburo";
    case "ET":
      return "bg-coalition";
  }
}
