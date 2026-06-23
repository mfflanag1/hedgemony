/**
 * Press (negotiation) system.
 *
 * Every pair of seated factions has an implicit bilateral thread; it's
 * created on demand the first time either side sends a message. Coalition
 * threads are explicitly created with a chosen set of participants (≥ 2).
 */
import { ArraySchema } from "@colyseus/schema";
import type { FactionId } from "@hedgemony/shared";
import {
  ThreadSchema,
  NegotiationMessageSchema,
  type HedgemonyState,
} from "../schema/state";

let msgCounter = 0;

/** Canonical bilateral thread id for an unordered pair of factions. */
export function bilateralThreadId(a: FactionId, b: FactionId): string {
  const [x, y] = [a, b].sort();
  return `bilateral:${x}:${y}`;
}

export function getOrCreateBilateralThread(
  state: HedgemonyState,
  a: FactionId,
  b: FactionId
): ThreadSchema {
  const id = bilateralThreadId(a, b);
  const existing = state.threads.get(id);
  if (existing) return existing;
  const t = new ThreadSchema();
  t.id = id;
  t.kind = "bilateral";
  t.name = "";
  t.participantFactionIds = [a, b].sort().join(" ");
  t.createdAt = new Date().toISOString();
  state.threads.set(id, t);
  return t;
}

export function createCoalitionThread(
  state: HedgemonyState,
  creator: FactionId,
  participants: FactionId[],
  name: string
): { thread: ThreadSchema | null; error?: string } {
  const uniq = Array.from(new Set(participants));
  if (!uniq.includes(creator)) uniq.push(creator);
  if (uniq.length < 2) return { thread: null, error: "coalition thread needs ≥ 2 participants" };
  const id = `coalition:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const t = new ThreadSchema();
  t.id = id;
  t.kind = "coalition";
  t.name = name.trim() || `coalition (${uniq.join(", ")})`;
  t.participantFactionIds = uniq.sort().join(" ");
  t.createdAt = new Date().toISOString();
  state.threads.set(id, t);
  return { thread: t };
}

export function isParticipant(thread: ThreadSchema, faction: FactionId): boolean {
  return thread.participantFactionIds.split(" ").includes(faction);
}

export function appendMessage(
  thread: ThreadSchema,
  senderFaction: FactionId,
  body: string
): NegotiationMessageSchema {
  const m = new NegotiationMessageSchema();
  m.id = `m${Date.now().toString(36)}-${(msgCounter++).toString(36)}`;
  m.threadId = thread.id;
  m.senderFactionId = senderFaction;
  m.body = body.slice(0, 2000); // cap message length
  m.createdAt = new Date().toISOString();
  m.readByFactions = senderFaction; // sender has "read" their own message
  thread.messages.push(m);
  // Cap thread history at 200 messages per thread to keep state bounded
  while (thread.messages.length > 200) thread.messages.shift();
  return m;
}

export function markRead(thread: ThreadSchema, faction: FactionId): number {
  let changed = 0;
  thread.messages.forEach((m) => {
    const current = new Set(m.readByFactions.split(" ").filter(Boolean));
    if (!current.has(faction)) {
      current.add(faction);
      m.readByFactions = Array.from(current).join(" ");
      changed++;
    }
  });
  return changed;
}

/**
 * Pre-create bilateral threads between all currently-seated player factions.
 * Called at game start so the UI can show every pair as available without a
 * lazy "first message" handshake.
 */
export function bootstrapBilateralThreads(
  state: HedgemonyState,
  factions: FactionId[]
): void {
  for (let i = 0; i < factions.length; i++) {
    for (let j = i + 1; j < factions.length; j++) {
      const a = factions[i] as FactionId;
      const b = factions[j] as FactionId;
      getOrCreateBilateralThread(state, a, b);
    }
  }
}

// Re-export ArraySchema for convenience (used by callers constructing state)
export { ArraySchema };
