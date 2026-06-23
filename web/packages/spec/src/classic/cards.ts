/**
 * The six SAMPLE cards printed in the RAND TL301 rulebook (Figures 7.1–7.6).
 * These are the only original-Hedgemony cards reproduced — the full decks are
 * boxed-game components. LOCAL STUDY USE ONLY — see ORIGINAL/NOTICE.md.
 *
 * Hand-authored (no parser) since there are only six.
 */
import type { ClassicCard } from "@hedgemony/shared";

export const CLASSIC_SAMPLE_CARDS: ClassicCard[] = [
  {
    id: "PRC-01",
    type: "action",
    faction: "PRC",
    title: "Gray Zone Pressure on INDOPACOM: non-U.S. ally",
    costRp: 3,
    resolution: "RT B",
    aor: "INDOPACOM",
    text:
      "Critical Capabilities: None. Outcome (PRC IP / US IP): PRC major +3/−2, " +
      "PRC minor +2/−1, status quo 0/0, US minor −1/+1, US major −2/+2. If unopposed: " +
      "US −1 IP and PRC resolves on the Red-Advantage column. Side effect: PRC −2 on all " +
      "regional economic-development die rolls for 1 turn. May play every turn.",
  },
  {
    id: "PRC-17",
    type: "action",
    faction: "PRC",
    title: "Silk Road Economic Belt",
    costRp: 3,
    resolution: "Roll D10",
    text:
      "Attempt to partner with Russia. Roll D10: 0–4 no change; 5–7 minor success " +
      "(PRC +1 IP & +1 RP, US −1 IP); 8–9 major success (PRC +2 IP & +2 RP, US −2 IP). " +
      "May play every turn.",
  },
  {
    id: "PRC-22",
    type: "investment",
    faction: "PRC",
    title: "SCS Expansion: Reclaim and occupy another SCS island",
    costRp: 4,
    resolution: "Roll D10",
    isPublic: true,
    aor: "INDOPACOM",
    text:
      "Roll D10: 0 no change; 1–7 completed in two turns (+1 IP); 8–9 completed in " +
      "three turns (+1 IP). May play every turn. Public.",
  },
  {
    id: "EVT-PRC-02",
    type: "domestic-event",
    faction: "PRC",
    title: "Research Failure (LRF)",
    text:
      "Rocket-motor test problems delay China's next-gen LRF program. Cannot upgrade " +
      "LRF for two turns. Visibility: roll D10 — 0–3 Private, 4–9 Public.",
  },
  {
    id: "EVT-PRC-08",
    type: "domestic-event",
    faction: "PRC",
    title: "Research Success (C4ISR)",
    text:
      "Space-research progress aids a C4ISR upgrade: C4ISR upgrade cost reduced by 2 RP " +
      "on next attempt. If private, remains private until the modernization public/private " +
      "die roll it is applied to. Visibility: roll D10 — 0–3 Private, 4–9 Public.",
  },
  {
    id: "EVT-CON-01",
    type: "international-event",
    title: "Finding Kony",
    resolution: "Roll D10",
    isPublic: true,
    aor: "AFRICOM",
    text:
      "Kony returns; the LRA renews attacks across CAR, Uganda, and the DRC. Players " +
      "involved: US. The US may spend up to 4 RP to support Ugandan forces: roll D10 each " +
      "turn for four turns or until Kony is found — 0–8 unsuccessful; ≥9 Kony found, US +2 IP. " +
      "US gets +1 die-roll modifier for each RP spent beyond the first. If the US does not " +
      "spend at least 1 RP: US −1 IP. Public.",
  },
];

export const CLASSIC_SAMPLE_CARDS_BY_ID: Record<string, ClassicCard> = Object.fromEntries(
  CLASSIC_SAMPLE_CARDS.map((c) => [c.id, c])
);
