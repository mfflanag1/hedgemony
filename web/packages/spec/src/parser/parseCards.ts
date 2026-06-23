import { readFile } from "node:fs/promises";
import type { Card, CardCategory, CardType, CardEffect } from "@hedgemony/shared";
import {
  extractFactions,
  extractCost,
  extractBuildTime,
  stripEmphasis,
} from "./tokenize.js";

/**
 * One card-type markdown file → list of parsed Card objects.
 *
 * Expected structure per card:
 *
 *   ## F01: Card Name
 *   - **Faction:** OpenBrain, DeepCent
 *   - **Cost:** 6 K + 12 C
 *   - **Effect:** ...
 *   - **Flavor:** *"..."*
 *
 * Sections are introduced by `# Category (N cards)`. We use the most recent
 * section header to assign category to subsequent cards.
 */

export interface ParseOptions {
  cardType: CardType;
  /** Map from section-header text → CardCategory. Header is matched by prefix. */
  categoryMap: Array<{ prefix: string; category: CardCategory }>;
  /** Default category if no header matches */
  defaultCategory: CardCategory;
  sourcePath: string;
}

export interface ParseResult {
  cards: Card[];
  warnings: string[];
}

const CARD_HEADING_RE = /^##\s+([A-Z]+\d+):\s+(.+?)\s*$/;
const SECTION_HEADING_RE = /^#\s+(.+?)(?:\s+\(\d+\s+cards?\))?\s*$/;
const FIELD_LINE_RE = /^-\s+\*\*([^*]+?):\*\*\s*(.*)$/;
const CONT_LINE_RE = /^\s{2,}(.+)$/; // continuation indented under a field

export async function parseCardFile(opts: ParseOptions): Promise<ParseResult> {
  const raw = await readFile(opts.sourcePath, "utf8");
  const lines = raw.split(/\r?\n/);

  const cards: Card[] = [];
  const warnings: string[] = [];
  let currentCategory: CardCategory = opts.defaultCategory;
  let pending: PartialCard | null = null;
  let collecting: string | null = null; // field name currently being extended
  let rawLines: string[] = [];

  const commit = () => {
    if (!pending) return;
    try {
      cards.push(finalizeCard(pending, rawLines.join("\n"), opts.cardType, currentCategory));
    } catch (e) {
      warnings.push(`[${opts.sourcePath}] card ${pending.id}: ${(e as Error).message}`);
    }
    pending = null;
    rawLines = [];
    collecting = null;
  };

  for (const line of lines) {
    // Section header — resets category
    const sec = SECTION_HEADING_RE.exec(line);
    if (sec && line.startsWith("# ") && !line.startsWith("## ")) {
      commit();
      const headerText = sec[1] ?? "";
      const match = opts.categoryMap.find(m => headerText.startsWith(m.prefix));
      currentCategory = match?.category ?? opts.defaultCategory;
      continue;
    }

    // Card heading — starts a new card
    const head = CARD_HEADING_RE.exec(line);
    if (head) {
      commit();
      const id = head[1] ?? "";
      const name = head[2] ?? "";
      pending = { id, name, fields: {} };
      rawLines.push(line);
      continue;
    }

    if (!pending) continue;
    rawLines.push(line);

    // Field line
    const fieldMatch = FIELD_LINE_RE.exec(line);
    if (fieldMatch) {
      const name = (fieldMatch[1] ?? "").trim();
      const value = (fieldMatch[2] ?? "").trim();
      pending.fields[name] = value;
      collecting = name;
      continue;
    }

    // Continuation of previous field
    const cont = CONT_LINE_RE.exec(line);
    if (cont && collecting) {
      const existing = pending.fields[collecting] ?? "";
      const add = (cont[1] ?? "").trim();
      pending.fields[collecting] = existing ? `${existing} ${add}` : add;
      continue;
    }

    // Blockquote flavor text (`> *"..."*`) — attach to Flavor if not yet set
    if (line.startsWith(">")) {
      const text = line.slice(1).trim();
      if (!pending.fields["Flavor"]) {
        pending.fields["Flavor"] = text;
      } else {
        pending.fields["Flavor"] += " " + text;
      }
    }

    // Blank line between cards is fine; doesn't end the card. Card ends only
    // on next heading or section header.
  }

  commit();

  return { cards, warnings };
}

interface PartialCard {
  id: string;
  name: string;
  fields: Record<string, string>;
}

function finalizeCard(
  p: PartialCard,
  rawMarkdown: string,
  type: CardType,
  category: CardCategory
): Card {
  const f = p.fields;
  const factionText = f["Faction"] ?? f["Factions"] ?? "";
  const costText = f["Cost"] ?? "";
  const effectText = f["Effect"] ?? "";
  const riskText = f["Risk"] ?? "";
  const flavorRaw = f["Flavor"] ?? "";
  const buildTimeText = f["Build Time"] ?? f["BuildTime"] ?? "";
  const durationText = f["Duration"] ?? "";
  const triggerText = f["Trigger"] ?? ""; // event cards use Trigger instead of Faction

  const effect: CardEffect = {
    raw: effectText,
    spec: [], // structured parse deferred to later phase
  };

  const factions = extractFactions(factionText || triggerText);
  const cost = extractCost(costText);
  const buildTime = extractBuildTime(buildTimeText) ?? extractBuildTime(durationText);

  const singleUse =
    /\bsingle[-\s]use\b/i.test(rawMarkdown) ||
    /\bone[-\s]time\b/i.test(rawMarkdown) ||
    /\bonce\s+per\s+game\b/i.test(rawMarkdown);

  const card: Card = {
    id: p.id,
    type,
    category,
    name: p.name,
    factions,
    cost,
    effect,
    rawMarkdown,
  };
  if (buildTime !== undefined) card.buildTime = buildTime;
  if (riskText) card.risk = riskText;
  if (flavorRaw) card.flavor = stripEmphasis(flavorRaw).replace(/^"|"$/g, "").trim();
  if (singleUse) card.singleUse = true;
  return card;
}
