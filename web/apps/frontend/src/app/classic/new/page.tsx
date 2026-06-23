"use client";

import { useEffect, useState } from "react";
import type { Room } from "colyseus.js";
import { useRouter } from "next/navigation";
import { createClassicGame } from "@/lib/useClassicRoom";
import { usePlayerName } from "@/lib/usePlayerName";
import { CLASSIC_ENABLED } from "@/lib/classicEnabled";
import { ClassicDisabled } from "../disabled";

export default function NewClassicGamePage() {
  const router = useRouter();
  const [name] = usePlayerName();
  const [status, setStatus] = useState("initializing…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLASSIC_ENABLED || !name) return;
    let cancelled = false;
    let createdRoom: Room | null = null;
    (async () => {
      try {
        setStatus("creating room…");
        const r = await createClassicGame(name);
        if (cancelled) { await r.leave(); return; }
        createdRoom = r;
        router.replace(`/classic/${r.roomId}`);
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setStatus("failed to create room"); }
      }
    })();
    return () => { cancelled = true; if (createdRoom) createdRoom.leave(); };
  }, [name, router]);

  if (!CLASSIC_ENABLED) return <ClassicDisabled />;

  return (
    <main className="min-h-screen flex items-center justify-center px-8">
      <div className="border-l-2 border-amber-500 pl-6 max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-2">
          NEW CLASSIC GAME · {name || "…"}
        </p>
        <p className="font-mono text-sm text-zinc-300">{status}</p>
        {error && <p className="font-mono text-xs text-red-400 mt-2">{error}</p>}
      </div>
    </main>
  );
}
