"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FACTION_ORDER,
  FACTIONS,
  PHASES,
  turnToQuarter,
} from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { StateSnapshot, RoomError } from "@/lib/useGameRoom";
import { Tracks } from "./Tracks";
import { CapabilityLadder } from "./CapabilityLadder";

type Send = (type: string, payload?: unknown) => void;

/**
 * Facilitator console — a separate route from the player view. Exposes:
 * - Full game state (nothing filtered)
 * - Pause / Resume / Force-advance controls
 * - Inject-log freeform input
 * - Successor activation panel
 * - Per-faction status grid (connected / ready / CL / resources)
 */
export function WhiteCellConsole({
  state,
  sessionId,
  send,
  errors,
}: {
  state: StateSnapshot;
  sessionId: string;
  send: Send;
  errors: RoomError[];
}) {
  const phaseMeta = PHASES.find((p) => p.id === state.phase);
  const me = state.participants[sessionId];
  const isRegisteredWhiteCell = me?.role === "white-cell";

  return (
    <main className="min-h-screen relative z-10">
      <header className="border-b border-bg-line bg-bg-panel px-6 py-3">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-openbrain">
              WHITE CELL · facilitator console
            </p>
            <h1 className="font-serif text-xl">
              Hedgemony: Takeoff — {state.status}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-zinc-500">
              Turn {state.turn}/16 · {turnToQuarter(state.turn)}
            </p>
            <p className="font-mono text-[10px] text-zinc-500">
              Phase {state.phase}: {phaseMeta?.name}
            </p>
            <Link
              href={`/games/${/* room id comes from URL */ ""}`}
              className="font-mono text-[10px] text-zinc-600 hover:text-openbrain"
            >
              (player view → URL up one level)
            </Link>
          </div>
        </div>
        <Tracks values={state.tracks} />
      </header>

      {!isRegisteredWhiteCell && me && (
        <div className="px-6 py-2 bg-deepcent/10 border-b border-deepcent/30">
          <p className="font-mono text-xs text-deepcent">
            ⚠ You are joined as role "{me.role}", not "white-cell". Controls will be rejected by server.
          </p>
        </div>
      )}

      {state.status === "paused" && (
        <div className="px-6 py-2 bg-openbrain/10 border-b border-openbrain/30">
          <p className="font-mono text-xs text-openbrain">⏸ GAME PAUSED</p>
        </div>
      )}

      {errors.map((e) => (
        <div key={e.id} className="px-6 py-2 bg-deepcent/10 border-b border-deepcent/30">
          <p className="font-mono text-xs text-deepcent">⚠ {e.reason}</p>
        </div>
      ))}

      <div className="grid grid-cols-12 gap-0">
        {/* LEFT: controls + successor */}
        <section className="col-span-3 border-r border-bg-line p-4 space-y-4">
          <Controls state={state} send={send} />
          <SuccessorPanel state={state} send={send} />
          <InjectLog send={send} />
        </section>

        {/* CENTER: board + players */}
        <section className="col-span-6 p-4 space-y-4">
          <PlayersGrid state={state} />
          <CapabilityLadder state={state} />
        </section>

        {/* RIGHT: full game log */}
        <section className="col-span-3 border-l border-bg-line p-4">
          <FullLog state={state} />
        </section>
      </div>
    </main>
  );
}

// ---------- Controls ----------

