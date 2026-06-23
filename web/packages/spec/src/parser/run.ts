import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Card, CardCatalog, CardCategory } from "@hedgemony/shared";
import { parseCardFile } from "./parseCards.js";
import { EFFECT_OVERRIDES } from "../effects/overrides.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Absolute path to the spec source markdown directory
const SPEC_DIR = resolve(__dirname, "../../../../../AI_VARIANT");
const OUT_DIR = resolve(__dirname, "../../dist");

async function main() {
  console.log(`Parsing cards from: ${SPEC_DIR}`);
  console.log(`Output: ${OUT_DIR}/cards.generated.json\n`);

  const actionCategoryMap: Array<{ prefix: string; category: CardCategory }> = [
    { prefix: "Frontier & Capability", category: "frontier" },
    { prefix: "Espionage & Security", category: "espionage" },
    { prefix: "Trade, Export Control", category: "trade" },
    { prefix: "Talent & Public", category: "talent-public" },
    { prefix: "Crisis & Disruption", category: "crisis" },
    { prefix: "Safety & Governance", category: "safety" },
    { prefix: "Cartel & Compute", category: "cartel" },
    { prefix: "Successor-Triggered", category: "successor-triggered" },
  ];

  const investmentCategoryMap: Array<{ prefix: string; category: CardCategory }> = [
    { prefix: "Compute & Energy Infrastructure", category: "infrastructure" },
    { prefix: "R&D Programs", category: "rnd" },
    { prefix: "Talent & Education", category: "talent" },
    { prefix: "Diplomatic & Treaty", category: "diplomacy" },
    { prefix: "Strategic Reserves", category: "reserve" },
    { prefix: "Faction Moonshots", category: "moonshot" },
  ];

  const eventCategoryMap: Array<{ prefix: string; category: CardCategory }> = [
    { prefix: "International Events", category: "international-event" },
    { prefix: "Consolidation Phase Events", category: "consolidation-international" },
    { prefix: "Domestic Events", category: "domestic-event" },
    { prefix: "Capability Events", category: "capability-event" },
    { prefix: "Crisis Events", category: "crisis-event" },
    { prefix: "Wild Cards", category: "wild-event" },
  ];

  const [actions, investments, events] = await Promise.all([
    parseCardFile({
      cardType: "action",
      categoryMap: actionCategoryMap,
      defaultCategory: "frontier",
      sourcePath: resolve(SPEC_DIR, "02_ACTION_CARDS.md"),
    }),
    parseCardFile({
      cardType: "investment",
      categoryMap: investmentCategoryMap,
      defaultCategory: "infrastructure",
      sourcePath: resolve(SPEC_DIR, "03_INVESTMENT_CARDS.md"),
    }),
    parseCardFile({
      cardType: "event",
      categoryMap: eventCategoryMap,
      defaultCategory: "international-event",
      sourcePath: resolve(SPEC_DIR, "04_EVENT_CARDS.md"),
    }),
  ]);

  for (const w of [...actions.warnings, ...investments.warnings, ...events.warnings]) {
    console.warn(`  ⚠  ${w}`);
  }

  const byId: Record<string, Card> = {};
  const register = (type: string, c: Card) => {
    const key = `${type}:${c.id}`;
    // Merge hand-maintained structured effects for the simple cards. Mutating
    // the card object also updates the per-type arrays (same references).
    const override = EFFECT_OVERRIDES[key];
    if (override) c.effect.spec = override;
    byId[key] = c;
  };
  for (const c of actions.cards) register("action", c);
  for (const c of investments.cards) register("investment", c);
  for (const c of events.cards) register("event", c);
  const specCount = Object.values(byId).filter((c) => c.effect.spec.length > 0).length;

  const catalog: CardCatalog = {
    action: actions.cards,
    investment: investments.cards,
    event: events.cards,
    byId,
    generatedAt: new Date().toISOString(),
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    resolve(OUT_DIR, "cards.generated.json"),
    JSON.stringify(catalog, null, 2),
    "utf8"
  );

  console.log(`\n  action cards:     ${actions.cards.length}`);
  console.log(`  investment cards: ${investments.cards.length}`);
  console.log(`  event cards:      ${events.cards.length}`);
  console.log(`  total:            ${actions.cards.length + investments.cards.length + events.cards.length}`);
  console.log(`  with structured effects: ${specCount}`);
  console.log(`\n  wrote ${OUT_DIR}/cards.generated.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
