/**
 * Manifest for the photographed RAND TL301 boxed-game components (the user's own
 * photos). Images live in /public/classic-assets/ and are gitignored — LOCAL
 * STUDY USE ONLY (see ORIGINAL/NOTICE.md). Labels are descriptive only.
 *
 * Labels for individually-identified photos are filled in; the rest are grouped
 * generically as card sheets. Edit freely — the filename is always shown.
 */
export type ComponentCategory = "board" | "placemat" | "cards" | "chips";

export interface ComponentImage {
  file: string; // under /classic-assets/
  category: ComponentCategory;
  label: string;
}

const F = (n: number) => `IMG_${n}.jpg`;

export const COMPONENT_IMAGES: ComponentImage[] = [
  // Board / map
  { file: F(6205), category: "board", label: "Game board — Unified Command Plan world map + turn/phase trackers" },

  // Rules & procedures placemats
  { file: F(6164), category: "placemat", label: "Combat Resolution Table A (CRT A)" },
  { file: F(6167), category: "placemat", label: "Resolution Table B (RT B) — noncombat" },
  { file: F(6169), category: "placemat", label: "Combat Factors from Force Factors" },
  { file: F(6163), category: "placemat", label: "Modernization & Procurement Costs" },
  { file: F(6170), category: "placemat", label: "Deployment Costs" },
  { file: F(6168), category: "placemat", label: "U.S. Readiness Costs" },
  { file: F(6165), category: "placemat", label: "Proxy Forces" },
  { file: F(6166), category: "placemat", label: "Proxy Forces (alt)" },

  // Cards — international events
  { file: F(6171), category: "cards", label: "International Event cards" },
  { file: F(6172), category: "cards", label: "International Event cards" },
  { file: F(6173), category: "cards", label: "International Event cards" },
  { file: F(6201), category: "cards", label: "International Event cards" },
  // Cards — domestic events by faction
  { file: F(6177), category: "cards", label: "U.S. — Domestic Event cards" },
  { file: F(6186), category: "cards", label: "DPRK — Domestic Event cards" },
  { file: F(6190), category: "cards", label: "Russia — Domestic Event cards" },
  { file: F(6194), category: "cards", label: "NATO/EU — Domestic Event cards" },
  // Cards — Iran action/investment
  { file: F(6180), category: "cards", label: "Iran — Investment cards" },
  { file: F(6182), category: "cards", label: "Iran — Action cards" },
  // Remaining card sheets (grouped; relabel as desired)
  { file: F(6174), category: "cards", label: "Card sheet" },
  { file: F(6175), category: "cards", label: "Card sheet" },
  { file: F(6176), category: "cards", label: "Card sheet" },
  { file: F(6178), category: "cards", label: "Card sheet" },
  { file: F(6179), category: "cards", label: "Card sheet" },
  { file: F(6181), category: "cards", label: "Card sheet" },
  { file: F(6183), category: "cards", label: "Card sheet" },
  { file: F(6184), category: "cards", label: "Card sheet" },
  { file: F(6185), category: "cards", label: "Card sheet" },
  { file: F(6187), category: "cards", label: "Card sheet" },
  { file: F(6188), category: "cards", label: "Card sheet" },
  { file: F(6189), category: "cards", label: "Card sheet" },
  { file: F(6191), category: "cards", label: "Card sheet" },
  { file: F(6192), category: "cards", label: "Card sheet" },
  { file: F(6193), category: "cards", label: "Card sheet" },
  { file: F(6195), category: "cards", label: "Card sheet" },
  { file: F(6196), category: "cards", label: "Card sheet" },
  { file: F(6197), category: "cards", label: "Card sheet" },
  { file: F(6199), category: "cards", label: "Card sheet" },
  { file: F(6200), category: "cards", label: "Card sheet" },
  { file: F(6202), category: "cards", label: "Card sheet" },

  // Chips & tokens
  { file: F(6198), category: "chips", label: "Force-Factor chip punch sheets (NATO/EU, DPRK, Russia, Proxy)" },
  { file: F(6203), category: "chips", label: "China (PRC) Force-Factor chips" },
  { file: F(6204), category: "chips", label: "U.S. Force-Factor chips" },
];

export const BOARD_IMAGE = F(6205);
export const PLACEMAT_BY_LABEL: Record<string, string> = Object.fromEntries(
  COMPONENT_IMAGES.filter((c) => c.category === "placemat").map((c) => [c.label, c.file])
);

export const CATEGORY_TITLES: Record<ComponentCategory, string> = {
  board: "Board / Map",
  placemat: "Rules & Procedures",
  cards: "Cards",
  chips: "Chips & Tokens",
};
