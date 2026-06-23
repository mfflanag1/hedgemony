"use client";

import { useState } from "react";
import { CL_COSTS } from "@hedgemony/shared";
import type { FactionSnapshot } from "@/lib/useGameRoom";

export function FrontierPushModal({
  faction,
  currentCL,
  onCommit,
  onClose,
}: {
  faction: FactionSnapshot;
  currentCL: number;
  onCommit: (spend: { K: number; C: number; T: number; A: number; targetCL: number }) => void;
  onClose: () => void;
}) {
  // Hooks first (unconditionally) — then the CL-7 case short-circuits below.
  // Clamp the initial targetCL to a valid range even if currentCL is already
  // at or above 7 so React doesn't see an invalid slider state on first pass.
  const [targetCL, setTargetCL] = useState(Math.max(currentCL + 1, Math.min(7, currentCL + 1)));
  const [extraA, setExtraA] = useState(0);

  // Defensive: GameView gates the Frontier Push button on capabilityLevel < 7
  // but if this modal somehow opens at CL 7, show an informational banner
  // rather than a degenerate slider (min=8, max=7).
  if (currentCL >= 7) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
        <div className="bg-bg-panel border border-openbrain rounded-sm max-w-md w-full p-6 m-4">
          <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-2">
            FRONTIER CAPPED · CL {currentCL}
          </p>
          <p className="font-sans text-sm text-zinc-300 leading-snug mb-4">
            You are at the top of the Race Phase ladder. Further advancement
            (CL 8 · Singleton) requires Capability Consolidation — a 3-turn
            investment that ships in the Consolidation Phase of the roadmap.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-sm border border-bg-line text-zinc-400 hover:text-zinc-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compute required costs from currentCL+1 to targetCL
  const required = accumulateRequired(currentCL, targetCL);

  const spendK = required.K;
  const spendC = required.C;
  const spendT = required.T;
  const spendA = extraA;

  const r = faction.resources;
  const affordable =
    r.K >= spendK && r.C >= spendC && r.T >= spendT && r.A >= spendA;

  const clGained = Math.max(0, targetCL - currentCL);
  const aPerCL = clGained > 0 ? spendA / clGained : 0;
  const mRise = aPerCL >= 3 ? 0 : aPerCL >= 1 ? 1 : 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
      <div className="bg-bg-panel border border-openbrain rounded-sm max-w-lg w-full p-6 m-4">
        <div className="border-l-2 border-openbrain pl-3 mb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-openbrain">
            FRONTIER PUSH · PHASE 2
          </p>
          <h2 className="font-serif text-xl mt-1">Commit Capability Investment</h2>
          <p className="font-sans text-xs text-zinc-400 mt-1">
            Hidden until both labs commit. Costs deducted at phase resolution.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Target CL
            </label>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-sm text-zinc-500">{currentCL}</span>
              <input
                type="range"
                min={currentCL + 1}
                max={7}
                value={targetCL}
                onChange={(e) => setTargetCL(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="font-mono text-lg text-openbrain w-8 text-center">
                {targetCL}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 border border-bg-line rounded-sm p-3">
            <ResourceRow label="Capital (K)" have={r.K} need={spendK} />
            <ResourceRow label="Compute (C)" have={r.C} need={spendC} />
            <ResourceRow label="Talent (T)" have={r.T} need={spendT} />
            <ResourceRow label="Alignment (A)" have={r.A} need={spendA} />
          </div>

          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-zinc-400 flex items-baseline justify-between">
              <span>Alignment Spend (optional)</span>
              <span className="text-zinc-500 text-[10px] normal-case tracking-normal">
                {clGained > 0 ? `${aPerCL.toFixed(1)} A per CL gained` : "—"}
              </span>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-xs text-zinc-500">0</span>
              <input
                type="range"
                min={0}
                max={Math.min(r.A, clGained * 6)}
                value={extraA}
                onChange={(e) => setExtraA(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="font-mono text-sm text-zinc-200 w-8 text-center">
                {extraA}
              </span>
            </div>
          </div>

          <div className="border border-bg-line rounded-sm p-3 bg-bg-card">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Projected outcome
            </p>
            <dl className="grid grid-cols-2 gap-y-1 font-mono text-xs">
              <dt className="text-zinc-400">CL advance</dt>
              <dd className="text-openbrain">
                {currentCL} → {targetCL} (+{clGained})
              </dd>
              <dt className="text-zinc-400">Misalignment rise</dt>
              <dd className={mRise > 0 ? "text-deepcent" : "text-zinc-300"}>
                {mRise >= 0 ? "+" : ""}
                {mRise}
              </dd>
              <dt className="text-zinc-400">Affordable</dt>
              <dd className={affordable ? "text-openbrain" : "text-deepcent"}>
                {affordable ? "yes" : "no"}
              </dd>
            </dl>
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <button
              onClick={onClose}
              className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-sm border border-bg-line text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              disabled={!affordable || clGained === 0}
              onClick={() =>
                onCommit({
                  K: spendK,
                  C: spendC,
                  T: spendT,
                  A: spendA,
                  targetCL,
                })
              }
              className="font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-sm border border-openbrain text-openbrain hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Commit (hidden) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceRow({ label, have, need }: { label: string; have: number; need: number }) {
  const ok = have >= need;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-zinc-500">{label}</p>
      <p className={`font-mono text-sm ${ok ? "text-zinc-100" : "text-deepcent"}`}>
        {need} <span className="text-zinc-500">/ {have}</span>
      </p>
    </div>
  );
}

function accumulateRequired(from: number, to: number): { K: number; C: number; T: number } {
  let K = 0,
    C = 0,
    T = 0;
  for (let cl = from + 1; cl <= to; cl++) {
    const cost = CL_COSTS[cl];
    if (!cost) continue;
    K += cost.K;
    C += cost.C;
    if (typeof cost.T === "number") T += cost.T;
  }
  return { K, C, T };
}
