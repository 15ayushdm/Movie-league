import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { filmId, category, rawPoints, multiplier, sourceUrl, notes } = body ?? {};
  if (!filmId || !category || typeof rawPoints !== "number" || typeof multiplier !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const finalPoints = Math.round(rawPoints * multiplier * 100) / 100;
  const ev = await prisma.scoreEvent.create({
    data: { filmId, category, rawPoints, multiplier, finalPoints, sourceUrl, notes },
  });
  await prisma.auditLog.create({
    data: {
      action: "score_added",
      payload: JSON.stringify({ scoreEventId: ev.id, source: "admin_manual", filmId, category, finalPoints }),
    },
  });
  return NextResponse.json({ ok: true, event: ev });
}
