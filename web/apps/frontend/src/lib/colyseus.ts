"use client";

import { Client, Room } from "colyseus.js";

let _client: Client | null = null;

export function getClient(): Client {
  if (_client) return _client;
  const isBrowser = typeof window !== "undefined";
  const localEngineUrl = () => {
    if (!isBrowser) return "ws://localhost:2567";
    const { hostname } = window.location;
    const host = hostname.includes(":") ? `[${hostname.replace(/^\[|\]$/g, "")}]` : hostname;
    return `ws://${host || "localhost"}:2567`;
  };
  const isLocalHost =
    isBrowser &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1" ||
      window.location.hostname === "[::1]");
  const url =
    process.env.NEXT_PUBLIC_ENGINE_WS_URL ??
    (isBrowser && !isLocalHost
      ? `wss://${window.location.host}/engine`
      : localEngineUrl());
  _client = new Client(url);
  return _client;
}

export async function createGame(displayName: string): Promise<Room> {
  const client = getClient();
  return client.create("hedgemony", { role: "player", displayName });
}

export async function joinGame(roomId: string, displayName: string, role: "player" | "white-cell" | "spectator" = "player"): Promise<Room> {
  const client = getClient();
  return client.joinById(roomId, { role, displayName });
}
