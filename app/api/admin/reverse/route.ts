import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { id, undo } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = await prisma.scoreEvent.update({
    where: { id },
    data: { reversedAt: undo ? null : new Date() },
  });
  await prisma.auditLog.create({
    data: {
      action: undo ? "score_restored" : "score_reversed",
      payload: JSON.stringify({ scoreEventId: id }),
    },
  });
  return NextResponse.json({ ok: true, event: updated });
}
