import type { FactionId } from "@hedgemony/shared";
import { FACTION_IDS } from "@hedgemony/shared";
import type { ResourceKind } from "@hedgemony/shared";
import { RESOURCE_KINDS } from "@hedgemony/shared";
import type { CardCost } from "@hedgemony/shared";

/**
 * Tokenize a free-text field into a best-effort list of faction ids.
 * Handles phrases like "Any", "Any lab", "Any faction", "OpenBrain, DeepCent",
 * "OpenBrain + Hegemon (joint)", "Coalition (EU), Politburo".
 *
 * Returns [] if no faction detected (caller falls back to "any").
 *
 * Precedence:
 *   1. "Any lab" → [OpenBrain, DeepCent]
 *   2. "Any faction" / "Any" (bare, e.g. "Faction: Any") → all 7 factions
 *   3. Named factions (matched by alias regex)
 *
 * We avoid matching a bare "any" inside effect or risk text (e.g. "reduce any
 * opponent's C") by preferring "any faction" explicitly; the bare-"any"
 * fallback still exists for short card headers like "Faction: Any" but is
 * deliberately scoped to not match inside compound phrases like "any lab"
 * (already handled above), "any state", "any target", etc.
 */
export function extractFactions(raw: string): FactionId[] {
  const text = raw.toLowerCase();
  if (/\bany\s+lab\b/.test(text)) return ["OpenBrain", "DeepCent"];
  if (/\bany\s+faction\b/.test(text)) return [...FACTION_IDS] as FactionId[];
  // Bare "any" accepted only if it isn't followed by a noun that would change
  // its meaning. This covers "Faction: Any" headers while leaving effect text
  // like "any opponent" or "any target" alone.
  if (/\bany\b(?!\s+(lab|state|target|opponent|faction|player|other))/.test(text)) {
    return [...FACTION_IDS] as FactionId[];
  }
  const found = new Set<FactionId>();
  const aliases: Array<[RegExp, FactionId]> = [
    [/\bopenbrain\b/, "OpenBrain"],
    [/\bdeepcent\b/, "DeepCent"],
    [/\bhegemon(?:\s+\(us\))?\b/, "Hegemon"],
    [/\bus(?:\s+government)?\b|\bunited states\b/, "Hegemon"],
    [/\bpolitburo\b/, "Politburo"],
    [/\bchina\b|\bprc\b/, "Politburo"],
    [/\bcartel\b|\bcompute\s+cartel\b/, "Cartel"],
    [/\bcoalition\b/, "Coalition"],
    [/\bsuccessor\b/, "Successor"],
  ];
  for (const [re, id] of aliases) {
    if (re.test(text)) found.add(id);
  }
  return Array.from(found);
}

/**
 * Parse a cost string like "6 K + 12 C + 3 T" into a CardCost object.
 * Tolerant of noise ("(single-use)", "one-time"), prefixes ("2 K/turn"),
 * and misses (returns empty CardCost for purely-text costs like "0 K").
 *
 * Build-phase cost ("2 K/turn during build") is captured separately by the
 * field parser, not here.
 */
export function extractCost(raw: string): CardCost {
  const cost: CardCost = {};
  // Match "<num> <KIND>" pairs. KIND is a single letter from RESOURCE_KINDS.
  // Negative numbers supported for gain-cost cards. Spaces tolerated.
  const pattern = /(-?\d+)\s*([KCTEAP])(?!\w)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    const numStr = match[1];
    const kindStr = match[2];
    if (numStr === undefined || kindStr === undefined) continue;
    const n = parseInt(numStr, 10);
    const kind = kindStr as ResourceKind;
    if (!RESOURCE_KINDS.includes(kind)) continue;
    cost[kind] = (cost[kind] ?? 0) + n;
  }
  return cost;
}

/** Extract "N turns" → integer. Returns undefined if not found. */
export function extractBuildTime(raw: string): number | undefined {
  const m = raw.match(/(\d+)\s+turns?/i);
  if (!m || m[1] === undefined) return undefined;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Strip markdown emphasis markers: *foo*, **foo**, _foo_ → foo */
export function stripEmphasis(s: string): string {
  return s
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/___([^_]+)___/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1");
}
