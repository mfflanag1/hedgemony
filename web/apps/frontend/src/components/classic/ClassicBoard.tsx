"use client";

import { useState } from "react";
import {
  CLASSIC_FACTIONS,
  CLASSIC_AOR_IDS,
  CLASSIC_AOR_NAMES,
  CLASSIC_PHASES,
  CLASSIC_CAPABILITIES,
  type ClassicAorId,
  type ClassicFactionId,
} from "@hedgemony/shared";
import type { ClassicSnapshot, ClassicFactionSnapshot, ClassicForceSnapshot } from "@/lib/useClassicRoom";
import { BOARD_IMAGE } from "./componentsManifest";

export function PhaseBar({ state }: { state: ClassicSnapshot }) {
  return (
    <div className="flex items-center gap-1 font-mono text-[11px]">
      <span className="text-zinc-500 mr-2">Turn {state.turn}/16</span>
      {CLASSIC_PHASES.map((p) => (
        <span
          key={p.id}
          className={`px-2 py-0.5 rounded-sm border ${
            p.id === state.phase
              ? "border-amber-500 text-amber-300 bg-amber-500/10"
              : "border-bg-line text-zinc-600"
          }`}
          title={p.name}
        >
          {p.id}. {p.shortName}
        </span>
      ))}
    </div>
  );
}

function factionColor(id: string): string {
  return CLASSIC_FACTIONS[id as ClassicFactionId]?.accentColor ?? "#a1a1aa";
}

export function FactionTrackers({ state, meId }: { state: ClassicSnapshot; meId?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(state.factions).map((f) => (
        <FactionCard key={f.id} f={f} isMe={f.id === meId} />
      ))}
    </div>
  );
}

