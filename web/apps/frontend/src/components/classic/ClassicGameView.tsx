"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { CLASSIC_FACTIONS, type ClassicCard, type ClassicFactionId } from "@hedgemony/shared";
import type { ClassicSnapshot } from "@/lib/useClassicRoom";
import { loadDeck, loadDeckFromServer } from "@/lib/classicDeck";
import { ActionLog } from "../ActionLog";
import { DiceLog } from "../DiceLog";
import { RandBanner } from "./RandBanner";
import { PhaseBar, FactionTrackers, WorldBoard } from "./ClassicBoard";

export function ClassicGameView({
  state,
  sessionId,
  send,
  error,
}: {
  state: ClassicSnapshot;
  sessionId: string;
  send: (type: string, payload?: unknown) => void;
  error: string | null;
}) {
  const me = state.participants[sessionId];
  const myFactionId = (me?.factionId || "") as ClassicFactionId;
  const myFaction = myFactionId ? state.factions[myFactionId] : null;
  const isRed = !!myFaction && myFaction.side === "red";
  const canSignal = state.phase === 1 && state.status === "active" && isRed;
  const canPlayCard =
    state.status === "active" &&
    !!myFaction &&
    ((state.phase === 2 && myFaction.side === "blue") || (state.phase === 3 && myFaction.side === "red"));

  return (
    <main className="min-h-screen flex flex-col">
      <RandBanner />
      <header className="border-b border-bg-line bg-bg-panel px-6 py-3 flex items-center justify-between">
        <h1 className="font-serif text-lg">
          <span className="text-amber-400">HEDGEMONY</span>{" "}
          <span className="text-zinc-500 text-sm">· Strategic Choices (classic)</span>
        </h1>
        <PhaseBar state={state} />
      </header>

      {state.status === "ended" && (
        <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/30">
          <p className="font-mono text-xs text-amber-300">
            ▰ GAME ENDED — Winner(s):{" "}
            {state.winners.length > 0
              ? state.winners.map((w) => CLASSIC_FACTIONS[w as ClassicFactionId]?.name ?? w).join(", ")
              : "none met their victory conditions"}
          </p>
        </div>
      )}
      {error && (
        <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/30">
          <p className="font-mono text-xs text-red-300">⚠ {error}</p>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-0">
        <section className="col-span-3 border-r border-bg-line p-4 flex flex-col gap-3 overflow-y-auto">
          {myFaction ? (
            <div className="border border-amber-500/40 rounded-sm px-3 py-2">
              <p className="font-mono text-xs uppercase" style={{ color: CLASSIC_FACTIONS[myFactionId]?.accentColor }}>
                You: {CLASSIC_FACTIONS[myFactionId]?.name}
              </p>
              <p className="font-mono text-[11px] text-zinc-400 mt-1">
                IP {myFaction.ip} · RP {myFaction.rp} · Tech {myFaction.techLevel}
                {CLASSIC_FACTIONS[myFactionId]?.tracksReadiness ? ` · Rdy ${myFaction.readiness}` : ""}
              </p>
              <p className="font-mono text-[10px] text-zinc-600 mt-1">
                {myFaction.side === "blue"
                  ? "Blue is free-play — state your intent to the White Cell, who adjudicates."
                  : "Red plays from its deck; signal in Phase 1."}
              </p>
            </div>
          ) : (
            <p className="font-mono text-xs text-zinc-500">Spectating.</p>
          )}
          {(canSignal || canPlayCard) && myFaction && (
            <ClassicCardActions
              mode={canSignal ? "signal" : "play"}
              myFactionId={myFactionId}
              side={myFaction.side}
              signaled={myFaction.signaledCards}
              played={myFaction.playedCards}
              send={send}
            />
          )}
        </section>

        <section className="col-span-6 p-4 flex flex-col gap-3">
          <WorldBoard state={state} />
          <FactionTrackers state={state} meId={myFactionId} />
          <ActionLog log={state.log} />
          <DiceLog dice={state.dice} />
        </section>

        <section className="col-span-3 border-l border-bg-line p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2">Factions</p>
          <FactionTrackers state={state} meId={myFactionId} />
        </section>
      </div>

      <footer className="border-t border-bg-line bg-bg-panel px-4 py-2 flex items-center justify-between">
        <p className="font-mono text-xs text-zinc-500">{readiness(state)}</p>
        {myFaction && (
          myFaction.ready ? (
            <button
              disabled={state.status !== "active"}
              onClick={() => send("unconfirm-phase")}
              className="font-mono text-xs uppercase tracking-wider border border-zinc-600 text-zinc-300 px-4 py-2 rounded-sm hover:bg-bg-card disabled:opacity-40"
            >
              ← Unconfirm
            </button>
          ) : (
            <button
              disabled={state.status !== "active"}
              onClick={() => send("confirm-phase")}
              className="font-mono text-xs uppercase tracking-wider border border-amber-500 text-amber-300 px-6 py-2 rounded-sm hover:bg-amber-500 hover:text-bg-base transition-colors disabled:opacity-40"
            >
              Confirm Phase →
            </button>
          )
        )}
      </footer>
    </main>
  );
}

function readiness(state: ClassicSnapshot): string {
  const seated = Object.values(state.participants).filter((p) => p.role === "player" && p.factionId);
  const ready = seated.filter((p) => state.factions[p.factionId]?.ready).length;
  return `${ready} / ${seated.length} factions confirmed · advances when all ready`;
}

function ClassicCardActions({
  mode,
  myFactionId,
  side,
  signaled,
  played,
  send,
}: {
  mode: "signal" | "play";
  myFactionId: ClassicFactionId;
  side: string;
  signaled: string[];
  played: string[];
  send: (type: string, payload?: unknown) => void;
}) {
  const [deck, setDeck] = useState<ClassicCard[]>([]);
  const [selected, setSelected] = useState<string[]>(mode === "signal" ? signaled : []);
  const [custom, setCustom] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const local = loadDeck();
    setDeck(local);
    loadDeckFromServer().then((serverDeck) => {
      if (serverDeck) setDeck(serverDeck);
    });
  }, []);

  useEffect(() => {
    setSelected(mode === "signal" ? signaled : []);
  }, [mode, signaled]);

  const selectedCards = useMemo(
    () => selected.map((id) => deck.find((card) => card.id === id)).filter((card): card is ClassicCard => !!card),
    [deck, selected]
  );

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = mode === "play" && side === "red" && signaled.length > 0
      ? deck.filter((card) => signaled.includes(card.id))
      : deck;
    const candidates = q
      ? base
      : base.filter((card) =>
          card.faction === myFactionId ||
          (card.id.startsWith("PHOTO-") && !card.faction && ["action", "investment"].includes(card.type))
        );
    return candidates
      .filter((card) =>
        !q ||
        card.id.toLowerCase().includes(q) ||
        card.title.toLowerCase().includes(q) ||
        card.text.toLowerCase().includes(q) ||
        (card.faction ?? "").toLowerCase().includes(q) ||
        (card.sourcePhoto ?? "").toLowerCase().includes(q)
      )
      .slice(0, mode === "play" ? 24 : 60);
  }, [deck, mode, myFactionId, query, side, signaled]);

  const toggle = (id: string) =>
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (mode === "play") return [id];
      return cur.length >= 3 ? cur : [...cur, id];
    });

  const playSelected = () => {
    const cardId = selected[0] ?? custom.trim();
    if (!cardId) return;
    const card = deck.find((c) => c.id === cardId);
    send("play-card", {
      cardId,
      title: card?.title || custom.trim(),
      costRp: card?.costRp,
      effects: card?.effects,
    });
    setSelected([]);
    setCustom("");
  };

  return (
    <div className="border border-amber-500/40 bg-amber-500/5 rounded-sm px-3 py-2">
      <p className="font-mono text-xs uppercase tracking-wider text-amber-300 mb-1">
        {mode === "signal" ? "Red Signaling — up to 3" : "Play / announce card"}
      </p>
      {visibleCards.length === 0 && (
        <p className="font-mono text-[10px] text-zinc-500 mb-1">
          No cards matched for {myFactionId} — search the full photo deck or use a custom label below.
        </p>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="search photo deck"
        className="w-full bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-mono text-[11px] mb-2"
      />
      <ul className="space-y-1 mb-2">
        {visibleCards.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => toggle(c.id)}
              className={`w-full text-left px-2 py-1 rounded-sm border flex gap-2 items-center ${
                selected.includes(c.id) ? "border-amber-400 text-amber-300 bg-amber-400/10" : "border-bg-line text-zinc-400"
              }`}
            >
              <span className="font-mono text-[11px] shrink-0">{selected.includes(c.id) ? "◉" : "○"}</span>
              {c.imagePath && (
                <img src={c.imagePath} alt="" loading="lazy" className="h-12 w-9 object-cover rounded-[2px] border border-bg-line bg-bg-base" />
              )}
              <span className="min-w-0">
                <span className="block font-mono text-[10px] text-zinc-500 truncate">{c.id}</span>
                <span className="block font-mono text-[11px] leading-snug line-clamp-2">{c.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selectedCards.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedCards.map((card) => (
            <a key={card.id} href={card.imagePath || undefined} target="_blank" rel="noreferrer"
              className="font-mono text-[10px] border border-amber-400/40 text-amber-200 rounded-sm px-1.5 py-0.5 max-w-full truncate">
              {card.title}
            </a>
          ))}
        </div>
      )}
      <div className="flex gap-1 mb-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={mode === "signal" ? "custom signal id" : "custom card/action"}
          className="flex-1 bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-mono text-[11px]"
        />
        <button
          onClick={() => { if (custom.trim() && selected.length < 3) { setSelected([...selected, custom.trim()]); setCustom(""); } }}
          className="font-mono text-[11px] border border-bg-line text-zinc-400 px-2 rounded-sm hover:bg-bg-card"
        >
          +
        </button>
      </div>
      <button
        onClick={() => mode === "signal" ? send("signal-cards", { cardIds: selected }) : playSelected()}
        className="font-mono text-[11px] uppercase tracking-wider border border-amber-500 text-amber-300 px-3 py-1 rounded-sm hover:bg-amber-500 hover:text-bg-base"
      >
        {mode === "signal" ? `Signal (${selected.length})` : "Play card"}
      </button>
      {played.length > 0 && (
        <p className="font-mono text-[10px] text-zinc-600 mt-2">
          played: {played.slice(-3).join(", ")}
        </p>
      )}
    </div>
  );
}
