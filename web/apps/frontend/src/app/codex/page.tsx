import Link from "next/link";
import { catalog } from "@hedgemony/spec";
import { FACTIONS, getPrimaryFactionAccent } from "@hedgemony/shared";
import type { Card, FactionId } from "@hedgemony/shared";

export default function CodexPage() {
  return (
    <main className="min-h-screen relative z-10 px-8 py-12 max-w-7xl mx-auto">
      <header className="mb-8 flex items-baseline justify-between border-b border-bg-line pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-openbrain mb-1">
            CARD CODEX · {catalog.action.length + catalog.investment.length + catalog.event.length} entries
          </p>
          <h1 className="font-serif text-3xl">Card Catalog</h1>
        </div>
        <Link href="/" className="font-mono text-sm text-zinc-400 hover:text-openbrain">
          ← back
        </Link>
      </header>

      <Section title="Action Cards" cards={catalog.action} />
      <Section title="Investment Cards" cards={catalog.investment} />
      <Section title="Event Cards" cards={catalog.event} />
    </main>
  );
}

function Section({ title, cards }: { title: string; cards: Card[] }) {
  return (
    <section className="mb-12">
      <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
        {title} · {cards.length}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c) => (
          <CardChip key={`${c.type}:${c.id}`} card={c} />
        ))}
      </div>
    </section>
  );
}

function CardChip({ card }: { card: Card }) {
  const accent = getPrimaryFactionAccent(card);
  const costString = formatCost(card.cost);

  return (
    <article
      className="border border-bg-line bg-bg-card rounded-sm p-3 hover:bg-bg-panel transition-colors"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
          {card.id} · {card.category}
          {card.singleUse ? " · single-use" : ""}
        </span>
        {costString && (
          <span className="font-mono text-xs text-zinc-300">{costString}</span>
        )}
      </div>
      <h3 className="font-sans text-sm font-semibold leading-snug mb-1.5">{card.name}</h3>
      <p className="font-sans text-xs text-zinc-400 leading-snug line-clamp-3">{card.effect.raw}</p>
      {card.factions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.factions.map((f) => (
            <FactionPill key={f} faction={f} />
          ))}
        </div>
      )}
    </article>
  );
}

function FactionPill({ faction }: { faction: FactionId }) {
  const f = FACTIONS[faction];
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border"
      style={{ color: f.accentColor, borderColor: f.accentColor + "55" }}
    >
      {f.shortName}
    </span>
  );
}

function formatCost(cost: Card["cost"]): string {
  const parts: string[] = [];
  for (const k of ["K", "C", "T", "E", "A", "P"] as const) {
    const v = cost[k];
    if (v) parts.push(`${v} ${k}`);
  }
  return parts.join(" + ");
}
