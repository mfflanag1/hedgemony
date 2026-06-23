import { NextResponse } from "next/server";
import { getDb, schema } from "@hedgemony/db";
import { eq } from "drizzle-orm";
import type { ClassicCard } from "@hedgemony/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ cards: [], persistence: "disabled" }, { status: 200 });
  try {
    const rows = await db.select().from(schema.classicCards).orderBy(schema.classicCards.id);
    return NextResponse.json({ cards: rows.map((row) => row.card), persistence: "database" });
  } catch (err) {
    return NextResponse.json({ cards: [], persistence: "error", error: (err as Error).message }, { status: 200 });
  }
}

export async function PUT(req: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ ok: false, persistence: "disabled" }, { status: 200 });
  try {
    const body = await req.json() as { cards?: ClassicCard[] };
    const cards = Array.isArray(body.cards) ? body.cards.filter(isCard).slice(0, 1000) : [];
    const now = new Date();
    for (const card of cards) {
      await db
        .insert(schema.classicCards)
        .values({ id: card.id, card, updatedAt: now })
        .onConflictDoUpdate({
          target: schema.classicCards.id,
          set: { card, updatedAt: now },
        });
    }
    return NextResponse.json({ ok: true, persistence: "database", count: cards.length });
  } catch (err) {
    return NextResponse.json({ ok: false, persistence: "error", error: (err as Error).message }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ ok: false, persistence: "disabled" }, { status: 200 });
  try {
    const { id } = await req.json() as { id?: string };
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    await db.delete(schema.classicCards).where(eq(schema.classicCards.id, id));
    return NextResponse.json({ ok: true, persistence: "database" });
  } catch (err) {
    return NextResponse.json({ ok: false, persistence: "error", error: (err as Error).message }, { status: 200 });
  }
}

function isCard(card: unknown): card is ClassicCard {
  return !!card
    && typeof card === "object"
    && typeof (card as ClassicCard).id === "string"
    && typeof (card as ClassicCard).title === "string"
    && typeof (card as ClassicCard).text === "string";
}
