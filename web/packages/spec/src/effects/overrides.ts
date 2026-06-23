import type { CardEffectOp } from "@hedgemony/shared";

/**
 * Hand-maintained structured effects for the mechanically-simple cards.
 *
 * The card markdown is freeform prose, so the parser can't reliably derive
 * executable effects (see HEDGEMONY_RESEARCH.md / the plan). This table is the
 * "hybrid dispatcher" override: it encodes the cards whose *modeled* mechanical
 * effect is fully and unambiguously captured by resource/track/persistent ops.
 *
 * Deliberately conservative — a card is listed ONLY when its spec captures every
 * modeled effect (pure flavor, relationship shifts, and unmodeled subsystems
 * such as node income or vote weights are intentionally omitted). Cards that
 * need a chosen target, a die-branch, or an unmodeled subsystem as their primary
 * effect are left out entirely and remain White-Cell-adjudicated.
 *
 * Keys are the catalog composite key, `"<type>:<id>"` (e.g. "action:T06").
 * Extend over time; the engine applies whatever is here and logs the rest.
 */
export const EFFECT_OVERRIDES: Record<string, CardEffectOp[]> = {
  // --- action cards ---
  // T06: "Hegemon and OpenBrain each gain +3 T immediately."
  "action:T06": [
    { op: "resource", target: "Hegemon", delta: { T: 3 } },
    { op: "resource", target: "OpenBrain", delta: { T: 3 } },
  ],
  // F07: non-DeepCent Chinese labs forfeit C/T to DeepCent (+12 C, +8 T); P −1.
  "action:F07": [
    { op: "resource", target: "DeepCent", delta: { C: 12, T: 8 } },
    { op: "resource", target: "self", delta: { P: -1 } },
  ],
  // P02: "OpenBrain loses 4 T. Coalition gains 4 T. OpenBrain P −2."
  "action:P02": [
    { op: "resource", target: "OpenBrain", delta: { T: -4, P: -2 } },
    { op: "resource", target: "Coalition", delta: { T: 4 } },
  ],
  // P09: "M +1 ... P −1 to Hegemon" (pause-vote effect is unmodeled).
  "action:P09": [
    { op: "track", track: "M", delta: 1 },
    { op: "resource", target: "Hegemon", delta: { P: -1 } },
  ],
  // P10: "Lab P +2" (M +0.5 rounds to 0; relationship is flavor).
  "action:P10": [{ op: "resource", target: "self", delta: { P: 2 } }],
  // S01: "All factions +1 A" (the optional 2A→−1M conversion is a later choice).
  "action:S01": [{ op: "resource", target: "all", delta: { A: 1 } }],
  // S03: "P +1" (Coalition relationship flavor; Successor clause is conditional).
  "action:S03": [{ op: "resource", target: "self", delta: { P: 1 } }],
  // S04: "Reduce M by 1 globally" (push-spend clause is a persistent conditional).
  "action:S04": [{ op: "track", track: "M", delta: -1 }],
  // F03: "Effective C +25% on next Frontier Push" — held until the next push
  // consumes it (resolveFrontierPushes), so no turn duration.
  "action:F03": [
    {
      op: "persistent",
      description: "+25% effective Compute on next Frontier Push",
    },
  ],
  // X02: "Successor gains +2 effective T (parallel instances)."
  "action:X02": [{ op: "resource", target: "Successor", delta: { T: 2 } }],
};
