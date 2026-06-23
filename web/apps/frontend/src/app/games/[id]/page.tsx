"use client";

import { useParams } from "next/navigation";
import { useGameRoom } from "@/lib/useGameRoom";
import { usePlayerName } from "@/lib/usePlayerName";
import { LobbyView } from "@/components/LobbyView";
import { GameView } from "@/components/GameView";

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const [name] = usePlayerName();

  // Don't connect until we have a stable name. Passing a temp value like
  // "operator" would trigger a first join, then a rejoin once the real name
  // resolves — which leaves phantom participants churning through the lobby.
  const { state, sessionId, error, connecting, send } = useGameRoom(roomId, name);

  if (!name) {
    return <ConnectingView roomId={roomId} message="initializing…" error={error} />;
  }

  if (connecting || !state) {
    return <ConnectingView roomId={roomId} message="negotiating session…" error={error} />;
  }

  return (
    <>
      {state.status === "lobby" ? (
        <LobbyView state={state} sessionId={sessionId} send={send} error={error} />
      ) : (
        <GameView state={state} sessionId={sessionId} send={send} error={error} />
      )}
    </>
  );
}

function ConnectingView({ roomId, message, error }: { roomId: string; message: string; error: string | null }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-8">
      <div className="border-l-2 border-openbrain pl-6 max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-2">
          CONNECTING · {roomId}
        </p>
        <p className="font-mono text-sm text-zinc-400">{message}</p>
        {error && <p className="font-mono text-xs text-deepcent mt-2">{error}</p>}
      </div>
    </main>
  );
}
