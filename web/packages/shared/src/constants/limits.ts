/**
 * Operational limits. Extracted from scattered literals so balance tweaks
 * happen in one place.
 */

/** How long an empty lobby room stays alive before disposing (ms). */
export const IDLE_DISPOSE_MS = 60_000;

/** Max log entries retained in room state. Older entries are silently dropped. */
export const LOG_CAP = 500;

/** Max dice-roll records retained in room state. Older entries are dropped. */
export const DICE_CAP = 200;

/** Resource caps. K, C, E are intentionally uncapped. */
export const RESOURCE_CAPS = {
  T: 50,
  A: 10,
  P: 10,
} as const;

/** Capability Consolidation (CL 8 Singleton) — per 00_SCENARIO_OVERVIEW.md. */
export const CONSOLIDATION_START_TURN = 13; // earliest turn a CL-7 lab may initiate
export const CONSOLIDATION_TURNS = 3; // uninterrupted turns of progress required
export const CONSOLIDATION_COST = { C: 30, K: 20 } as const; // spent each progress turn

/** Default per-error display TTL on the client (ms). */
export const ERROR_TTL_MS = 5_000;

/** Max number of recent errors kept in the client's error stack. */
export const ERROR_STACK_MAX = 5;
