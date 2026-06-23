"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FACTIONS } from "@hedgemony/shared";
import type { FactionId } from "@hedgemony/shared";
import type { StateSnapshot, ThreadSnapshot } from "@/lib/useGameRoom";

type Send = (type: string, payload?: unknown) => void;

/**
 * Right-side press panel. Shows bilateral threads per other seated faction
 * plus any coalition threads the current faction participates in. Selecting
 * a thread opens a conversation view with input.
 */
export function Press({
  state,
  myFactionId,
  send,
}: {
  state: StateSnapshot;
  myFactionId: FactionId;
  send: Send;
}) {
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [showNewCoalition, setShowNewCoalition] = useState(false);

  // Threads I participate in — sorted: bilaterals by faction display order,
  // then coalitions by creation time (newest first).
  const myThreads = useMemo(() => {
    return Object.values(state.threads)
      .filter((t) => threadIncludes(t, myFactionId))
      .sort(sortThreads(myFactionId));
  }, [state.threads, myFactionId]);

  const otherSeatedFactions = useMemo(() => {
    const seated: FactionId[] = [];
    for (const p of Object.values(state.participants)) {
      if (p.role === "player" && p.factionId && p.factionId !== myFactionId) {
        seated.push(p.factionId as FactionId);
      }
    }
    return seated;
  }, [state.participants, myFactionId]);

  const openThread = openThreadId ? state.threads[openThreadId] : null;

  // Mark read on open + when new messages arrive while the thread is open
  useEffect(() => {
    if (!openThread) return;
    const unread = openThread.messages.some((m) => !isReadBy(m, myFactionId));
    if (unread) {
      send("mark-thread-read", { threadId: openThread.id });
    }
  }, [openThread, myFactionId, send]);

  return (
    <div className="bg-bg-panel border border-bg-line rounded-sm flex flex-col max-h-[calc(100vh-240px)]">
      <header className="px-3 py-2 border-b border-bg-line flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Press</p>
        <button
          onClick={() => setShowNewCoalition(true)}
          className="font-mono text-[10px] uppercase text-zinc-400 hover:text-openbrain"
        >
          + coalition
        </button>
      </header>

      {openThread ? (
        <ThreadView
          thread={openThread}
          myFactionId={myFactionId}
          onBack={() => setOpenThreadId(null)}
          onSend={(body) => send("send-message", { threadId: openThread.id, body })}
        />
      ) : (
        <ThreadList
          threads={myThreads}
          myFactionId={myFactionId}
          onSelect={setOpenThreadId}
          otherSeatedFactions={otherSeatedFactions}
        />
      )}

      {showNewCoalition && (
        <CoalitionCreator
          candidates={otherSeatedFactions}
          onCancel={() => setShowNewCoalition(false)}
          onCreate={(participants, name) => {
            send("create-coalition-thread", {
              participantFactionIds: participants,
              name,
            });
            setShowNewCoalition(false);
          }}
        />
      )}
    </div>
  );
}

function ThreadList({
  threads,
  myFactionId,
  onSelect,
  otherSeatedFactions,
}: {
  threads: ThreadSnapshot[];
  myFactionId: FactionId;
  onSelect: (id: string) => void;
  otherSeatedFactions: FactionId[];
}) {
  if (threads.length === 0 && otherSeatedFactions.length === 0) {
    return (
      <div className="p-4 font-mono text-xs text-zinc-600 italic">
        no other factions seated yet
      </div>
    );
  }
  return (
    <div className="px-2 py-2 space-y-1 overflow-y-auto flex-1">
      {threads.map((t) => (
        <ThreadRow
          key={t.id}
          thread={t}
          myFactionId={myFactionId}
          onClick={() => onSelect(t.id)}
        />
      ))}
    </div>
  );
}

function ThreadRow({
  thread,
  myFactionId,
  onClick,
}: {
  thread: ThreadSnapshot;
  myFactionId: FactionId;
  onClick: () => void;
}) {
  const otherFactions = threadParticipants(thread).filter((f) => f !== myFactionId);
  const last = thread.messages[thread.messages.length - 1];
  const unread = thread.messages.filter((m) => !isReadBy(m, myFactionId)).length;
  const label =
    thread.kind === "bilateral"
      ? otherFactions[0]
        ? FACTIONS[otherFactions[0]].displayName
        : "?"
      : thread.name || "coalition";
  const accent =
    thread.kind === "bilateral" && otherFactions[0]
      ? FACTIONS[otherFactions[0]].accentColor
      : "#888";

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-bg-line rounded-sm px-2.5 py-1.5 hover:bg-bg-card transition-colors"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-xs font-semibold" style={{ color: accent }}>
          {label}
        </span>
        {unread > 0 && (
          <span className="font-mono text-[10px] text-openbrain">● {unread}</span>
        )}
      </div>
      {thread.kind === "coalition" && (
        <span className="font-mono text-[10px] text-zinc-600">
          {otherFactions.length + 1} participants
        </span>
      )}
      {last ? (
        <p className="font-sans text-[11px] text-zinc-400 mt-0.5 truncate">
          <span style={{ color: FACTIONS[last.senderFactionId as FactionId]?.accentColor ?? "#888" }}>
            {FACTIONS[last.senderFactionId as FactionId]?.shortName ?? "??"}:
          </span>{" "}
          {last.body}
        </p>
      ) : (
        <p className="font-sans text-[11px] text-zinc-600 italic mt-0.5">no messages yet</p>
      )}
    </button>
  );
}

