export const RESOURCE_KINDS = ["K", "C", "T", "E", "A", "P"] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export interface ResourceMeta {
  kind: ResourceKind;
  name: string;
  longName: string;
  cap: number | null; // null = uncapped
}

export type ResourceBag = Record<ResourceKind, number>;

export const TRACK_IDS = ["CL", "M", "X", "ET"] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export interface TrackMeta {
  id: TrackId;
  name: string;
  longName: string;
  min: number;
  max: number;
}

export type TrackState = Record<TrackId, number>;
