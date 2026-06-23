"use client";

import { useEffect, useRef, useState } from "react";
import { type Room } from "colyseus.js";
import { ERROR_TTL_MS, ERROR_STACK_MAX } from "@hedgemony/shared";
import type { LogEntrySnapshot, DiceRollSnapshot, ParticipantSnapshot, RoomError } from "./useGameRoom";
import { getClient } from "./colyseus";

/** Plain-JSON snapshot of ClassicState. */
export interface ClassicSnapshot {
  status: string;
  turn: number;
  phase: number;
  factions: Record<string, ClassicFactionSnapshot>;
  aors: Record<string, ClassicAorSnapshot>;
  participants: Record<string, ParticipantSnapshot>;
  log: LogEntrySnapshot[];
  dice: DiceRollSnapshot[];
  gameEnded: boolean;
  winners: string[];
  ownerSessionId: string;
  seed: string;
}

export interface ClassicFactionSnapshot {
  id: string;
  side: string;
  rp: number;
  ip: number;
  perTurnRp: number;
  techLevel: number;
  readiness: number;
  modLevels: Record<string, number>;
  ready: boolean;
  signaledCards: string[];
  playedCards: string[];
}

export interface ClassicForceSnapshot {
  factionId: string;
  count: number;
  modLevel: number;
}

export interface ClassicAorSnapshot {
  id: string;
  forces: ClassicForceSnapshot[];
}

export async function createClassicGame(displayName: string): Promise<Room> {
  return getClient().create("hedgemony-classic", { role: "player", displayName });
}

export async function joinClassicGame(
  roomId: string,
  displayName: string,
  role: "player" | "white-cell" | "spectator" = "player"
): Promise<Room> {
  return getClient().joinById(roomId, { role, displayName });
}

function toSnapshot(schema: unknown): ClassicSnapshot {
  return JSON.parse(JSON.stringify(schema)) as ClassicSnapshot;
}

export interface UseClassicRoomResult {
  room: Room | null;
  state: ClassicSnapshot | null;
  sessionId: string;
  error: string | null;
  errors: RoomError[];
  dismissError: (id: string) => void;
  connecting: boolean;
  send: (type: string, payload?: unknown) => void;
  leave: () => void;
}

export function useClassicRoom(
  roomId: string,
  displayName: string,
  role: "player" | "white-cell" | "spectator" = "player"
): UseClassicRoomResult {
  const [state, setState] = useState<ClassicSnapshot | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [errors, setErrors] = useState<RoomError[]>([]);
  const [connecting, setConnecting] = useState(true);
  const roomRef = useRef<Room | null>(null);

  const pushError = (reason: string) => {
    const e: RoomError = { id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, reason, at: Date.now() };
    setErrors((cur) => [...cur, e].slice(-ERROR_STACK_MAX));
    setTimeout(() => setErrors((cur) => cur.filter((x) => x.id !== e.id)), ERROR_TTL_MS);
  };
  const dismissError = (id: string) => setErrors((cur) => cur.filter((x) => x.id !== id));

  useEffect(() => {
    if (!roomId || !displayName) return;
    let cancelled = false;
    let localRoom: Room | null = null;
    (async () => {
      try {
        const r = await joinClassicGame(roomId, displayName, role);
        if (cancelled) { r.leave(); return; }
        localRoom = r;
        roomRef.current = r;
        setSessionId(r.sessionId);
        r.onStateChange((s) => setState(toSnapshot(s)));
        r.onMessage("error", (m: { reason: string }) => pushError(m.reason));
        r.onLeave(() => { if (!cancelled) { roomRef.current = null; setSessionId(""); } });
        setState(toSnapshot(r.state));
        setConnecting(false);
      } catch (e) {
        if (!cancelled) { pushError((e as Error).message); setConnecting(false); }
      }
    })();
    return () => { cancelled = true; if (localRoom) localRoom.leave(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, displayName, role]);

  const send = (type: string, payload?: unknown) => {
    const r = roomRef.current;
    if (!r) { pushError(`not connected — can't ${type}`); return; }
    r.send(type, payload ?? {});
  };
  const leave = () => { roomRef.current?.leave(); };
  const error = errors.length > 0 ? (errors[errors.length - 1]?.reason ?? null) : null;

  return { room: roomRef.current, state, sessionId, error, errors, dismissError, connecting, send, leave };
}
