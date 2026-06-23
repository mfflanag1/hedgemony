import type { ResourceMeta, TrackMeta } from "../types/resources.js";

export const RESOURCES: Record<ResourceMeta["kind"], ResourceMeta> = {
  K: { kind: "K", name: "Capital", longName: "Capital (money)", cap: null },
  C: { kind: "C", name: "Compute", longName: "Compute (OOMs)", cap: null },
  T: { kind: "T", name: "Talent", longName: "Talent (researchers, thousands)", cap: 50 },
  E: { kind: "E", name: "Energy", longName: "Energy (GW)", cap: null },
  A: { kind: "A", name: "Alignment", longName: "Alignment Reserve", cap: 10 },
  P: { kind: "P", name: "Trust", longName: "Public Trust", cap: 10 },
};

export const TRACKS: Record<TrackMeta["id"], TrackMeta> = {
  CL: { id: "CL", name: "Capability", longName: "Capability Level", min: 0, max: 8 },
  M: { id: "M", name: "Misalignment", longName: "Misalignment Risk", min: 0, max: 10 },
  X: { id: "X", name: "Tension", longName: "International Tension", min: 0, max: 10 },
  ET: { id: "ET", name: "Econ Transform", longName: "Economic Transformation", min: 0, max: 10 },
};
