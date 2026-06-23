/**
 * Original RAND Hedgemony (TL301) — types & default-scenario constants.
 *
 * Separate from the Takeoff types on purpose: this is a mechanically distinct
 * game (Force Factors, Influence Points, AOR map, 5-phase turn). LOCAL STUDY USE
 * ONLY — see ORIGINAL/NOTICE.md. Data transcribed from rulebook Tables A.1/A.2.
 */

// ---------- factions ----------

export const CLASSIC_FACTION_IDS = ["US", "NATO_EU", "RU", "PRC", "DPRK", "IR"] as const;
export type ClassicFactionId = (typeof CLASSIC_FACTION_IDS)[number];

export type ClassicSide = "blue" | "red";

export interface ClassicFactionMeta {
  id: ClassicFactionId;
  name: string;
  side: ClassicSide;
  accentColor: string;
  /** Only the U.S. tracks Readiness. */
  tracksReadiness: boolean;
  /** Red factions play from constrained, signaled decks; Blue is free-play. */
  cardConstrained: boolean;
}

export const CLASSIC_FACTIONS: Record<ClassicFactionId, ClassicFactionMeta> = {
  US:      { id: "US",      name: "United States", side: "blue", accentColor: "#3b82f6", tracksReadiness: true,  cardConstrained: false },
  NATO_EU: { id: "NATO_EU", name: "NATO / EU",     side: "blue", accentColor: "#22d3ee", tracksReadiness: false, cardConstrained: false },
  RU:      { id: "RU",      name: "Russia",        side: "red",  accentColor: "#ef4444", tracksReadiness: false, cardConstrained: true },
  PRC:     { id: "PRC",     name: "China",         side: "red",  accentColor: "#f59e0b", tracksReadiness: false, cardConstrained: true },
  DPRK:    { id: "DPRK",    name: "North Korea",   side: "red",  accentColor: "#a855f7", tracksReadiness: false, cardConstrained: true },
  IR:      { id: "IR",      name: "Iran",          side: "red",  accentColor: "#10b981", tracksReadiness: false, cardConstrained: true },
};

export const CLASSIC_FACTION_ORDER: ClassicFactionId[] = [
  "US", "NATO_EU", "RU", "PRC", "DPRK", "IR",
];

// ---------- AORs ----------

export const CLASSIC_AOR_IDS = [
  "NORTHCOM", "EUCOM", "CENTCOM", "INDOPACOM", "SOUTHCOM", "AFRICOM",
] as const;
export type ClassicAorId = (typeof CLASSIC_AOR_IDS)[number];

export const CLASSIC_AOR_NAMES: Record<ClassicAorId, string> = {
  NORTHCOM: "U.S. Northern Command",
  EUCOM: "U.S. European Command",
  CENTCOM: "U.S. Central Command",
  INDOPACOM: "U.S. Indo-Pacific Command",
  SOUTHCOM: "U.S. Southern Command",
  AFRICOM: "U.S. Africa Command",
};

// ---------- critical capabilities ----------

export const CLASSIC_CAPABILITIES = ["LRF", "C4ISR", "IAMD_BMD", "SOF", "Nuclear"] as const;
export type ClassicCapability = (typeof CLASSIC_CAPABILITIES)[number];

// ---------- phases ----------

export interface ClassicPhaseMeta { id: number; name: string; shortName: string }

export const CLASSIC_PHASES: ClassicPhaseMeta[] = [
  { id: 1, name: "Red Signaling", shortName: "Signal" },
  { id: 2, name: "Blue Investments & Actions", shortName: "Blue" },
  { id: 3, name: "Red Investments & Actions", shortName: "Red" },
  { id: 4, name: "Annual Resources Allocation", shortName: "Income" },
  { id: 5, name: "State-of-the-World Summary", shortName: "Summary" },
];

export const CLASSIC_TOTAL_TURNS = 16;

// ---------- runtime state shapes (plain types; engine schema mirrors these) ----------

export interface ClassicForce {
  factionId: ClassicFactionId;
  count: number;
  modLevel: number;
}

export interface ClassicFactionTrackers {
  rp: number;
  ip: number;
  techLevel: number;
  modLevels: Partial<Record<ClassicCapability, number>>;
  /** U.S. only; undefined for others. */
  readiness?: number;
}

// ---------- cards (only the rulebook's sample cards; full decks are boxed-only) ----------

export type ClassicCardType = "action" | "investment" | "domestic-event" | "international-event";

export type ClassicEffectTarget = "self" | ClassicFactionId;

export type ClassicCardEffect =
  | {
      op: "tracker";
      target: ClassicEffectTarget;
      field: "rp" | "ip" | "techLevel" | "readiness";
      delta: number;
    }
  | {
      op: "set-tracker";
      target: ClassicEffectTarget;
      field: "rp" | "ip" | "techLevel" | "readiness";
      value: number;
    }
  | {
      op: "mod-level";
      target: ClassicEffectTarget;
      capability: ClassicCapability;
      delta?: number;
      value?: number;
    }
  | {
      op: "force";
      action: "place" | "remove";
      aor: ClassicAorId;
      faction?: ClassicEffectTarget;
      count: number;
      modLevel: number;
    }
  | {
      op: "roll";
      sides?: 6 | 10;
      label?: string;
      modifier?: number;
    }
  | {
      op: "note";
      text: string;
    };

