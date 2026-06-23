"use client";

import { useState } from "react";
import { FACTIONS } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { StateSnapshot, FactionSnapshot } from "@/lib/useGameRoom";

type Send = (type: string, payload?: unknown) => void;

/**
 * Faction-unique lever panel. Rendered below the Dossier. Surfaces the
 * signature moves each faction has access to that aren't part of the
 * generic card/phase flow.
 */
export function FactionLevers({
  state,
  myFaction,
  send,
}: {
  state: StateSnapshot;
  myFaction: FactionSnapshot;
  send: Send;
}) {
  const id = myFaction.id as FactionId;
  switch (id) {
    case "Hegemon":
      return <HegemonLevers state={state} myFaction={myFaction} send={send} />;
    case "Coalition":
      return <CoalitionLevers state={state} myFaction={myFaction} send={send} />;
    case "Cartel":
      return <CartelLevers state={state} myFaction={myFaction} send={send} />;
    case "Successor":
      return <SuccessorLevers state={state} myFaction={myFaction} send={send} />;
    default:
      return null;
  }
}

// ---------- Successor ----------

function SuccessorLevers({
  state,
  myFaction,
  send,
}: {
  state: StateSnapshot;
  myFaction: FactionSnapshot;
  send: Send;
}) {
  const [confirming, setConfirming] = useState(false);
  const disclosed = myFaction.nationalizedBy === "self-disclosed";
  if (!state.successorActive) return null;

  return (
    <aside className="bg-bg-panel border border-successor rounded-sm p-3 mt-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        singular option
      </p>
      <button
        disabled={disclosed}
        onClick={() => setConfirming(true)}
        className={`w-full text-left border rounded-sm p-2.5 transition-colors ${
          disclosed
            ? "border-zinc-700 opacity-50"
            : "border-successor hover:bg-successor/10"
        }`}
      >
        <div className="font-sans text-sm font-semibold text-successor">
          Honest Disclosure
        </div>
        <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
          reveal your true objectives · you lose · humanity survives
        </div>
        {disclosed && (
          <div className="font-mono text-[10px] text-zinc-500 mt-1">
            ✓ already disclosed
          </div>
        )}
      </button>
      {confirming && (
        <ConfirmModal
          title="Honest Disclosure?"
          body={
            "You are about to voluntarily reveal your true objectives to all factions. " +
            "The global Misalignment Risk resets to 0. International Tension drops by 2. " +
            "You forfeit all victory conditions — every human faction gets a chance to win. " +
            "This action cannot be undone."
          }
          confirmLabel="Disclose"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            send("honest-disclosure");
            setConfirming(false);
          }}
        />
      )}
    </aside>
  );
}

// ---------- Hegemon ----------

function HegemonLevers({
  state,
  myFaction,
  send,
}: {
  state: StateSnapshot;
  myFaction: FactionSnapshot;
  send: Send;
}) {
  const [confirming, setConfirming] = useState(false);
  const canAfford = myFaction.resources.K >= 8 && myFaction.resources.P >= 3;
  const used = state.dpaInvoked;

  return (
    <aside className="bg-bg-panel border border-bg-line rounded-sm p-3 mt-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Break glass
      </p>
      <button
        disabled={used || !canAfford}
        onClick={() => setConfirming(true)}
        className={`w-full text-left border rounded-sm p-2.5 transition-colors ${
          used
            ? "border-zinc-700 opacity-50"
            : canAfford
              ? "border-hegemon hover:bg-hegemon/10"
              : "border-bg-line opacity-50 cursor-not-allowed"
        }`}
      >
        <div className="font-sans text-sm font-semibold text-hegemon">
          Invoke Defense Production Act
        </div>
        <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
          cost 8 K + 3 P · one-time · irreversible
        </div>
        {used && (
          <div className="font-mono text-[10px] text-zinc-500 mt-1">✓ already invoked</div>
        )}
        {!used && !canAfford && (
          <div className="font-mono text-[10px] text-deepcent mt-1">
            insufficient resources
          </div>
        )}
      </button>
      {confirming && (
        <ConfirmModal
          title="Invoke DPA?"
          body="Nationalizes OpenBrain. ~30% of OpenBrain's talent resigns on the news. One-time, irreversible. Cost: 8 K + 3 P."
          confirmLabel="Invoke"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            send("invoke-dpa");
            setConfirming(false);
          }}
        />
      )}
    </aside>
  );
}

// ---------- Coalition ----------

