"use client";

/* eslint-disable @next/next/no-img-element */
import { CLASSIC_FACTIONS, type ClassicFactionId, type ClassicCard } from "@hedgemony/shared";

const TYPE_LABEL: Record<ClassicCard["type"], string> = {
  action: "Action",
  investment: "Investment",
  "domestic-event": "Domestic Event",
  "international-event": "International Event",
};

const TYPE_TONE: Record<ClassicCard["type"], string> = {
  action: "from-sky-500/20 to-bg-card",
  investment: "from-amber-400/20 to-bg-card",
  "domestic-event": "from-fuchsia-400/15 to-bg-card",
  "international-event": "from-emerald-400/15 to-bg-card",
};

/** Renders a typed digital card in the physical-card style. */
export function ClassicCardView({ card }: { card: ClassicCard }) {
  const accent = card.faction ? CLASSIC_FACTIONS[card.faction as ClassicFactionId]?.accentColor : "#a1a1aa";
  const factionName = card.faction ? CLASSIC_FACTIONS[card.faction as ClassicFactionId]?.name : "—";
  const statusLabel =
    card.transcriptionStatus === "verified"
      ? "Verified"
      : card.transcriptionStatus === "ocr-draft"
        ? "OCR draft"
        : card.transcriptionStatus === "photo-only"
          ? "Photo only"
          : null;
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b ${TYPE_TONE[card.type]} border border-bg-line rounded-md p-3 flex flex-col gap-2 min-h-[320px] shadow-[0_12px_30px_rgba(0,0,0,0.24)]`}
      style={{ borderTopColor: accent, borderTopWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: accent }}>
            {TYPE_LABEL[card.type]}{card.faction ? `: ${factionName}` : ""}
          </span>
          <p className="font-mono text-[10px] text-zinc-500 mt-0.5 truncate">{card.id}</p>
        </div>
        {card.imagePath && (
          <a
            href={card.imagePath}
            target="_blank"
            rel="noreferrer"
            title="Open photographed card"
            className="shrink-0 block rounded-sm overflow-hidden border border-bg-line bg-bg-base hover:border-amber-500/70 transition-colors"
          >
            <img
              src={card.imagePath}
              alt=""
              loading="lazy"
              className="h-16 w-11 object-cover"
            />
          </a>
        )}
      </div>
      <p className="font-serif text-lg text-zinc-100 leading-tight">{card.title || "(untitled)"}</p>
      <div className="flex flex-wrap gap-2 font-mono text-[10px] text-zinc-400">
        {card.costRp != null && <span className="border border-bg-line rounded-sm px-1.5 py-0.5">{card.costRp} RP</span>}
        {card.resolution && <span className="border border-bg-line rounded-sm px-1.5 py-0.5">{card.resolution}</span>}
        {card.aor && <span className="border border-bg-line rounded-sm px-1.5 py-0.5">AOR: {card.aor}</span>}
        <span className="border border-bg-line rounded-sm px-1.5 py-0.5">{card.isPublic === false ? "Private" : "Public"}</span>
        {card.effects?.length ? <span className="border border-emerald-500/50 text-emerald-300 rounded-sm px-1.5 py-0.5">{card.effects.length} auto</span> : null}
        {statusLabel && <span className="border border-bg-line rounded-sm px-1.5 py-0.5">{statusLabel}</span>}
        {card.sourcePhoto && <span className="border border-bg-line rounded-sm px-1.5 py-0.5">{card.sourcePhoto}</span>}
      </div>
      <p className="font-sans text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap flex-1 overflow-hidden">
        {card.text || <span className="text-zinc-600 italic">no text yet</span>}
      </p>
      {card.imagePath && (
        <a href={card.imagePath} target="_blank" rel="noreferrer"
          className="font-mono text-[10px] text-amber-300 hover:text-amber-200 border-t border-bg-line pt-2">
          Open photo reference
        </a>
      )}
    </div>
  );
}
