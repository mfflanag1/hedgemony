import { LOG_CAP } from "@hedgemony/shared";
import type { ArraySchema } from "@colyseus/schema";
import { LogEntrySchema } from "../schema/state";

export interface LogInput {
  actor?: string;
  eventType: string;
  message: string;
  visibility?: string; // space-separated faction ids or "all"
}

/** Minimal shape both Takeoff and Classic states satisfy. */
interface Loggable {
  turn: number;
  phase: number;
  log: ArraySchema<LogEntrySchema>;
}

let counter = 0;

export function pushLog(state: Loggable, input: LogInput) {
  const entry = new LogEntrySchema();
  entry.id = `l${Date.now().toString(36)}-${counter++}`;
  entry.turn = state.turn;
  entry.phase = state.phase;
  entry.actor = input.actor ?? "system";
  entry.eventType = input.eventType;
  entry.message = input.message;
  entry.visibility = input.visibility ?? "all";
  entry.createdAt = new Date().toISOString();
  state.log.push(entry);
  // Cap log to keep state payload manageable. Silently drops oldest; a
  // pedagogical-grade AAR would instead sink old entries to a persistent
  // store, but that's a Phase-4 deliverable.
  while (state.log.length > LOG_CAP) state.log.shift();
}
