/**
 * Sanity-check the parsed card catalog. Run with: pnpm --filter @hedgemony/spec test
 *
 * Verifies:
 *  - Known cards parse with expected fields (spot checks)
 *  - All cards have at least name + id + effect.raw
 *  - ID prefixes match declared categories
 *  - Total counts in an expected range
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Card, CardCatalog } from "@hedgemony/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CATALOG_PATH = resolve(__dirname, "../generated/cards.generated.json");

async function main() {
  const raw = await readFile(CATALOG_PATH, "utf8");
  const catalog = JSON.parse(raw) as CardCatalog;

  let fails = 0;
  const assert = (cond: unknown, msg: string) => {
    if (!cond) {
      console.error(`  FAIL: ${msg}`);
      fails++;
    }
  };
  const assertEq = <T,>(actual: T, expected: T, label: string) => {
    if (actual !== expected) {
      console.error(`  FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      fails++;
    }
  };

  const total = catalog.action.length + catalog.investment.length + catalog.event.length;
  console.log(`\nCatalog loaded. Total cards: ${total}`);
  console.log(`  action:     ${catalog.action.length}`);
  console.log(`  investment: ${catalog.investment.length}`);
  console.log(`  event:      ${catalog.event.length}`);

  // Total count in ballpark (not exact to tolerate doc drift)
  assert(total >= 120 && total <= 220, `total ${total} outside expected 120..220`);

  // Every card has id + name + effect.raw
  const allCards: Card[] = [
    ...catalog.action,
    ...catalog.investment,
    ...catalog.event,
  ];
  for (const c of allCards) {
    assert(c.id.length > 0, `card missing id`);
    assert(c.name.length > 0, `card ${c.id} missing name`);
    assert(c.effect.raw.length > 0, `card ${c.id} missing effect text`);
  }

  // Spot check: F01 Crash Training Run
  const f01 = catalog.action.find(c => c.id === "F01");
  assert(f01, "[F01 spot-check] 'Crash Training Run' missing from action catalog");
  if (f01) {
    assert(f01.name.includes("Crash Training"), `[F01] name — expected contains 'Crash Training', got '${f01.name}'`);
    assert(f01.factions.includes("OpenBrain"), `[F01] factions — expected includes OpenBrain, got [${f01.factions.join(", ")}]`);
    assert(f01.factions.includes("DeepCent"), `[F01] factions — expected includes DeepCent, got [${f01.factions.join(", ")}]`);
    assertEq(f01.cost.K, 6, "[F01] cost.K");
    assertEq(f01.cost.C, 12, "[F01] cost.C");
    assertEq(f01.cost.T, 3, "[F01] cost.T");
    assertEq(f01.category, "frontier", "[F01] category");
  }

  // Spot check: E10 Whistleblower (single-use)
  const e10 = catalog.action.find(c => c.id === "E10");
  assert(e10, "[E10 spot-check] 'Whistleblower' missing from action catalog");
  if (e10) {
    assert(e10.name.toLowerCase().includes("whistleblower"), `[E10] name — expected contains 'whistleblower', got '${e10.name}'`);
    assert(e10.factions.includes("Coalition"), `[E10] factions — expected includes Coalition, got [${e10.factions.join(", ")}]`);
    assertEq(e10.singleUse, true, "[E10] singleUse");
  }

  // Spot check: investment M06 Capability Consolidation (Apex)
  const m06 = catalog.investment.find(c => c.id === "M06");
  assert(m06, "[M06 spot-check] 'Capability Consolidation' missing from investment catalog");
  if (m06) {
    assert(m06.name.toLowerCase().includes("consolidation"), `[M06] name — expected contains 'consolidation', got '${m06.name}'`);
    assertEq(m06.buildTime, 3, "[M06] buildTime");
    assertEq(m06.category, "moonshot", "[M06] category");
  }

  // Spot check: event I16 Mass Unemployment Crisis (Consolidation Phase)
  const ev_i16 = catalog.event.find(c => c.id === "I16");
  assert(ev_i16, "[I16 spot-check] 'Mass Unemployment Crisis' missing from event catalog");
  if (ev_i16) {
    assert(
      ev_i16.name.toLowerCase().includes("unemployment"),
      `[I16] name — expected contains 'unemployment', got '${ev_i16.name}'`
    );
    assertEq(ev_i16.category, "consolidation-international", "[I16] category");
  }

  // byId lookup works, and collisions are disambiguated by type prefix
  const byIdInv = catalog.byId["investment:I01"];
  const byIdEvt = catalog.byId["event:I01"];
  assert(byIdInv, "byId investment:I01 missing");
  assert(byIdEvt, "byId event:I01 missing");
  if (byIdInv && byIdEvt) {
    assert(byIdInv.id === "I01" && byIdEvt.id === "I01", "byId ids match");
    assert(byIdInv.name !== byIdEvt.name, "byId I01 disambiguated by type");
  }

  if (fails > 0) {
    console.error(`\n${fails} assertion(s) failed\n`);
    process.exit(1);
  }
  console.log(`\nAll spot checks passed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