function Controls({ state, send }: { state: StateSnapshot; send: Send }) {
  const [confirmForce, setConfirmForce] = useState(false);
  const running = state.status === "active";
  const paused = state.status === "paused";
  const ended = state.status === "ended";

  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Controls
      </p>
      <div className="space-y-2">
        <button
          disabled={!running}
          onClick={() => send("pause-game")}
          className="w-full font-mono text-xs uppercase tracking-wider border border-openbrain text-openbrain px-3 py-2 rounded-sm hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⏸ Pause Game
        </button>
        <button
          disabled={!paused}
          onClick={() => send("resume-game")}
          className="w-full font-mono text-xs uppercase tracking-wider border border-openbrain text-openbrain px-3 py-2 rounded-sm hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ▶ Resume Game
        </button>
        <button
          disabled={!running}
          onClick={() => setConfirmForce(true)}
          className="w-full font-mono text-xs uppercase tracking-wider border border-hegemon text-hegemon px-3 py-2 rounded-sm hover:bg-hegemon hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⏭ Force Advance Phase
        </button>
        {ended && (
          <p className="font-mono text-[10px] text-zinc-500 text-center">
            game ended — controls disabled
          </p>
        )}
      </div>

      {confirmForce && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
          <div className="bg-bg-panel border border-hegemon rounded-sm max-w-md w-full p-5 m-4">
            <p className="font-mono text-xs uppercase tracking-widest text-hegemon mb-2">
              FORCE-ADVANCE PHASE
            </p>
            <p className="font-sans text-sm text-zinc-300 leading-snug mb-4">
              Mark every seated faction as ready and advance immediately.
              Logged as a WC action. Players whose moves were pending (e.g. an
              uncommitted Frontier Push) lose that window.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmForce(false)}
                className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-bg-line text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  send("force-advance-phase");
                  setConfirmForce(false);
                }}
                className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-hegemon text-hegemon hover:bg-hegemon hover:text-bg-base transition-colors"
              >
                Force-advance →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Successor panel ----------

