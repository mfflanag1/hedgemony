"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import {
  CLASSIC_FACTION_ORDER,
  CLASSIC_FACTIONS,
  CLASSIC_AOR_IDS,
  type ClassicCard,
  type ClassicFactionId,
} from "@hedgemony/shared";
import { CLASSIC_ENABLED } from "@/lib/classicEnabled";
import {
  loadDeck,
  loadDeckFromServer,
  saveDeck,
  saveDeckToServer,
  upsertCard,
  removeCard,
  removeCardFromServer,
  exportDeck,
  exportVerifiedDeck,
  importDeckFile,
} from "@/lib/classicDeck";
import { ClassicCardView } from "@/components/classic/ClassicCardView";
import { RandBanner } from "@/components/classic/RandBanner";
import { ClassicDisabled } from "../disabled";

const EMPTY: ClassicCard = { id: "", type: "action", title: "", text: "" };
const INPUT = "bg-bg-base border border-bg-line rounded-sm px-2 py-1 font-mono text-[11px] w-full";
const BTN = "font-mono text-[11px] uppercase tracking-wider border border-amber-500 text-amber-300 px-3 py-1 rounded-sm hover:bg-amber-500 hover:text-bg-base transition-colors";

export default function ClassicCardsPage() {
  if (!CLASSIC_ENABLED) return <ClassicDisabled />;
  return <Workshop />;
}