function ThreadView({
  thread,
  myFactionId,
  onBack,
  onSend,
}: {
  thread: ThreadSnapshot;
  myFactionId: FactionId;
  onBack: () => void;
  onSend: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.messages.length]);

  const otherFactions = threadParticipants(thread).filter((f) => f !== myFactionId);
  const title =
    thread.kind === "bilateral"
      ? otherFactions[0]
        ? FACTIONS[otherFactions[0]].displayName
        : "?"
      : thread.name || "coalition";
  const titleAccent =
    thread.kind === "bilateral" && otherFactions[0]
      ? FACTIONS[otherFactions[0]].accentColor
      : "#e0e0e0";

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2 border-b border-bg-line flex items-center justify-between">
        <div>
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: titleAccent }}
          >
            {thread.kind === "bilateral" ? "BILATERAL" : "COALITION"}
          </p>
          <p className="font-sans text-sm font-semibold" style={{ color: titleAccent }}>
            {title}
          </p>
        </div>
        <button
          onClick={onBack}
          className="font-mono text-xs text-zinc-500 hover:text-zinc-200"
        >
          ← threads
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {thread.messages.length === 0 && (
          <p className="font-mono text-xs text-zinc-600 italic">conversation begins here</p>
        )}
        {thread.messages.map((m) => {
          const isMine = m.senderFactionId === myFactionId;
          const accent = FACTIONS[m.senderFactionId as FactionId]?.accentColor ?? "#888";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              <div
                className="border rounded-sm px-2 py-1 max-w-[90%]"
                style={{
                  borderColor: "#252a4a",
                  borderLeftColor: accent,
                  borderLeftWidth: 3,
                  backgroundColor: isMine ? "rgba(0,191,255,0.05)" : "rgba(30,36,72,0.6)",
                }}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-[9px] uppercase"
                    style={{ color: accent }}
                  >
                    {FACTIONS[m.senderFactionId as FactionId]?.shortName ?? "??"}
                  </span>
                  <span className="font-mono text-[9px] text-zinc-600">
                    {formatTime(m.createdAt)}
                  </span>
                </div>
                <p className="font-sans text-xs text-zinc-200 whitespace-pre-wrap">
                  {m.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-bg-line">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="message (⌘/Ctrl+Enter to send)"
            rows={2}
            className="flex-1 bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-sans text-xs text-zinc-200 resize-none focus:outline-none focus:border-openbrain"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="font-mono text-xs uppercase tracking-wider border border-openbrain text-openbrain px-3 py-1 rounded-sm hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function CoalitionCreator({
  candidates,
  onCancel,
  onCreate,
}: {
  candidates: FactionId[];
  onCancel: () => void;
  onCreate: (participants: FactionId[], name: string) => void;
}) {
  const [selected, setSelected] = useState<Set<FactionId>>(new Set());
  const [name, setName] = useState("");

  const toggle = (f: FactionId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm">
      <div className="bg-bg-panel border border-openbrain rounded-sm max-w-md w-full p-5 m-4">
        <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-2">
          NEW COALITION THREAD
        </p>
        <label className="block font-mono text-[10px] uppercase text-zinc-500 mb-1">
          Label (optional)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 'Pause Petition bloc'"
          className="w-full bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-sans text-sm text-zinc-200 mb-3 focus:outline-none focus:border-openbrain"
        />

        <label className="block font-mono text-[10px] uppercase text-zinc-500 mb-1">
          Invite participants
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {candidates.map((f) => {
            const isSel = selected.has(f);
            return (
              <button
                key={f}
                onClick={() => toggle(f)}
                className="text-left border rounded-sm px-2 py-1.5 text-xs"
                style={{
                  borderColor: isSel ? FACTIONS[f].accentColor : "#252a4a",
                  backgroundColor: isSel ? FACTIONS[f].accentColor + "15" : "transparent",
                }}
              >
                <span style={{ color: FACTIONS[f].accentColor }}>
                  {FACTIONS[f].shortName}
                </span>{" "}
                <span className="text-zinc-300">{FACTIONS[f].displayName}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-bg-line text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            disabled={selected.size === 0}
            onClick={() => onCreate(Array.from(selected), name)}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm border border-openbrain text-openbrain hover:bg-openbrain hover:text-bg-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------

function threadParticipants(t: ThreadSnapshot): FactionId[] {
  return t.participantFactionIds.split(" ").filter(Boolean) as FactionId[];
}

function threadIncludes(t: ThreadSnapshot, f: FactionId): boolean {
  return threadParticipants(t).includes(f);
}

function isReadBy(m: { readByFactions: string }, f: FactionId): boolean {
  return m.readByFactions.split(" ").filter(Boolean).includes(f);
}

function sortThreads(myFaction: FactionId) {
  return (a: ThreadSnapshot, b: ThreadSnapshot): number => {
    // Unread first
    const au = a.messages.filter((m) => !isReadBy(m, myFaction)).length;
    const bu = b.messages.filter((m) => !isReadBy(m, myFaction)).length;
    if (au !== bu) return bu - au;
    // Then most-recent-activity
    const aLast = a.messages[a.messages.length - 1]?.createdAt ?? a.createdAt;
    const bLast = b.messages[b.messages.length - 1]?.createdAt ?? b.createdAt;
    return bLast.localeCompare(aLast);
  };
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "";
  }
}