function FactionCard({ f, isMe }: { f: ClassicFactionSnapshot; isMe: boolean }) {
  const meta = CLASSIC_FACTIONS[f.id as ClassicFactionId];
  const mods = CLASSIC_CAPABILITIES.filter((c) => f.modLevels[c] !== undefined);
  return (
    <div
      className={`border rounded-sm px-3 py-2 ${isMe ? "border-amber-500/60 bg-amber-500/5" : "border-bg-line"}`}
      style={{ borderLeftColor: meta?.accentColor, borderLeftWidth: 3 }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase" style={{ color: meta?.accentColor }}>
          {meta?.name ?? f.id}
        </span>
        <span className="font-mono text-[10px] text-zinc-500">{f.side}{f.ready ? " · ✓" : ""}</span>
      </div>
      <div className="font-mono text-[11px] text-zinc-300 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        <span title="Influence Points">IP {f.ip}</span>
        <span title="Resource Points">RP {f.rp}</span>
        <span title="National Tech Level">Tech {f.techLevel}</span>
        {meta?.tracksReadiness && <span title="Readiness">Rdy {f.readiness}</span>}
      </div>
      {mods.length > 0 && (
        <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
          {mods.map((c) => `${c} ${f.modLevels[c]}`).join(" · ")}
        </div>
      )}
    </div>
  );
}

export function WorldBoard({ state }: { state: ClassicSnapshot }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm p-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Areas of Responsibility
        </p>
        <div className="flex items-center gap-2">
          <a href={`/classic-assets/${BOARD_IMAGE}`} target="_blank" rel="noreferrer"
            className="font-mono text-[10px] text-zinc-500 hover:text-amber-300">
            photo reference
          </a>
          <button
            onClick={() => setShowOverlays((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-wider border border-bg-line text-zinc-400 px-2 py-1 rounded-sm hover:bg-bg-card"
          >
            {showOverlays ? "Hide labels" : "Show labels"}
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="font-mono text-[10px] uppercase tracking-wider border border-amber-500/60 text-amber-300 px-2 py-1 rounded-sm hover:bg-amber-500 hover:text-bg-base transition-colors"
          >
            Full screen
          </button>
        </div>
      </div>
      <AorOperationalMap state={state} showOverlays={showOverlays} />
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-sm p-4 md:p-6">
          <div className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-amber-300">
                  Areas of Responsibility
                </p>
                <p className="font-mono text-[11px] text-zinc-500">
                  Turn {state.turn} / Phase {state.phase}
                </p>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="font-mono text-[11px] uppercase tracking-wider border border-bg-line text-zinc-300 px-3 py-2 rounded-sm hover:bg-bg-card"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <AorOperationalMap state={state} fullscreen showOverlays={showOverlays} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AOR_LAYOUT: Record<ClassicAorId, {
  title: string;
  subtitle: string;
  left: string;
  top: string;
  width: string;
  maxRows?: number;
  accent: string;
}> = {
  NORTHCOM: {
    title: "NORTHCOM",
    subtitle: "North America",
    left: "3.5%",
    top: "5.5%",
    width: "14%",
    maxRows: 2,
    accent: "#7dd3fc",
  },
  SOUTHCOM: {
    title: "SOUTHCOM",
    subtitle: "Latin America",
    left: "28%",
    top: "80%",
    width: "13%",
    maxRows: 1,
    accent: "#6ee7b7",
  },
  EUCOM: {
    title: "EUCOM",
    subtitle: "Europe",
    left: "80.5%",
    top: "5.5%",
    width: "13%",
    maxRows: 2,
    accent: "#67e8f9",
  },
  CENTCOM: {
    title: "CENTCOM",
    subtitle: "Middle East",
    left: "5%",
    top: "76%",
    width: "13%",
    maxRows: 2,
    accent: "#fbbf24",
  },
  AFRICOM: {
    title: "AFRICOM",
    subtitle: "Africa",
    left: "52.5%",
    top: "76%",
    width: "13%",
    maxRows: 1,
    accent: "#bef264",
  },
  INDOPACOM: {
    title: "INDOPACOM",
    subtitle: "Indo-Pacific",
    left: "81.5%",
    top: "76%",
    width: "14.5%",
    maxRows: 3,
    accent: "#f0abfc",
  },
};

function AorOperationalMap({
  state,
  fullscreen = false,
  showOverlays,
}: {
  state: ClassicSnapshot;
  fullscreen?: boolean;
  showOverlays: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-sm border border-bg-line bg-bg-base ${
      fullscreen ? "mx-auto h-full max-w-full aspect-[5/3]" : "w-full aspect-[5/3] min-h-[420px]"
    }`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/classic-assets/derived/aor-map.jpg"
        alt="Classic Hedgemony areas of responsibility map"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg-base/5 via-transparent to-bg-base/20" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
      <div className="relative h-full">
        {showOverlays && (
          <>
            {CLASSIC_AOR_IDS.map((aorId) => (
              <AorZone
                key={aorId}
                aorId={aorId}
                forces={state.aors[aorId]?.forces ?? []}
                fullscreen={fullscreen}
              />
            ))}
            <FactionLegend />
          </>
        )}
      </div>
    </div>
  );
}

function AorZone({
  aorId,
  forces,
  fullscreen,
}: {
  aorId: ClassicAorId;
  forces: ClassicForceSnapshot[];
  fullscreen: boolean;
}) {
  const meta = AOR_LAYOUT[aorId];
  const hasForces = forces.length > 0;
  const visibleForces = meta.maxRows ? forces.slice(0, meta.maxRows) : forces;
  const hiddenCount = forces.length - visibleForces.length;
  return (
    <section
      className={`absolute min-w-0 overflow-hidden rounded-md border bg-[#111427]/72 shadow-[0_8px_22px_rgba(0,0,0,0.20)] backdrop-blur-[2px] ${
        hasForces ? "border-white/18" : "border-white/10"
      }`}
      style={{
        left: meta.left,
        top: meta.top,
        width: meta.width,
        borderTopColor: meta.accent,
        borderTopWidth: 2,
      }}
      title={CLASSIC_AOR_NAMES[aorId]}
    >
      <div className="flex items-center justify-between gap-1.5 border-b border-white/10 bg-white/[0.03] px-1.5 py-1">
        <p className={`font-mono uppercase tracking-[0.14em] text-zinc-100 ${fullscreen ? "text-[11px]" : "text-[9px]"}`}>
          {shortAorLabel(meta.title)}
        </p>
        <p className="hidden xl:block font-mono text-[8px] text-zinc-500 truncate">{meta.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-1 px-1.5 py-1.5">
        {forces.length === 0 ? (
          <span className="font-mono text-[9px] text-zinc-500 border border-white/10 rounded-sm px-1 py-0.5 bg-bg-base/30">
            no forces
          </span>
        ) : (
          <>
            {visibleForces.map((fc, i) => <ForceMarker key={`${fc.factionId}-${fc.modLevel}-${i}`} force={fc} />)}
            {hiddenCount > 0 && (
              <span className="font-mono text-[9px] text-zinc-400 border border-white/10 rounded-sm px-1 py-0.5 bg-bg-base/50">
                +{hiddenCount}
              </span>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ForceMarker({ force }: { force: ClassicForceSnapshot }) {
  const color = factionColor(force.factionId);
  return (
    <span
      className="font-mono text-[9px] rounded-sm border bg-bg-base/70 px-1 py-0.5 shadow-sm whitespace-nowrap"
      style={{ color, borderColor: `${color}88` }}
      title={`${force.factionId}: ${force.count} force factor(s), Mod ${force.modLevel}`}
    >
      {force.factionId} {force.count} M{force.modLevel}
    </span>
  );
}

function shortAorLabel(title: string): string {
  return title.replace(/^US/, "");
}

function FactionLegend() {
  return (
    <div className="absolute bottom-2 right-2 hidden md:flex flex-wrap justify-end gap-1.5 max-w-[72%] rounded-sm border border-bg-line bg-bg-base/80 px-2 py-1.5">
      {Object.values(CLASSIC_FACTIONS).map((f) => (
        <span key={f.id} className="font-mono text-[10px] text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ backgroundColor: f.accentColor }} />
          {f.id}
        </span>
      ))}
    </div>
  );
}
