/**
 * 8-phase state machine for a Hedgemony turn.
 *
 * Phase progression is server-authoritative. When all seated players have
 * confirmed, the current phase's exit hook runs, phase advances, and the new
 * phase's enter hook runs.
 *
 * Auto-phases (5, 6, 7): logic runs on enter; players still confirm to advance.
 */
import type { FactionId } from "@hedgemony/shared";
import { TOTAL_TURNS, PHASES } from "@hedgemony/shared";
import type { HedgemonyState } from "../schema/state";
import { SeededRng } from "./rng";
import { applyTurnIncome } from "./income";
import { resolveFrontierPushes } from "./frontierPush";
import { runAlignmentCheck } from "./alignmentCheck";
import { drawTo, HAND_REFILL_SIZE } from "./deckBuilder";
import { resolveEndgame } from "./scoring";
import { suspendConsolidation } from "./consolidation";

export interface PhaseEvents {
  onEnter: Array<{ message: string; actor?: FactionId | "system"; eventType: string; data?: Record<string, unknown> }>;
  onExit: Array<{ message: string; actor?: FactionId | "system"; eventType: string; data?: Record<string, unknown> }>;
}

export interface AdvancePhaseResult {
  newTurn: number;
  newPhase: number;
  enteredPhaseEvents: PhaseEvents["onEnter"];
  exitedPhaseEvents: PhaseEvents["onExit"];
  gameEnded: boolean;
}

/**
 * Which factions must confirm to advance this phase. MVP: all seated players
 * must confirm (we don't yet filter by active-factions-per-phase).
 */
export function requiredConfirmers(state: HedgemonyState): FactionId[] {
  const ids: FactionId[] = [];
  state.participants.forEach((p) => {
    if (p.role === "player" && p.factionId) {
      ids.push(p.factionId as FactionId);
    }
  });
  return ids;
}

export function allReady(state: HedgemonyState): boolean {
  const required = requiredConfirmers(state);
  if (required.length === 0) return false;
  for (const id of required) {
    const f = state.factions.get(id);
    if (!f || !f.ready) return false;
  }
  return true;
}

export function advancePhase(state: HedgemonyState, rng: SeededRng): AdvancePhaseResult {
  const exitedEvents = runOnExit(state, rng);

  // Clear ready flags
  state.factions.forEach((f) => {
    f.ready = false;
  });

  // Advance position
  let gameEnded = false;
  if (state.phase < 8) {
    state.phase += 1;
  } else {
    // End of turn
    if (state.turn < TOTAL_TURNS) {
      state.turn += 1;
      state.phase = 1;
      // Intelligence Briefing signals are turn-scoped — clear them so each
      // turn's signals start fresh.
      state.factions.forEach((f) => {
        f.signaledCardIds.length = 0;
      });
      // A consolidation's suspension lasts one turn; clear it so the lab can
      // resume next turn (the build is delayed, not cancelled).
      if (state.consolidation.faction) state.consolidation.suspended = false;
    } else {
      state.status = "ended";
      gameEnded = true;
      // Score the game: populate state.winners + state.regime.
      resolveEndgame(state);
    }
  }

  const enteredEvents = gameEnded ? [] : runOnEnter(state, rng);

  return {
    newTurn: state.turn,
    newPhase: state.phase,
    enteredPhaseEvents: enteredEvents,
    exitedPhaseEvents: exitedEvents,
    gameEnded,
  };
}

function runOnExit(state: HedgemonyState, _rng: SeededRng): PhaseEvents["onExit"] {
  const events: PhaseEvents["onExit"] = [];
  const currentPhase = state.phase;

  if (currentPhase === 2) {
    // Resolve Frontier Pushes
    const results = resolveFrontierPushes(state);
    for (const r of results) {
      if (r.accepted) {
        events.push({
          actor: r.faction,
          eventType: "frontier-push",
          message: `${r.faction} advanced CL ${r.oldCL} → ${r.newCL} (M ${r.mDelta >= 0 ? "+" : ""}${r.mDelta})`,
          data: { ...r },
        });
      } else {
        events.push({
          actor: r.faction,
          eventType: "frontier-push-failed",
          message: `${r.faction} Frontier Push failed: ${r.reason}`,
          data: { ...r },
        });
      }
    }
  }

  return events;
}

