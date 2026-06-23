"use client";

import { FACTIONS, FACTION_ORDER } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { StateSnapshot } from "@/lib/useGameRoom";

export function LobbyView({
  state,
  sessionId,
  send,
  error,
}: {
  state: StateSnapshot;
  sessionId: string;
  send: (type: string, payload?: unknown) => void;
  error: string | null;
}) {
  const me = state.participants[sessionId];
  const isOwner = state.ownerSessionId === sessionId;

  // Build a map of factionId → displayName of the claimant
  const claims = new Map<string, string>();
  for (const p of Object.values(state.participants)) {
    if (p.factionId) claims.set(p.factionId, p.displayName);
  }

  const claimedCount = claims.size;
  const canStart = isOwner && claimedCount >= 2;

  return (
    <main className="min-h-screen px-8 py-10 max-w-6xl mx-auto">
      <header className="border-b border-bg-line pb-4 mb-8 flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-1">
            LOBBY · room {state.seed.slice(0, 8)}
          </p>
          <h1 className="font-serif text-3xl">Assemble your Situation Rooms</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {claimedCount} / 7 factions claimed · {isOwner ? "you are the host" : "host controls start"}
          </p>
        </div>
        <div className="font-mono text-xs text-zinc-500 text-right">
          <div>as <span className="text-zinc-200">{me?.displayName ?? "…"}</span></div>
          <div>session {sessionId.slice(0, 6)}</div>
        </div>
      </header>

      {error && (
        <div className="mb-6 font-mono text-sm text-deepcent border-l-2 border-deepcent pl-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {FACTION_ORDER.map((id) => {
          const f = FACTIONS[id];
          const claimedBy = claims.get(id);
          const isMine = me?.factionId === id;
          const disabled = !!claimedBy && !isMine;
          return (
            <button
              key={id}
              onClick={() => !disabled && send("claim-faction", { factionId: id })}
              disabled={disabled}
              className={`text-left border rounded-sm p-4 transition-colors ${
                isMine
                  ? "bg-bg-panel"
                  : disabled
                    ? "bg-bg-base opacity-40 cursor-not-allowed"
                    : "bg-bg-card hover:bg-bg-panel cursor-pointer"
              }`}
              style={{
                borderColor: isMine ? f.accentColor : "#252a4a",
                borderLeftColor: f.accentColor,
                borderLeftWidth: 3,
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: f.accentColor }}
                >
                  {f.shortName} · {f.category}
                </span>
                {claimedBy && (
                  <span className="font-mono text-[10px] text-zinc-500">
                    {isMine ? "★ you" : `claimed by ${claimedBy}`}
                  </span>
                )}
              </div>
              <h3 className="font-sans font-semibold text-base">{f.displayName}</h3>
              <p className="font-sans text-xs text-zinc-400 mt-1 leading-snug">
                {f.oneLineGoal}
              </p>
              {f.activatesMidGame && (
                <p className="font-mono text-[10px] text-zinc-600 mt-2">
                  ⓘ emergent — activates only mid-game
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-bg-line pt-4">
        <div className="font-mono text-xs text-zinc-500">
          {claimedCount < 2
            ? `waiting for ≥ 2 factions…`
            : isOwner
              ? `ready to start`
              : `waiting for host to start`}
        </div>
        {isOwner && (
          <button
            disabled={!canStart}
            onClick={() => send("start-game")}
            className={`font-mono text-sm uppercase tracking-wider px-6 py-2 rounded-sm border ${
              canStart
                ? "border-openbrain text-openbrain hover:bg-openbrain hover:text-bg-base"
                : "border-bg-line text-zinc-600 cursor-not-allowed"
            } transition-colors`}
          >
            Start Game →
          </button>
        )}
      </div>

      <section className="mt-12 pt-8 border-t border-bg-line">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
          Invite operators
        </h2>
        <p className="font-mono text-xs text-zinc-400 mb-2">
          Share this URL — anyone who opens it joins the lobby:
        </p>
        <code className="block font-mono text-xs text-openbrain bg-bg-panel border border-bg-line rounded-sm p-3 select-all break-all">
          {typeof window !== "undefined" ? window.location.href : ""}
        </code>
        <p className="font-mono text-xs text-zinc-400 mt-4 mb-2">
          Facilitator view (a different person opens this in a separate browser):
        </p>
        <code className="block font-mono text-xs text-hegemon bg-bg-panel border border-bg-line rounded-sm p-3 select-all break-all">
          {typeof window !== "undefined" ? window.location.href + "/cell" : ""}
        </code>
      </section>

      <Participants state={state} />

      <DebugPanel state={state} sessionId={sessionId} />
    </main>
  );
}

function DebugPanel({ state, sessionId }: { state: StateSnapshot; sessionId: string }) {
  const me = state.participants[sessionId];
  const pids = Object.keys(state.participants);
  return (
    <details className="mt-12 font-mono text-[10px] text-zinc-600 border-t border-bg-line pt-4">
      <summary className="cursor-pointer hover:text-zinc-400">debug</summary>
      <div className="mt-2 space-y-0.5">
        <div>my sessionId: <span className="text-zinc-400">{sessionId || "(none — not connected)"}</span></div>
        <div>my participant: <span className="text-zinc-400">{me ? `${me.displayName} · faction="${me.factionId || "none"}" · connected=${me.connected}` : "NOT FOUND IN STATE"}</span></div>
        <div>all participants ({pids.length}): <span className="text-zinc-400">{pids.length ? pids.map(p => p.slice(0, 6)).join(", ") : "(empty)"}</span></div>
        <div>owner: <span className="text-zinc-400">{state.ownerSessionId.slice(0, 6) || "(none)"}</span> {state.ownerSessionId === sessionId && "← you"}</div>
        <div>status: <span className="text-zinc-400">{state.status}</span></div>
      </div>
    </details>
  );
}

function Participants({ state }: { state: StateSnapshot }) {
  const participants = Object.values(state.participants);
  if (participants.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
        Operators in room
      </h2>
      <ul className="space-y-1">
        {participants.map((p) => {
          const f = p.factionId ? FACTIONS[p.factionId as FactionId] : null;
          return (
            <li key={p.sessionId} className="flex items-center gap-3 font-mono text-xs">
              <span className={p.connected ? "text-openbrain" : "text-zinc-600"}>
                {p.connected ? "●" : "○"}
              </span>
              <span className="text-zinc-300">{p.displayName}</span>
              {f && (
                <span style={{ color: f.accentColor }} className="uppercase">
                  {f.shortName}
                </span>
              )}
              <span className="text-zinc-600">
                {p.sessionId === state.ownerSessionId ? "host" : p.role}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
