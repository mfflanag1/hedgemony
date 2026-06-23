"use client";

import { useEffect, useRef, useState } from "react";
import type { Room } from "colyseus.js";
import { ERROR_TTL_MS, ERROR_STACK_MAX } from "@hedgemony/shared";
import { joinGame } from "./colyseus";

/** Plain-JSON snapshot of the Colyseus HedgemonyState. */
export interface StateSnapshot {
  status: string;
  turn: number;
  phase: number;
  tracks: { CL: number; M: number; X: number; ET: number };
  factions: Record<string, FactionSnapshot>;
  participants: Record<string, ParticipantSnapshot>;
  log: LogEntrySnapshot[];
  dice: DiceRollSnapshot[];
  threads: Record<string, ThreadSnapshot>;
  successorActive: boolean;
  consolidation: ConsolidationSnapshot;
  regime: string;
  winners: string[];
  ownerSessionId: string;
  seed: string;
  /** Single-use faction levers — true once invoked/played */
  dpaInvoked: boolean;
  whistleblowerPlayed: boolean;
}

export interface ConsolidationSnapshot {
  faction: string; // "" = none active
  progressTurns: number;
  startedTurn: number;
  lastProgressTurn: number;
  suspended: boolean;
}

export interface ThreadSnapshot {
  id: string;
  kind: string; // "bilateral" | "coalition"
  name: string;
  participantFactionIds: string; // space-separated
  messages: NegotiationMessageSnapshot[];
  createdAt: string;
}

export interface NegotiationMessageSnapshot {
  id: string;
  threadId: string;
  senderFactionId: string;
  body: string;
  createdAt: string;
  readByFactions: string; // space-separated
}

export interface FactionSnapshot {
  id: string;
  resources: { K: number; C: number; T: number; E: number; A: number; P: number };
  capabilityLevel: number;
  handCardIds: string[];
  deckCardIds: string[];
  discardCardIds: string[];
  signaledCardIds: string[];
  activeEffects: Array<{ source: string; description: string; remainingTurns: number }>;
  ready: boolean;
  frontierPushCommit: { committed: boolean; spendK: number; spendC: number; spendT: number; spendA: number; targetCL: number };
  nationalizedBy: string;
}

export interface ParticipantSnapshot {
  sessionId: string;
  displayName: string;
  factionId: string;
  role: string;
  connected: boolean;
}

export interface LogEntrySnapshot {
  id: string;
  turn: number;
  phase: number;
  actor: string;
  eventType: string;
  message: string;
  visibility: string;
  createdAt: string;
}

/** A server-rolled die record; rendered by the DiceLog component. */
export interface DiceRollSnapshot {
  id: string;
  turn: number;
  phase: number;
  rollType: string;
  actor: string;
  dice: number[];
  modifierTotal: number;
  modifierSummary: string;
  result: number;
  visibility: string;
}

export interface RoomError {
  id: string;
  reason: string;
  at: number;
}

function toSnapshot(schema: unknown): StateSnapshot {
  return JSON.parse(JSON.stringify(schema)) as StateSnapshot;
}

export interface UseGameRoomResult {
  room: Room | null;
  state: StateSnapshot | null;
  sessionId: string;
  /** Most recent error (back-compat with existing single-error consumers). */
  error: string | null;
  /** Stack of recent errors with stable ids; UI can render up to N most recent. */
  errors: RoomError[];
  /** Manually dismiss an error from the stack. */
  dismissError: (id: string) => void;
  connecting: boolean;
  send: (type: string, payload?: unknown) => void;
  leave: () => void;
}

export function useGameRoom(
  roomId: string,
  displayName: string,
  role: "player" | "white-cell" | "spectator" = "player"
): UseGameRoomResult {
  const [state, setState] = useState<StateSnapshot | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [errors, setErrors] = useState<RoomError[]>([]);
  const [connecting, setConnecting] = useState(true);
  const roomRef = useRef<Room | null>(null);

  const pushError = (reason: string) => {
    const e: RoomError = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reason,
      at: Date.now(),
    };
    setErrors((cur) => [...cur, e].slice(-ERROR_STACK_MAX));
    // Auto-dismiss this specific error (don't let a later error shorten its TTL)
    setTimeout(() => {
      setErrors((cur) => cur.filter((x) => x.id !== e.id));
    }, ERROR_TTL_MS);
  };

  const dismissError = (id: string) => {
    setErrors((cur) => cur.filter((x) => x.id !== id));
  };

  useEffect(() => {
    if (!roomId || !displayName) return;
    let cancelled = false;
    let localRoom: Room | null = null;

    (async () => {
      try {
        const r = await joinGame(roomId, displayName, role);
        if (cancelled) {
          r.leave();
          return;
        }
        localRoom = r;
        roomRef.current = r;
        setSessionId(r.sessionId);

        r.onStateChange((s) => {
          setState(toSnapshot(s));
        });

        r.onMessage("error", (m: { reason: string }) => {
          console.warn("[room error]", m.reason);
          pushError(m.reason);
        });

        r.onLeave(() => {
          if (!cancelled) {
            roomRef.current = null;
            setSessionId("");
          }
        });

        // Seed with whatever state we have right now (usually populated by
        // the time .joinById resolves; if not, the listener above catches up).
        setState(toSnapshot(r.state));
        setConnecting(false);
      } catch (e) {
        if (!cancelled) {
          pushError((e as Error).message);
          setConnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (localRoom) {
        localRoom.leave();
      }
    };
    // role is a captured-by-closure dependency — re-join on role change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, displayName, role]);

  const send = (type: string, payload?: unknown) => {
    const r = roomRef.current;
    if (!r) {
      console.warn(`[send] no active room; dropped ${type}`);
      pushError(`not connected — can't ${type}`);
      return;
    }
    r.send(type, payload ?? {});
  };

  const leave = () => {
    const r = roomRef.current;
    if (r) r.leave();
  };

  // Back-compat: most-recent error as a single string for existing consumers.
  const error = errors.length > 0 ? (errors[errors.length - 1]?.reason ?? null) : null;

  return {
    room: roomRef.current,
    state,
    sessionId,
    error,
    errors,
    dismissError,
    connecting,
    send,
    leave,
  };
}
