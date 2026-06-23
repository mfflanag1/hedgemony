"use client";

import { useState } from "react";
import { FACTIONS, PHASES, turnToQuarter } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { StateSnapshot } from "@/lib/useGameRoom";
import { Tracks } from "./Tracks";
import { Dossier } from "./Dossier";
import { CapabilityLadder } from "./CapabilityLadder";
import { ActionLog } from "./ActionLog";
import { DiceLog } from "./DiceLog";
import { Hand } from "./Hand";
import { FrontierPushModal } from "./FrontierPushModal";
import { Press } from "./Press";
import { FactionLevers } from "./FactionLevers";
import { SignalPanel } from "./SignalPanel";
import { ConsolidationPanel } from "./ConsolidationPanel";

export function GameView({
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
  const myFactionId = (me?.factionId || "") as FactionId;
  const myFaction = myFactionId ? state.factions[myFactionId] : null;
  const phaseMeta = PHASES.find((p) => p.id === state.phase);

  const [showFrontierModal, setShowFrontierModal] = useState(false);

  if (!me || !myFaction) {
    return <SpectatorView state={state} send={send} />;
  }

  const isLab = myFactionId === "OpenBrain" || myFactionId === "DeepCent" || (state.successorActive && myFactionId === "Successor");
  const canSignal =
    state.phase === 1 &&
    state.status === "active" &&
    (myFactionId === "DeepCent" || myFactionId === "Politburo");
  // CL 8 is reached only via Capability Consolidation (Phase 5 of roadmap).
  // Until that mechanic is implemented, a lab at CL 7 can't Frontier Push.
  const canFrontierPush =
    state.phase === 2 &&
    isLab &&
    !myFaction.frontierPushCommit.committed &&
    myFaction.capabilityLevel < 7;

  return (
    <main className="min-h-screen flex flex-col">
      {/* TOP BAR */}
      <header className="border-b border-bg-line bg-bg-panel px-6 py-3">
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-4">
            <h1 className="font-serif text-lg">
              <span className="text-openbrain">HEDGEMONY:</span> Takeoff
            </h1>
            <span className="font-mono text-xs text-zinc-500">
              Turn {state.turn}/16 · {turnToQuarter(state.turn)}
            </span>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-openbrain">
              Phase {state.phase}: {phaseMeta?.name ?? "?"}
            </p>
            <p className="font-mono text-[10px] text-zinc-500">
              {phaseMeta?.description}
            </p>
          </div>
        </div>
        <Tracks values={state.tracks} />
      </header>

      {state.status === "paused" && (
        <div className="px-6 py-2 bg-openbrain/10 border-b border-openbrain/30 flex items-center justify-between">
          <p className="font-mono text-xs text-openbrain">
            ⏸ GAME PAUSED — White Cell can resume. All actions are blocked.
          </p>
          <p className="font-mono text-[10px] text-zinc-500">
            press / chat remains available
          </p>
        </div>
      )}

      {state.status === "ended" && <EndgameBanner state={state} />}

      {error && (
        <div className="px-6 py-2 bg-deepcent/10 border-b border-deepcent/30">
          <p className="font-mono text-xs text-deepcent">⚠ {error}</p>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-12 gap-0">
        <section className="col-span-3 border-r border-bg-line p-4 flex flex-col gap-3 overflow-y-auto">
          <Dossier faction={myFaction} />
          {canFrontierPush && (
            <button
              onClick={() => setShowFrontierModal(true)}
              className="font-mono text-xs uppercase tracking-wider border border-openbrain text-openbrain px-4 py-3 rounded-sm hover:bg-openbrain hover:text-bg-base transition-colors"
            >
              → Commit Frontier Push
            </button>
          )}
          {state.phase === 2 && isLab && myFaction.frontierPushCommit.committed && (
            <div className="border border-openbrain/50 bg-openbrain/10 rounded-sm px-3 py-2">
              <p className="font-mono text-xs text-openbrain">✓ Frontier Push committed (hidden)</p>
              <p className="font-mono text-[10px] text-zinc-400 mt-1">
                resolves when all labs commit
              </p>
            </div>
          )}
          {canSignal && <SignalPanel myFaction={myFaction} send={send} />}
          <ConsolidationPanel state={state} myFactionId={myFactionId} myFaction={myFaction} send={send} />
          <FactionLevers state={state} myFaction={myFaction} send={send} />
        </section>

        <section className="col-span-6 p-4 flex flex-col gap-3">
          <CapabilityLadder state={state} />
          <ActionLog log={state.log} />
          <DiceLog dice={state.dice} />
        </section>

        <section className="col-span-3 border-l border-bg-line p-4">
          <Press state={state} myFactionId={myFactionId} send={send} />
        </section>
      </div>

      {/* ACTION BAR */}
      <footer className="border-t border-bg-line bg-bg-panel">
        <Hand
          cardIdKeys={Array.from(myFaction.handCardIds)}
          onPlay={(key) => send("play-card", { cardIdKey: key })}
          myFaction={myFactionId}
          myResources={myFaction.resources}
        />
        <div className="px-4 py-2 border-t border-bg-line flex items-center justify-between">
          <p className="font-mono text-xs text-zinc-500">
            {phaseReadinessSummary(state)}
          </p>
          <div className="flex gap-2">
            {myFaction.ready ? (
              <button
                disabled={state.status !== "active"}
                onClick={() => send("unconfirm-phase")}
                className="font-mono text-xs uppercase tracking-wider border border-zinc-600 text-zinc-300 px-4 py-2 rounded-sm hover:bg-bg-card disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Unconfirm
              </button>
            ) : (
              <button
                disabled={state.status !== "active"}
                onClick={() => send("confirm-phase")}
                className="font-mono text-xs uppercase tracking-wider border border-openbrain text-openbrain px-6 py-2 rounded-sm hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Phase →
              </button>
            )}
          </div>
        </div>
      </footer>

      {showFrontierModal && (
        <FrontierPushModal
          faction={myFaction}
          currentCL={myFaction.capabilityLevel}
          onCommit={(spend) => {
            send("frontier-push", {
              spendK: spend.K,
              spendC: spend.C,
              spendT: spend.T,
              spendA: spend.A,
              targetCL: spend.targetCL,
            });
            setShowFrontierModal(false);
          }}
          onClose={() => setShowFrontierModal(false)}
        />
      )}
    </main>
  );
}

const REGIME_INFO: Record<string, { label: string; blurb: string }> = {
  singleton: { label: "Singleton", blurb: "One actor consolidated decisive capability. All others lose." },
  hegemonic: { label: "Hegemonic", blurb: "A US-side lab leads the frontier with risk contained." },
  bipolar: { label: "Bipolar Stability", blurb: "Two poles reach high capability; tension stays contained." },
  multipolar: { label: "Multipolar / Treaty", blurb: "Misalignment held low; capability checked by coordination." },
  failed: { label: "Failed State", blurb: "Runaway risk and tension; no faction achieved its goals." },
  unresolved: { label: "Unresolved", blurb: "Outcome pending adjudication." },
};

function EndgameBanner({ state }: { state: StateSnapshot }) {
  const info = REGIME_INFO[state.regime] ?? REGIME_INFO.unresolved!;
  const winners = state.winners ?? [];
  return (
    <div className="px-6 py-3 bg-successor/10 border-b border-successor/30">
      <p className="font-mono text-xs uppercase tracking-widest text-successor">
        ▰ Game Ended — Governance Regime: {info.label}
      </p>
      <p className="font-mono text-[11px] text-zinc-400 mt-1">{info.blurb}</p>
      <p className="font-mono text-xs mt-2">
        <span className="text-zinc-500 uppercase tracking-wider">Winner(s): </span>
        {winners.length > 0 ? (
          winners.map((w, i) => {
            const meta = FACTIONS[w as FactionId];
            return (
              <span key={w} style={{ color: meta?.accentColor }}>
                {meta?.displayName ?? w}
                {i < winners.length - 1 ? ", " : ""}
              </span>
            );
          })
        ) : (
          <span className="text-zinc-400">none — all factions fell short</span>
        )}
      </p>
    </div>
  );
}

function SpectatorView({
  state,
  send,
}: {
  state: StateSnapshot;
  send: (type: string, payload?: unknown) => void;
}) {
  // Once the Successor activates, an unclaimed seat can be taken by a spectator.
  const successorClaimed = Object.values(state.participants).some(
    (p) => p.factionId === "Successor"
  );
  const canTakeSuccessor =
    state.status === "active" && state.successorActive && !successorClaimed;

  return (
    <main className="min-h-screen p-8">
      <header className="mb-6 border-b border-bg-line pb-3">
        <h1 className="font-serif text-2xl">Hedgemony: Takeoff — spectating</h1>
        <p className="font-mono text-xs text-zinc-500 mt-1">
          Turn {state.turn}/16 · Phase {state.phase}
        </p>
      </header>
      {canTakeSuccessor && (
        <div className="mb-6 border border-successor/50 bg-successor/5 rounded-sm px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-successor">
              The Successor has activated
            </p>
            <p className="font-mono text-[11px] text-zinc-400 mt-1">
              The seat is unclaimed — take control to play the misaligned AI.
            </p>
          </div>
          <button
            onClick={() => send("claim-faction", { factionId: "Successor" })}
            className="font-mono text-xs uppercase tracking-wider border border-successor text-successor px-4 py-2 rounded-sm hover:bg-successor hover:text-bg-base transition-colors"
          >
            → Take Successor seat
          </button>
        </div>
      )}
      <Tracks values={state.tracks} />
      <div className="mt-6 grid grid-cols-2 gap-4">
        <CapabilityLadder state={state} />
        <ActionLog log={state.log} />
      </div>
    </main>
  );
}

function phaseReadinessSummary(state: StateSnapshot): string {
  const seated = Object.values(state.participants).filter(
    (p) => p.role === "player" && p.factionId
  );
  const ready = seated.filter((p) => state.factions[p.factionId]?.ready).length;
  return `${ready} / ${seated.length} factions confirmed · advances when all ready`;
}