function CoalitionLevers({
  state,
  myFaction,
  send,
}: {
  state: StateSnapshot;
  myFaction: FactionSnapshot;
  send: Send;
}) {
  const [targeting, setTargeting] = useState(false);
  const canAfford = myFaction.resources.K >= 5;
  const used = state.whistleblowerPlayed;

  return (
    <aside className="bg-bg-panel border border-bg-line rounded-sm p-3 mt-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        single-use
      </p>
      <button
        disabled={used || !canAfford}
        onClick={() => setTargeting(true)}
        className={`w-full text-left border rounded-sm p-2.5 transition-colors ${
          used
            ? "border-zinc-700 opacity-50"
            : canAfford
              ? "border-coalition hover:bg-coalition/10"
              : "border-bg-line opacity-50 cursor-not-allowed"
        }`}
      >
        <div className="font-sans text-sm font-semibold text-coalition">
          Play Whistleblower
        </div>
        <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
          cost 5 K · reveals target lab's M · one-time
        </div>
        {used && (
          <div className="font-mono text-[10px] text-zinc-500 mt-1">✓ already played</div>
        )}
      </button>
      {targeting && (
        <ConfirmModal
          title="Play Whistleblower?"
          body="Publishes the Whistleblower memo. Target lab's current Misalignment Risk is revealed to all factions. Target P −3. X +1. One-time, irreversible."
          confirmLabel="Target OpenBrain"
          cancelLabel="Cancel"
          secondaryAction={{
            label: "Target DeepCent",
            onClick: () => {
              send("play-whistleblower", { targetFaction: "DeepCent" });
              setTargeting(false);
            },
          }}
          onCancel={() => setTargeting(false)}
          onConfirm={() => {
            send("play-whistleblower", { targetFaction: "OpenBrain" });
            setTargeting(false);
          }}
        />
      )}
    </aside>
  );
}

// ---------- Cartel ----------

function CartelLevers({
  state,
  myFaction,
  send,
}: {
  state: StateSnapshot;
  myFaction: FactionSnapshot;
  send: Send;
}) {
  const [showAllocate, setShowAllocate] = useState(false);
  const inPhase4 = state.phase === 4;
  return (
    <aside className="bg-bg-panel border border-bg-line rounded-sm p-3 mt-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        Compute Allocation
      </p>
      <button
        disabled={!inPhase4}
        onClick={() => setShowAllocate(true)}
        className={`w-full text-left border rounded-sm p-2.5 transition-colors ${
          inPhase4
            ? "border-cartel hover:bg-cartel/10"
            : "border-bg-line opacity-50 cursor-not-allowed"
        }`}
      >
        <div className="font-sans text-sm font-semibold text-cartel">
          Allocate Compute to Factions
        </div>
        <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
          Phase 4 only · pool {myFaction.resources.C} C
        </div>
        {!inPhase4 && (
          <div className="font-mono text-[10px] text-zinc-500 mt-1">
            available during Phase 4 (Coalition Pressure)
          </div>
        )}
      </button>
      {showAllocate && (
        <AllocateComputeModal
          state={state}
          available={myFaction.resources.C}
          onCancel={() => setShowAllocate(false)}
          onConfirm={(allocations) => {
            send("allocate-compute", { allocations });
            setShowAllocate(false);
          }}
        />
      )}
    </aside>
  );
}

function AllocateComputeModal({
  state,
  available,
  onCancel,
  onConfirm,
}: {
  state: StateSnapshot;
  available: number;
  onCancel: () => void;
  onConfirm: (allocations: Partial<Record<FactionId, number>>) => void;
}) {
  const recipients: FactionId[] = ["OpenBrain", "DeepCent"];
  if (state.successorActive) recipients.push("Successor");

  const [allocs, setAllocs] = useState<Record<FactionId, number>>(() => {
    const init: Record<string, number> = {};
    for (const f of recipients) init[f] = 0;
    return init as Record<FactionId, number>;
  });

  const total = Object.values(allocs).reduce((a, b) => a + (b ?? 0), 0);
  const remaining = available - total;
  const ok = total >= 0 && total <= available;

  const setAlloc = (f: FactionId, v: number) => {
    setAllocs((prev) => ({ ...prev, [f]: Math.max(0, Math.floor(v)) }));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
      <div className="bg-bg-panel border border-cartel rounded-sm max-w-md w-full p-5 m-4">
        <p className="font-mono text-xs uppercase tracking-widest text-cartel mb-1">
          ALLOCATE COMPUTE · PHASE 4
        </p>
        <p className="font-sans text-sm text-zinc-400 mb-4">
          Distribute up to {available} C from the Cartel pool. Remaining: {" "}
          <span className={remaining < 0 ? "text-deepcent" : "text-zinc-200"}>{remaining}</span>
        </p>

        <div className="space-y-3 mb-4">
          {recipients.map((f) => (
            <div key={f}>
              <div className="flex items-baseline justify-between mb-1">
                <span
                  className="font-mono text-[10px] uppercase"
                  style={{ color: FACTIONS[f].accentColor }}
                >
                  {FACTIONS[f].displayName}
                </span>
                <span className="font-mono text-sm text-zinc-200">{allocs[f] ?? 0} C</span>
              </div>
              <input
                type="range"
                min={0}
                max={available}
                value={allocs[f] ?? 0}
                onChange={(e) => setAlloc(f, parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-bg-line text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            disabled={!ok || total === 0}
            onClick={() => onConfirm(allocs)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-cartel text-cartel hover:bg-cartel hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Allocate →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- shared confirm modal ----------

function ConfirmModal({
  title,
  body,
  confirmLabel,
  cancelLabel,
  secondaryAction,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
      <div className="bg-bg-panel border border-openbrain rounded-sm max-w-md w-full p-5 m-4">
        <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-1">{title}</p>
        <p className="font-sans text-sm text-zinc-300 leading-snug mb-4">{body}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-bg-line text-zinc-400 hover:text-zinc-200"
          >
            {cancelLabel ?? "Cancel"}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-bg-line text-zinc-300 hover:bg-bg-card"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-openbrain text-openbrain hover:bg-openbrain hover:text-bg-base transition-colors"
          >
            {confirmLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
