import type { PhaseMeta } from "../types/phase.js";

export const PHASES: PhaseMeta[] = [
  {
    id: 1,
    name: "Intelligence Briefing",
    shortName: "Intel",
    activeFactions: "red-signaling",
    description: "DeepCent + Politburo signal up to 3 cards each. Coalition reveals 1 advocacy card.",
  },
  {
    id: 2,
    name: "Frontier Push",
    shortName: "Push",
    activeFactions: "labs",
    description: "Each lab privately commits Compute / Talent / Capital. Simultaneous reveal.",
  },
  {
    id: 3,
    name: "State Action",
    shortName: "State",
    activeFactions: "states",
    description: "Hegemon and Politburo play Action / Investment cards.",
  },
  {
    id: 4,
    name: "Coalition Pressure",
    shortName: "Coalition",
    activeFactions: "coalition-cartel",
    description: "Coalition plays cards. Cartel makes Compute allocation decisions.",
  },
  {
    id: 5,
    name: "Adjudication",
    shortName: "Adjudicate",
    activeFactions: "white-cell",
    description: "White Cell resolves theft, crises, kinetics, public-trust shifts. Draw 1 Int'l + 1 Domestic event.",
  },
  {
    id: 6,
    name: "Resource Income",
    shortName: "Income",
    activeFactions: "all",
    description: "All factions collect K, C from controlled nodes, T, E per their income tables.",
  },
  {
    id: 7,
    name: "Alignment Check",
    shortName: "Alignment",
    activeFactions: "white-cell",
    description: "If frontier CL ≥ 3: roll 1d10 vs M. Apply consequences. Successor activates if conditions met.",
  },
  {
    id: 8,
    name: "State of the Race",
    shortName: "Status",
    activeFactions: "all",
    description: "Update all global tracks. Check victory. Advance turn marker. Draw cards.",
  },
];
