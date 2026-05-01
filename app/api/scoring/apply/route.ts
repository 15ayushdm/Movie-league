import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ApplyEvent {
  filmId: string;
  category: string;
  rawPoints: number;
  multiplier: number;
  sourceUrl?: string;
  notes?: string;
}

export async function POST(req: Request) {
  const { events } = (await req.json()) as { events: ApplyEvent[] };
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "No events to apply" }, { status: 400 });
  }

  const created = [];
  for (const e of events) {
    if (!e.filmId) continue;
    const finalPoints =
      Math.round(e.rawPoints * e.multiplier * 100) / 100;
    const row = await prisma.scoreEvent.create({
      data: {
        filmId: e.filmId,
        category: e.category,
        rawPoints: e.rawPoints,
        multiplier: e.multiplier,
        finalPoints,
        sourceUrl: e.sourceUrl ?? null,
        notes: e.notes ?? null,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "score_added",
        payload: JSON.stringify({
          scoreEventId: row.id,
          filmId: e.filmId,
          category: e.category,
          finalPoints,
          sourceUrl: e.sourceUrl,
        }),
      },
    });
    created.push(row);
  }

  return NextResponse.json({ ok: true, count: created.length });
}
