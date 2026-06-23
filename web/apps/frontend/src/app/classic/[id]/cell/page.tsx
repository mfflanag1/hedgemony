"use client";

import { useParams } from "next/navigation";
import { useClassicRoom } from "@/lib/useClassicRoom";
import { usePlayerName } from "@/lib/usePlayerName";
import { CLASSIC_ENABLED } from "@/lib/classicEnabled";
import { ClassicWhiteCell } from "@/components/classic/ClassicWhiteCell";
import { ClassicDisabled } from "../../disabled";

export default function ClassicCellPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [name] = usePlayerName();
  if (!CLASSIC_ENABLED) return <ClassicDisabled />;
  return <CellInner roomId={id} name={name} />;
}

function CellInner({ roomId, name }: { roomId: string; name: string }) {
  const { state, send, error, connecting } = useClassicRoom(roomId, name, "white-cell");
  if (connecting || !state) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-zinc-400">connecting as White Cell…</p>
      </main>
    );
  }
  return (
    <>
      {error && (
        <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/30">
          <p className="font-mono text-xs text-red-300">⚠ {error}</p>
        </div>
      )}
      <ClassicWhiteCell state={state} send={send} />
    </>
  );
}
