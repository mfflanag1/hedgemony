export const FACTION_IDS = [
  "OpenBrain",
  "DeepCent",
  "Hegemon",
  "Politburo",
  "Cartel",
  "Coalition",
  "Successor",
] as const;

export type FactionId = (typeof FACTION_IDS)[number];

export type FactionCategory = "lab" | "state" | "wildcard" | "movement" | "emergent";

export interface FactionMeta {
  id: FactionId;
  displayName: string;
  shortName: string;
  category: FactionCategory;
  accentColor: string;    // hex
  oneLineGoal: string;
  activatesMidGame: boolean;
}