function Workshop() {
  const [deck, setDeck] = useState<ClassicCard[]>([]);
  const [draft, setDraft] = useState<ClassicCard>(EMPTY);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ocr-draft" | "photo-only" | "verified" | "unreviewed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ClassicCard["type"]>("all");
  const [factionFilter, setFactionFilter] = useState<"all" | "none" | ClassicFactionId>("all");
  const [effectsText, setEffectsText] = useState("");
  const [effectsError, setEffectsError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const local = loadDeck();
    setDeck(local);
    loadDeckFromServer().then((serverDeck) => {
      if (serverDeck) {
        setDeck(serverDeck);
        saveDeck(serverDeck);
      }
    });
  }, []);
  useEffect(() => {
    setEffectsText(draft.effects ? JSON.stringify(draft.effects, null, 2) : "");
    setEffectsError("");
  }, [draft.id]);

  const persist = (next: ClassicCard[]) => {
    setDeck(next);
    saveDeck(next);
    void saveDeckToServer(next);
  };
  const selectDraft = (card: ClassicCard) => {
    setDraft(card);
    setEffectsText(card.effects ? JSON.stringify(card.effects, null, 2) : "");
    setEffectsError("");
  };

  // Set an optional field, removing the key when empty (exactOptionalPropertyTypes).
  const setField = <K extends keyof ClassicCard>(key: K, value: ClassicCard[K] | undefined) => {
    setDraft((d) => {
      const next = { ...d };
      if (value === undefined || value === "") delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const cardFromDraft = (): ClassicCard | null => {
    if (!draft.id.trim() || !draft.title.trim()) return null;
    let effects = draft.effects;
    if (effectsText.trim()) {
      try {
        const parsed = JSON.parse(effectsText) as unknown;
        if (!Array.isArray(parsed)) throw new Error("effects must be an array");
        effects = parsed as ClassicCard["effects"];
      } catch (err) {
        setEffectsError((err as Error).message);
        return null;
      }
    } else {
      effects = undefined;
    }
    const next: ClassicCard = { ...draft, id: draft.id.trim() };
    if (effects === undefined) delete next.effects;
    else next.effects = effects;
    return next;
  };

  const save = () => {
    const next = cardFromDraft();
    if (!next) return;
    persist(upsertCard(deck, next));
    setDraft(EMPTY);
    setEffectsText("");
  };

  const reviewCounts = deck.reduce(
    (acc, card) => {
      const status = card.transcriptionStatus ?? "unreviewed";
      acc[status] += 1;
      return acc;
    },
    { "ocr-draft": 0, "photo-only": 0, verified: 0, unreviewed: 0 } as Record<"ocr-draft" | "photo-only" | "verified" | "unreviewed", number>
  );

  const shown = deck.filter((c) => {
    const q = filter.toLowerCase();
    const status = c.transcriptionStatus ?? "unreviewed";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (factionFilter === "none" && c.faction) return false;
    if (factionFilter !== "all" && factionFilter !== "none" && c.faction !== factionFilter) return false;
    return (
      !q ||
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.text.toLowerCase().includes(q) ||
      (c.faction ?? "").toLowerCase().includes(q) ||
      (c.sourcePhoto ?? "").toLowerCase().includes(q)
    );
  });

  const updateStatus = (card: ClassicCard, transcriptionStatus: NonNullable<ClassicCard["transcriptionStatus"]>) => {
    persist(upsertCard(deck, { ...card, transcriptionStatus }));
    if (draft.id === card.id) setDraft({ ...draft, transcriptionStatus });
  };

  const nextDraftReview = () => {
    const next = deck.find((card) => (card.transcriptionStatus ?? "unreviewed") !== "verified" && card.imagePath);
    if (next) selectDraft(next);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <RandBanner />
      <div className="px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="font-serif text-2xl">
            <span className="text-amber-400">HEDGEMONY</span> — Card Workshop
          </h1>
          <a href="/classic/components" target="_blank" rel="noreferrer" className="font-mono text-[11px] text-amber-400 hover:underline">
            component photos ↗
          </a>
        </div>
        <p className="font-mono text-[11px] text-zinc-500 mb-6">
          Type your authorized cards in here — they save to this browser (local only) with
          JSON import/export to share with your group. Open the photos in another tab to read
          each card as you enter it. {deck.length} cards.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {([
            ["OCR draft", reviewCounts["ocr-draft"], "ocr-draft"],
            ["Photo only", reviewCounts["photo-only"], "photo-only"],
            ["Verified", reviewCounts.verified, "verified"],
            ["Unreviewed", reviewCounts.unreviewed, "unreviewed"],
          ] as const).map(([label, count, status]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`text-left border rounded-sm px-3 py-2 ${statusFilter === status ? "border-amber-500 bg-amber-500/10" : "border-bg-line hover:bg-bg-card"}`}
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
              <p className="font-mono text-lg text-zinc-100">{count}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Editor */}
          <section className="col-span-12 lg:col-span-4 border border-bg-line rounded-sm p-4 h-fit sticky top-4">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-3">Add / edit card</p>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="font-mono text-[10px] text-zinc-500">ID
                  <input className={INPUT} value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} placeholder="IR-04" />
                </label>
                <label className="font-mono text-[10px] text-zinc-500">Type
                  <select className={INPUT} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ClassicCard["type"] })}>
                    <option value="action">Action</option>
                    <option value="investment">Investment</option>
                    <option value="domestic-event">Domestic Event</option>
                    <option value="international-event">International Event</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="font-mono text-[10px] text-zinc-500">Faction
                  <select className={INPUT} value={draft.faction ?? ""} onChange={(e) => setField("faction", (e.target.value || undefined) as ClassicFactionId | undefined)}>
                    <option value="">— (event)</option>
                    {CLASSIC_FACTION_ORDER.map((f) => <option key={f} value={f}>{CLASSIC_FACTIONS[f].name}</option>)}
                  </select>
                </label>
                <label className="font-mono text-[10px] text-zinc-500">AOR
                  <select className={INPUT} value={draft.aor ?? ""} onChange={(e) => setField("aor", (e.target.value || undefined) as ClassicCard["aor"])}>
                    <option value="">—</option>
                    {CLASSIC_AOR_IDS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
              </div>
              <label className="font-mono text-[10px] text-zinc-500">Title
                <input className={INPUT} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="font-mono text-[10px] text-zinc-500">RP
                  <input type="number" className={INPUT} value={draft.costRp ?? ""} onChange={(e) => setField("costRp", e.target.value === "" ? undefined : +e.target.value)} />
                </label>
                <label className="font-mono text-[10px] text-zinc-500">Resolution
                  <input className={INPUT} value={draft.resolution ?? ""} onChange={(e) => setField("resolution", e.target.value || undefined)} placeholder="RT B" />
                </label>
                <label className="font-mono text-[10px] text-zinc-500">Visibility
                  <select className={INPUT} value={draft.isPublic === false ? "private" : "public"} onChange={(e) => setDraft({ ...draft, isPublic: e.target.value === "public" })}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>
              </div>
              <label className="font-mono text-[10px] text-zinc-500">Text / effect
                <textarea className={`${INPUT} h-32`} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
              </label>
              <label className="font-mono text-[10px] text-zinc-500">Automated effects JSON
                <textarea
                  className={`${INPUT} h-24`}
                  value={effectsText}
                  onChange={(e) => { setEffectsText(e.target.value); setEffectsError(""); }}
                  placeholder='[{"op":"tracker","target":"self","field":"ip","delta":1}]'
                />
              </label>
              {effectsError && <p className="font-mono text-[10px] text-red-300">{effectsError}</p>}
              {draft.imagePath && (
                <a href={draft.imagePath} target="_blank" rel="noreferrer"
                  className="block border border-bg-line rounded-sm overflow-hidden bg-bg-base">
                  <img
                    src={draft.imagePath}
                    alt={`${draft.title || draft.id} card face`}
                    className="w-full h-72 object-contain"
                  />
                </a>
              )}
              {draft.transcriptionStatus && (
                <label className="font-mono text-[10px] text-zinc-500">Transcription
                  <select
                    className={INPUT}
                    value={draft.transcriptionStatus}
                    onChange={(e) => setField("transcriptionStatus", e.target.value as ClassicCard["transcriptionStatus"])}
                  >
                    <option value="photo-only">Photo only</option>
                    <option value="ocr-draft">OCR draft</option>
                    <option value="verified">Verified</option>
                  </select>
                </label>
              )}
              <div className="flex gap-2">
                <button className={BTN} onClick={save}>Save card</button>
                {draft.id && (
                  <button
                    className="font-mono text-[11px] uppercase border border-emerald-500 text-emerald-300 px-3 py-1 rounded-sm hover:bg-emerald-500 hover:text-bg-base"
                    onClick={() => {
                      const parsed = cardFromDraft();
                      if (!parsed) return;
                      const next = { ...parsed, transcriptionStatus: "verified" as const };
                      persist(upsertCard(deck, next));
                      setDraft(next);
                    }}
                  >
                    Mark verified
                  </button>
                )}
                <button
                  className="font-mono text-[11px] uppercase border border-bg-line text-zinc-400 px-3 py-1 rounded-sm hover:bg-bg-card"
                  onClick={() => selectDraft(EMPTY)}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-bg-line flex flex-wrap gap-2">
              <button className="font-mono text-[10px] uppercase border border-bg-line text-zinc-400 px-2 py-1 rounded-sm hover:bg-bg-card" onClick={() => exportDeck(deck)}>Export JSON</button>
              <button className="font-mono text-[10px] uppercase border border-bg-line text-zinc-400 px-2 py-1 rounded-sm hover:bg-bg-card" onClick={() => exportVerifiedDeck(deck)}>Export verified</button>
              <button className="font-mono text-[10px] uppercase border border-bg-line text-zinc-400 px-2 py-1 rounded-sm hover:bg-bg-card" onClick={() => fileRef.current?.click()}>Import JSON</button>
              <button className="font-mono text-[10px] uppercase border border-bg-line text-zinc-400 px-2 py-1 rounded-sm hover:bg-bg-card" onClick={nextDraftReview}>Next review</button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden"
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { persist(await importDeckFile(f)); } catch { alert("invalid deck file"); } } }} />
            </div>
          </section>

          {/* Deck */}
          <section className="col-span-12 lg:col-span-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <input className={`${INPUT} max-w-xs`} placeholder="filter by id / title / faction…" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <select className={`${INPUT} max-w-[170px]`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                <option value="all">All statuses</option>
                <option value="ocr-draft">OCR draft</option>
                <option value="photo-only">Photo only</option>
                <option value="verified">Verified</option>
                <option value="unreviewed">Unreviewed</option>
              </select>
              <select className={`${INPUT} max-w-[170px]`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
                <option value="all">All types</option>
                <option value="action">Action</option>
                <option value="investment">Investment</option>
                <option value="domestic-event">Domestic Event</option>
                <option value="international-event">International Event</option>
              </select>
              <select className={`${INPUT} max-w-[170px]`} value={factionFilter} onChange={(e) => setFactionFilter(e.target.value as typeof factionFilter)}>
                <option value="all">All factions</option>
                <option value="none">No faction</option>
                {CLASSIC_FACTION_ORDER.map((f) => <option key={f} value={f}>{CLASSIC_FACTIONS[f].name}</option>)}
              </select>
            </div>
            <p className="font-mono text-[10px] text-zinc-600 mb-3">{shown.length} shown</p>
            {shown.length === 0 && <p className="font-mono text-xs text-zinc-600 italic">no cards yet — add one on the left.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {shown.map((c) => (
                <div key={c.id} className="relative group">
                  <ClassicCardView card={c} />
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="font-mono text-[9px] uppercase border border-bg-line bg-bg-base/80 text-zinc-300 px-1.5 py-0.5 rounded-sm" onClick={() => selectDraft(c)}>edit</button>
                    {c.transcriptionStatus !== "verified" && (
                      <button className="font-mono text-[9px] uppercase border border-bg-line bg-bg-base/80 text-emerald-300 px-1.5 py-0.5 rounded-sm" onClick={() => updateStatus(c, "verified")}>verify</button>
                    )}
                    <button
                      className="font-mono text-[9px] uppercase border border-bg-line bg-bg-base/80 text-red-300 px-1.5 py-0.5 rounded-sm"
                      onClick={() => {
                        persist(removeCard(deck, c.id));
                        void removeCardFromServer(c.id);
                      }}
                    >
                      del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
