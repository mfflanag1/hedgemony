"use client";

import { useState } from "react";
import {
  CLASSIC_FACTION_ORDER,
  CLASSIC_FACTIONS,
  CLASSIC_AOR_IDS,
  CLASSIC_CAPABILITIES,
  type ClassicFactionId,
} from "@hedgemony/shared";
import type { ClassicSnapshot } from "@/lib/useClassicRoom";
import { ActionLog } from "../ActionLog";
import { DiceLog } from "../DiceLog";
import { RandBanner } from "./RandBanner";
import { PhaseBar, FactionTrackers, WorldBoard } from "./ClassicBoard";
import { PLACEMAT_BY_LABEL } from "./componentsManifest";

export function ClassicWhiteCell({
  state,
  send,
}: {
  state: ClassicSnapshot;
  send: (type: string, payload?: unknown) => void;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <RandBanner />
      <header className="border-b border-bg-line bg-bg-panel px-6 py-3 flex items-center justify-between">
        <h1 className="font-serif text-lg">
          <span className="text-amber-400">WHITE CELL</span>{" "}
          <span className="text-zinc-500 text-sm">· classic adjudication</span>
        </h1>
        <PhaseBar state={state} />
      </header>

      <div className="flex-1 grid grid-cols-12 gap-0">
        <section className="col-span-5 border-r border-bg-line p-4 flex flex-col gap-3 overflow-y-auto">
          <GameControls state={state} send={send} />
          <ForceControls send={send} />
          <TrackerControls send={send} />
          <DiceControls send={send} />
          <InjectControls send={send} />
        </section>
        <section className="col-span-7 p-4 flex flex-col gap-3 overflow-y-auto">
          <WorldBoard state={state} />
          <FactionTrackers state={state} />
          <ActionLog log={state.log} />
          <DiceLog dice={state.dice} />
          <ResolutionTableNote />
        </section>
      </div>
    </main>
  );
}

const SELECT = "bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-mono text-[11px]";
const BTN = "font-mono text-[11px] uppercase tracking-wider border border-amber-500 text-amber-300 px-3 py-1 rounded-sm hover:bg-amber-500 hover:text-bg-base transition-colors";
const PANEL = "border border-bg-line rounded-sm px-3 py-2";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={PANEL}>
      <p className="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-2">{title}</p>
      {children}
    </div>
  );
}

function GameControls({ state, send }: { state: ClassicSnapshot; send: (t: string, p?: unknown) => void }) {
  return (
    <Panel title="Game">
      <div className="flex flex-wrap gap-2">
        <button className={BTN} onClick={() => send(state.status === "paused" ? "resume-game" : "pause-game")}>
          {state.status === "paused" ? "Resume" : "Pause"}
        </button>
        <button className={BTN} onClick={() => send("force-advance-phase")}>Force-advance phase</button>
      </div>
      <p className="font-mono text-[10px] text-zinc-600 mt-1">status: {state.status}</p>
    </Panel>
  );
}

function FactionSelect({ value, onChange }: { value: ClassicFactionId; onChange: (v: ClassicFactionId) => void }) {
  return (
    <select className={SELECT} value={value} onChange={(e) => onChange(e.target.value as ClassicFactionId)}>
      {CLASSIC_FACTION_ORDER.map((id) => (
        <option key={id} value={id}>{CLASSIC_FACTIONS[id].name}</option>
      ))}
    </select>
  );
}