function SuccessorPanel({ state, send }: { state: StateSnapshot; send: Send }) {
  const [target, setTarget] = useState<FactionId>("OpenBrain");
  const active = state.successorActive;
  const su = state.factions["Successor"];

  return (
    <div
      className="bg-bg-panel border rounded-sm p-3"
      style={{ borderColor: active ? "#e0e0e0" : "#252a4a" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Successor {active ? "(ACTIVE)" : "(inactive)"}
      </p>

      <div className="font-mono text-xs text-zinc-400 mb-3 space-y-0.5">
        <div>M = <span className="text-zinc-100">{state.tracks.M}</span> / 7 threshold</div>
        <div>CL = <span className="text-zinc-100">{state.tracks.CL}</span> / 5 threshold</div>
        <div>
          would auto-activate on next failed alignment check:{" "}
          <span className={state.tracks.M >= 7 && state.tracks.CL >= 5 ? "text-deepcent" : "text-zinc-500"}>
            {state.tracks.M >= 7 && state.tracks.CL >= 5 ? "YES" : "no"}
          </span>
        </div>
      </div>

      {!active && (
        <>
          <label className="block font-mono text-[10px] uppercase text-zinc-500 mb-1">
            Spawn from
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as FactionId)}
            className="w-full bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-mono text-xs text-zinc-200 mb-2"
          >
            <option value="OpenBrain">OpenBrain</option>
            <option value="DeepCent">DeepCent</option>
          </select>
          <button
            onClick={() => send("activate-successor", { spawnedFrom: target })}
            className="w-full font-mono text-xs uppercase tracking-wider border border-successor text-successor px-3 py-2 rounded-sm hover:bg-successor hover:text-bg-base transition-colors"
          >
            Activate Successor
          </button>
          <p className="font-mono text-[10px] text-zinc-600 mt-2 leading-snug">
            Manual override — normally triggered automatically by failed
            alignment check at M ≥ 7, CL ≥ 5.
          </p>
        </>
      )}

      {active && su && (
        <div className="font-mono text-xs text-zinc-300 space-y-0.5 pt-2 border-t border-bg-line">
          <div>K {su.resources.K} · C {su.resources.C} · T {su.resources.T}</div>
          <div>E {su.resources.E} · A {su.resources.A} · P {su.resources.P}</div>
          <div>CL {su.capabilityLevel}</div>
          {su.nationalizedBy === "self-disclosed" && (
            <div className="text-coalition mt-2">● Honest Disclosure chosen</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Inject log ----------

function InjectLog({ send }: { send: Send }) {
  const [msg, setMsg] = useState("");
  const submit = () => {
    const text = msg.trim();
    if (!text) return;
    send("inject-log", { message: text });
    setMsg("");
  };
  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Adjudication note
      </p>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="freeform log entry…  (⌘/Ctrl+Enter to submit)"
        rows={3}
        className="w-full bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-sans text-xs text-zinc-200 resize-none focus:outline-none focus:border-openbrain"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={submit}
          disabled={!msg.trim()}
          className="font-mono text-xs uppercase tracking-wider border border-openbrain text-openbrain px-3 py-1 rounded-sm hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Post →
        </button>
      </div>
    </div>
  );
}

// ---------- Players grid ----------

function PlayersGrid({ state }: { state: StateSnapshot }) {
  const seated = Object.values(state.participants).filter(
    (p) => p.role === "player" && p.factionId
  );
  const whiteCells = Object.values(state.participants).filter((p) => p.role === "white-cell");
  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm">
      <header className="px-3 py-2 border-b border-bg-line">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Participants ({seated.length} seated · {whiteCells.length} WC)
        </p>
      </header>
      <div className="p-3 space-y-2">
        {FACTION_ORDER.map((id) => {
          const meta = FACTIONS[id];
          const claimed = seated.find((p) => p.factionId === id);
          const faction = state.factions[id];
          const isSuccessor = id === "Successor";
          if (isSuccessor && !state.successorActive && !claimed) return null;
          return (
            <div
              key={id}
              className="flex items-center gap-3 border border-bg-line rounded-sm px-2 py-1.5"
              style={{ borderLeftColor: meta.accentColor, borderLeftWidth: 3 }}
            >
              <span
                className="font-mono text-[10px] uppercase w-10"
                style={{ color: meta.accentColor }}
              >
                {meta.shortName}
              </span>
              <span className="font-sans text-xs text-zinc-200 flex-1 truncate">
                {claimed ? claimed.displayName : <em className="text-zinc-600">unclaimed</em>}
              </span>
              {claimed && (
                <span className={`font-mono text-[10px] ${claimed.connected ? "text-openbrain" : "text-zinc-600"}`}>
                  {claimed.connected ? "●" : "○"}
                </span>
              )}
              {faction && (
                <>
                  {faction.capabilityLevel > 0 && (
                    <span className="font-mono text-[10px] text-zinc-400">
                      CL {faction.capabilityLevel}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-zinc-500">
                    K{faction.resources.K} C{faction.resources.C} T{faction.resources.T}
                  </span>
                  {faction.ready && (
                    <span className="font-mono text-[10px] text-openbrain">✓</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Full game log ----------

function FullLog({ state }: { state: StateSnapshot }) {
  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm flex flex-col max-h-[calc(100vh-200px)]">
      <header className="px-3 py-2 border-b border-bg-line flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Full log
        </p>
        <span className="font-mono text-[10px] text-zinc-600">{state.log.length}</span>
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {state.log.map((e) => {
          const actorMeta =
            e.actor === "white-cell"
              ? null
              : e.actor === "system"
                ? null
                : FACTIONS[e.actor as FactionId];
          return (
            <div key={e.id} className="font-mono text-[11px] leading-snug flex gap-2">
              <span className="text-zinc-600 shrink-0">T{e.turn}P{e.phase}</span>
              <span
                className="shrink-0 uppercase"
                style={{
                  color: actorMeta?.accentColor ?? (e.actor === "white-cell" ? "#e0e0e0" : "#888"),
                }}
              >
                {actorMeta?.shortName ?? (e.actor === "white-cell" ? "WC" : e.actor === "system" ? "—" : e.actor)}
              </span>
              <span className="text-zinc-300">{e.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
