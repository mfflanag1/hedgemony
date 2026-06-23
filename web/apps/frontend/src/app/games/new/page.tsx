"use client";

import { useEffect, useState } from "react";
import type { Room } from "colyseus.js";
import { useRouter } from "next/navigation";
import { createGame } from "@/lib/colyseus";
import { usePlayerName } from "@/lib/usePlayerName";

export default function NewGamePage() {
  const router = useRouter();
  const [name] = usePlayerName();
  const [status, setStatus] = useState("initializing…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    let createdRoom: Room | null = null;

    (async () => {
      try {
        setStatus("creating room…");
        const r = await createGame(name);
        if (cancelled) {
          await r.leave();
          return;
        }
        createdRoom = r;
        setStatus(`room ${r.roomId} created; redirecting…`);
        router.replace(`/games/${r.roomId}`);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setStatus("failed to create room");
        }
      }
    })();

    // CRITICAL: when the component unmounts (i.e. navigation to /games/[id]
    // takes effect), leave the create-socket. The engine's 60-second idle
    // grace period (autoDispose=false + scheduled disconnect) keeps the
    // freshly-created room alive so the /games/[id] page can join it. If we
    // don't leave here, the create-socket leaks as a ghost participant who
    // holds `ownerSessionId` — and the real tab-1 rejoin never becomes host.
    return () => {
      cancelled = true;
      if (createdRoom) {
        createdRoom.leave();
      }
    };
  }, [name, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-8">
      <div className="border-l-2 border-openbrain pl-6 max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-2">
          NEW GAME · {name || "…"}
        </p>
        <p className="font-mono text-sm text-zinc-300">{status}</p>
        {error && <p className="font-mono text-xs text-deepcent mt-2">{error}</p>}
      </div>
    </main>
  );
}