function ForceControls({ send }: { send: (t: string, p?: unknown) => void }) {
  const [aor, setAor] = useState<string>(CLASSIC_AOR_IDS[0]);
  const [faction, setFaction] = useState<ClassicFactionId>("US");
  const [count, setCount] = useState(1);
  const [modLevel, setModLevel] = useState(3);
  return (
    <Panel title="Forces (place / remove)">
      <div className="flex flex-wrap items-center gap-2">
        <select className={SELECT} value={aor} onChange={(e) => setAor(e.target.value)}>
          {CLASSIC_AOR_IDS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <FactionSelect value={faction} onChange={setFaction} />
        <label className="font-mono text-[10px] text-zinc-500">FF
          <input type="number" min={1} value={count} onChange={(e) => setCount(+e.target.value)} className={`${SELECT} w-14 ml-1`} />
        </label>
        <label className="font-mono text-[10px] text-zinc-500">Mod
          <input type="number" min={0} max={5} value={modLevel} onChange={(e) => setModLevel(+e.target.value)} className={`${SELECT} w-12 ml-1`} />
        </label>
      </div>
      <div className="flex gap-2 mt-2">
        <button className={BTN} onClick={() => send("wc-place-force", { aor, factionId: faction, count, modLevel })}>Place</button>
        <button className={BTN} onClick={() => send("wc-remove-force", { aor, factionId: faction, count, modLevel })}>Remove</button>
      </div>
    </Panel>
  );
}

function TrackerControls({ send }: { send: (t: string, p?: unknown) => void }) {
  const [faction, setFaction] = useState<ClassicFactionId>("US");
  const [field, setField] = useState<"rp" | "ip" | "techLevel" | "readiness">("ip");
  const [delta, setDelta] = useState(1);
  const [cap, setCap] = useState<string>(CLASSIC_CAPABILITIES[0]);
  const [level, setLevel] = useState(1);
  return (
    <Panel title="Trackers">
      <div className="flex flex-wrap items-center gap-2">
        <FactionSelect value={faction} onChange={setFaction} />
        <select className={SELECT} value={field} onChange={(e) => setField(e.target.value as typeof field)}>
          <option value="ip">IP</option><option value="rp">RP</option>
          <option value="techLevel">Tech</option><option value="readiness">Readiness</option>
        </select>
        <input type="number" value={delta} onChange={(e) => setDelta(+e.target.value)} className={`${SELECT} w-16`} />
        <button className={BTN} onClick={() => send("wc-adjust-tracker", { factionId: faction, field, delta })}>Apply Δ</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <select className={SELECT} value={cap} onChange={(e) => setCap(e.target.value)}>
          {CLASSIC_CAPABILITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="font-mono text-[10px] text-zinc-500">Mod
          <input type="number" min={0} max={5} value={level} onChange={(e) => setLevel(+e.target.value)} className={`${SELECT} w-12 ml-1`} />
        </label>
        <button className={BTN} onClick={() => send("wc-set-modlevel", { factionId: faction, capability: cap, level })}>Set Mod</button>
      </div>
    </Panel>
  );
}

function DiceControls({ send }: { send: (t: string, p?: unknown) => void }) {
  const [label, setLabel] = useState("CRT A");
  const [sides, setSides] = useState(10);
  const [modifier, setModifier] = useState(0);
  return (
    <Panel title="Dice (CRT A / RT B)">
      <div className="flex flex-wrap items-center gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className={`${SELECT} w-28`} />
        <select className={SELECT} value={sides} onChange={(e) => setSides(+e.target.value)}>
          <option value={10}>D10</option><option value={6}>D6</option>
        </select>
        <label className="font-mono text-[10px] text-zinc-500">mod
          <input type="number" value={modifier} onChange={(e) => setModifier(+e.target.value)} className={`${SELECT} w-12 ml-1`} />
        </label>
        <button className={BTN} onClick={() => send("wc-roll", { sides, label, modifier })}>Roll</button>
      </div>
    </Panel>
  );
}

function InjectControls({ send }: { send: (t: string, p?: unknown) => void }) {
  const [msg, setMsg] = useState("");
  return (
    <Panel title="Inject note / event">
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="adjudication note or event description…"
        className="w-full bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-mono text-[11px] h-16"
      />
      <button className={`${BTN} mt-1`} onClick={() => { if (msg.trim()) { send("inject-log", { message: msg }); setMsg(""); } }}>
        Inject
      </button>
    </Panel>
  );
}

function ResolutionTableNote() {
  return (
    <div className={PANEL}>
      <p className="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-1">
        Resolution tables &amp; procedures
      </p>
      <p className="font-mono text-[10px] text-zinc-500 leading-snug mb-2">
        Roll a D10 above, read the outcome band from the relevant table for the CF advantage,
        and apply IP/RP/force changes via the controls. Open the physical placemats:
      </p>
      <div className="flex flex-wrap gap-1">
        {[
          ["Combat Resolution Table A (CRT A)", "CRT A"],
          ["Resolution Table B (RT B) — noncombat", "RT B"],
          ["Combat Factors from Force Factors", "Combat Factors"],
          ["Modernization & Procurement Costs", "Costs"],
          ["Deployment Costs", "Deployment"],
          ["U.S. Readiness Costs", "Readiness"],
        ].map(([label, short]) => {
          const file = PLACEMAT_BY_LABEL[label!];
          if (!file) return null;
          return (
            <a
              key={label}
              href={`/classic-assets/${file}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] border border-bg-line text-amber-400 px-2 py-0.5 rounded-sm hover:border-amber-500/60"
            >
              {short} ↗
            </a>
          );
        })}
        <a href="/classic/components" target="_blank" rel="noreferrer"
          className="font-mono text-[10px] border border-bg-line text-zinc-400 px-2 py-0.5 rounded-sm hover:border-zinc-500">
          all components ↗
        </a>
      </div>
    </div>
  );
}
