"use client";

import { useParams } from "next/navigation";
import { CLASSIC_FACTION_ORDER, CLASSIC_FACTIONS, type ClassicFactionId } from "@hedgemony/shared";
import { useClassicRoom } from "@/lib/useClassicRoom";
import { usePlayerName } from "@/lib/usePlayerName";
import { CLASSIC_ENABLED } from "@/lib/classicEnabled";
import { ClassicGameView } from "@/components/classic/ClassicGameView";
import { RandBanner } from "@/components/classic/RandBanner";
import { ClassicDisabled } from "../disabled";

export default function ClassicGamePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [name] = usePlayerName();
  if (!CLASSIC_ENABLED) return <ClassicDisabled />;
  return <ClassicInner roomId={id} name={name} />;
}

function ClassicInner({ roomId, name }: { roomId: string; name: string }) {
  const { state, sessionId, send, error, connecting } = useClassicRoom(roomId, name);

  if (connecting || !state) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-zinc-400">connecting…</p>
      </main>
    );
  }

  if (state.status === "lobby") {
    return <ClassicLobby roomId={roomId} state={state} sessionId={sessionId} send={send} error={error} />;
  }
  return <ClassicGameView state={state} sessionId={sessionId} send={send} error={error} />;
}

function ClassicLobby({
  roomId,
  state,
  sessionId,
  send,
  error,
}: {
  roomId: string;
  state: ReturnType<typeof useClassicRoom>["state"] & object;
  sessionId: string;
  send: (t: string, p?: unknown) => void;
  error: string | null;
}) {
  const isOwner = state.ownerSessionId === sessionId;
  const claimedBy = (fid: string) =>
    Object.values(state.participants).find((p) => p.factionId === fid)?.displayName;
  const myFactionId = state.participants[sessionId]?.factionId;

  return (
    <main className="min-h-screen flex flex-col">
      <RandBanner />
      <div className="flex-1 px-8 py-6 max-w-3xl mx-auto w-full">
        <h1 className="font-serif text-2xl mb-1">
          <span className="text-amber-400">HEDGEMONY</span> — Strategic Choices (classic)
        </h1>
        <p className="font-mono text-xs text-zinc-500 mb-1">Room {roomId} · share to invite</p>
        <p className="font-mono text-[11px] text-zinc-500 mb-6">
          White Cell facilitator: open <code>/classic/{roomId}/cell</code>.
        </p>
        {error && <p className="font-mono text-xs text-red-400 mb-3">⚠ {error}</p>}

        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2">Claim a faction</p>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {CLASSIC_FACTION_ORDER.map((fid: ClassicFactionId) => {
            const meta = CLASSIC_FACTIONS[fid];
            const taken = claimedBy(fid);
            const mine = myFactionId === fid;
            return (
              <button
                key={fid}
                disabled={!!taken && !mine}
                onClick={() => send("claim-faction", { factionId: fid })}
                className={`text-left border rounded-sm px-3 py-2 font-mono text-xs disabled:opacity-40 ${
                  mine ? "border-amber-500 bg-amber-500/10" : "border-bg-line hover:border-zinc-500"
                }`}
                style={{ borderLeftColor: meta.accentColor, borderLeftWidth: 3 }}
              >
                <span style={{ color: meta.accentColor }}>{meta.name}</span>
                <span className="text-zinc-600"> · {meta.side}</span>
                {taken && <span className="block text-[10px] text-zinc-500">claimed by {taken}</span>}
              </button>
            );
          })}
        </div>

        {isOwner && (
          <button
            onClick={() => send("start-game")}
            className="font-mono text-xs uppercase tracking-wider border border-amber-500 text-amber-300 px-6 py-2 rounded-sm hover:bg-amber-500 hover:text-bg-base transition-colors"
          >
            Start Game →
          </button>
        )}
        {!isOwner && (
          <p className="font-mono text-xs text-zinc-500">Waiting for the host to start…</p>
        )}
      </div>
    </main>
  );
}