export interface ClassicCard {
  /** e.g. "PRC-01", "EVT-CON-01" */
  id: string;
  type: ClassicCardType;
  /** Owning player; undefined for international events (White-Cell-controlled). */
  faction?: ClassicFactionId;
  title: string;
  /** RP cost to play (player cards). */
  costRp?: number;
  /** How it's adjudicated, e.g. "RT B" or "Roll D10". */
  resolution?: string;
  /** Public outcome vs. private (default public if omitted). */
  isPublic?: boolean;
  /** AOR an event is tied to. */
  aor?: ClassicAorId;
  /** Adjudication body / outcome text the White Cell applies. */
  text: string;
  /** Optional structured operations the engine can apply automatically. */
  effects?: ClassicCardEffect[];
  /** Optional browser-public path for photographed card faces. */
  imagePath?: string;
  /** Source sheet/photo filename used to create the digital card. */
  sourcePhoto?: string;
  /** Raw OCR draft extracted from the photographed card face. */
  ocrText?: string;
  /** Whether the text has been checked against the card image. */
  transcriptionStatus?: "photo-only" | "ocr-draft" | "verified";
}

// ---------- default scenario (rulebook Tables A.1 / A.2) ----------

export interface ClassicStartingFaction {
  forceSize: number;
  techLevel: number;
  rp: number;
  perTurnRp: number;
  ip: number;
  modLevels: Partial<Record<ClassicCapability, number>>;
  readiness?: number;
}

export interface ClassicLaydownEntry {
  aor: ClassicAorId;
  subArea?: string;
  factionId: ClassicFactionId;
  count: number;
  modLevel: number;
}

export interface ClassicScenario {
  name: string;
  totalTurns: number;
  starting: Record<ClassicFactionId, ClassicStartingFaction>;
  laydown: ClassicLaydownEntry[];
  victoryConditions: Record<ClassicFactionId, string>;
}

export const CLASSIC_DEFAULT_SCENARIO: ClassicScenario = {
  name: "Default Scenario (RAND TL301)",
  totalTurns: CLASSIC_TOTAL_TURNS,
  starting: {
    US:      { forceSize: 20, techLevel: 4, rp: 40, perTurnRp: 30, ip: 50, modLevels: { C4ISR: 3, IAMD_BMD: 3, SOF: 3 }, readiness: 3 },
    NATO_EU: { forceSize: 5,  techLevel: 4, rp: 10, perTurnRp: 5,  ip: 50, modLevels: { C4ISR: 3, IAMD_BMD: 3 } },
    RU:      { forceSize: 9,  techLevel: 4, rp: 15, perTurnRp: 5,  ip: 30, modLevels: { LRF: 4, C4ISR: 4 } },
    PRC:     { forceSize: 15, techLevel: 4, rp: 15, perTurnRp: 4,  ip: 40, modLevels: { LRF: 4, C4ISR: 3 } },
    DPRK:    { forceSize: 10, techLevel: 1, rp: 5,  perTurnRp: 3,  ip: 5,  modLevels: { LRF: 1, Nuclear: 0 } },
    IR:      { forceSize: 5,  techLevel: 2, rp: 8,  perTurnRp: 4,  ip: 5,  modLevels: { LRF: 2, SOF: 1 } },
  },
  laydown: [
    { aor: "NORTHCOM",  subArea: "CONUS",       factionId: "US",   count: 14, modLevel: 3 },
    { aor: "INDOPACOM", subArea: "PRC",         factionId: "US",   count: 1,  modLevel: 3 },
    { aor: "INDOPACOM", subArea: "PRC",         factionId: "PRC",  count: 5,  modLevel: 1 },
    { aor: "INDOPACOM", subArea: "PRC",         factionId: "PRC",  count: 5,  modLevel: 2 },
    { aor: "INDOPACOM", subArea: "PRC",         factionId: "PRC",  count: 5,  modLevel: 3 },
    { aor: "INDOPACOM", subArea: "DPRK",        factionId: "US",   count: 2,  modLevel: 3 },
    { aor: "INDOPACOM", subArea: "DPRK",        factionId: "DPRK", count: 10, modLevel: 1 },
    { aor: "CENTCOM",   subArea: "Iran",        factionId: "IR",   count: 5,  modLevel: 2 },
    { aor: "CENTCOM",   subArea: "Afghanistan", factionId: "US",   count: 1,  modLevel: 3 },
    { aor: "CENTCOM",   subArea: "Iraq",        factionId: "US",   count: 1,  modLevel: 3 },
    { aor: "EUCOM",     subArea: "RU border",   factionId: "US",   count: 1,  modLevel: 3 },
    { aor: "EUCOM",     subArea: "RU border",   factionId: "NATO_EU", count: 5, modLevel: 3 },
    { aor: "EUCOM",     subArea: "RU border",   factionId: "RU",   count: 5,  modLevel: 2 },
    { aor: "EUCOM",     subArea: "RU border",   factionId: "RU",   count: 4,  modLevel: 3 },
  ],
  victoryConditions: {
    US:      "IPs greater than every other player's, and DPRK does not win.",
    NATO_EU: "IPs greater than Russia's, and Russia does not win.",
    RU:      "IPs ≥ (U.S. IPs − 5).",
    PRC:     "IPs ≥ (U.S. IPs − 3), and DPRK neither wins nor loses.",
    DPRK:    "IPs > 15, or the U.S. leaves the Korean Peninsula. Loses if IPs = 0.",
    IR:      "IPs > 20.",
  },
};