function runOnEnter(state: HedgemonyState, rng: SeededRng): PhaseEvents["onEnter"] {
  const events: PhaseEvents["onEnter"] = [];
  const meta = PHASES.find((p) => p.id === state.phase);
  if (meta) {
    events.push({
      actor: "system",
      eventType: "phase-enter",
      message: `— Phase ${state.phase}: ${meta.name} —`,
    });
  }

  if (state.phase === 6) {
    // Resource Income
    const applied = applyTurnIncome(state);
    events.push({
      actor: "system",
      eventType: "income",
      message: `Per-turn income applied to ${applied.length} factions`,
      data: { applied },
    });
  }

  if (state.phase === 7) {
    // Alignment Check (only if CL ≥ 3)
    const outcome = runAlignmentCheck(state, rng);
    // Snapshot the RNG counter for audit/replay. Counter ticks on every
    // SeededRng.next() call, so it accurately reflects all consumption
    // (alignment rolls, shuffles, future card-effect rolls).
    state.rollCounter = rng.getCounter();
    let msg: string;
    switch (outcome.kind) {
      case "skipped":
        msg = `Alignment Check skipped: ${outcome.reason}`;
        break;
      case "no-incident":
        msg = `Alignment Check: rolled ${outcome.roll} vs M=${state.tracks.M}. No incident.`;
        break;
      case "warning-shot":
        msg = `Alignment Check: rolled ${outcome.roll} = M. Warning shot. P −1 global, Coalition +1 A.`;
        break;
      case "capability-scandal":
        msg = `Alignment Check: rolled ${outcome.roll} vs M=${state.tracks.M}. Capability scandal — ${outcome.frontierLab} P−1, A−1.`;
        break;
      case "misalignment-confirmed":
        msg = outcome.autoActivateSuccessor
          ? `Alignment Check: rolled ${outcome.roll}. MISALIGNMENT CONFIRMED — Successor ACTIVATES from ${outcome.frontierLab}.`
          : `Alignment Check: rolled ${outcome.roll}. Misalignment confirmed — ${outcome.frontierLab} suppressed with 5 A.`;
        break;
    }
    events.push({
      actor: "system",
      eventType: "alignment-check",
      message: msg,
      data: { outcome },
    });

    // A Misalignment Incident auto-suspends any in-progress Consolidation.
    if (outcome.kind === "misalignment-confirmed" && state.consolidation.faction) {
      const r = suspendConsolidation(state, "Misalignment Incident");
      if (r.ok) {
        events.push({ actor: "system", eventType: "consolidation-suspended", message: r.event });
      }
    }
  }

  if (state.phase === 8) {
    // End-of-turn housekeeping: draw cards to hand-size, reshuffling discard
    // into the deck if the deck is short. Without the reshuffle, faction decks
    // (~20 action cards) drain over a 16-turn game and the lab plays the
    // back half card-less.
    const reshuffles: FactionId[] = [];
    state.factions.forEach((f, key) => {
      const id = key as FactionId;
      const targetSize = HAND_REFILL_SIZE[id] ?? 0;
      if (targetSize === 0) return;
      const hand: string[] = [];
      f.handCardIds.forEach((s) => hand.push(s));
      let deck: string[] = [];
      f.deckCardIds.forEach((s) => deck.push(s));

      const need = Math.max(0, targetSize - hand.length);
      if (need > deck.length && f.discardCardIds.length > 0) {
        // Reshuffle: append shuffled discard to remaining deck, clear discard
        const discard: string[] = [];
        f.discardCardIds.forEach((s) => discard.push(s));
        const shuffled = rng.shuffle(discard);
        deck = [...deck, ...shuffled];
        f.discardCardIds.length = 0;
        reshuffles.push(id);
      }

      const { hand: newHand, deck: newDeck, drawn } = drawTo(hand, deck, targetSize);
      if (drawn.length > 0 || reshuffles.includes(id)) {
        f.handCardIds.length = 0;
        for (const c of newHand) f.handCardIds.push(c);
        f.deckCardIds.length = 0;
        for (const c of newDeck) f.deckCardIds.push(c);
      }
    });
    events.push({
      actor: "system",
      eventType: "turn-housekeeping",
      message: reshuffles.length > 0
        ? `Hands refilled. Discard reshuffled into deck for: ${reshuffles.join(", ")}.`
        : `Hands refilled.`,
    });

    // Age out turn-limited persistent effects. remainingTurns === 0 means
    // permanent (or consumption-based, e.g. push modifiers) — leave those be.
    state.factions.forEach((f) => {
      for (let i = f.activeEffects.length - 1; i >= 0; i--) {
        const e = f.activeEffects[i];
        if (e && e.remainingTurns > 0) {
          e.remainingTurns -= 1;
          if (e.remainingTurns === 0) f.activeEffects.splice(i, 1);
        }
      }
    });
  }

  return events;
}
