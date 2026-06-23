"use client";

import { useParams } from "next/navigation";
import { useGameRoom } from "@/lib/useGameRoom";
import { usePlayerName } from "@/lib/usePlayerName";
import { WhiteCellConsole } from "@/components/WhiteCellConsole";

export default function WhiteCellPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const [name] = usePlayerName();

  // Join as white-cell role so the server role-gates WC-only messages.
  const { state, sessionId, error, errors, connecting, send } = useGameRoom(
    roomId,
    name,
    "white-cell"
  );

  if (!name || connecting || !state) {
    return (
      <main className="min-h-screen flex items-center justify-center px-8">
        <div className="border-l-2 border-openbrain pl-6 max-w-md">
          <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-2">
            WHITE CELL · {roomId}
          </p>
          <p className="font-mono text-sm text-zinc-400">
            {!name ? "initializing…" : "negotiating session…"}
          </p>
          {error && <p className="font-mono text-xs text-deepcent mt-2">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <WhiteCellConsole
      state={state}
      sessionId={sessionId}
      send={send}
      errors={errors}
    />
  );
}
