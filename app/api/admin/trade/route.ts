import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { filmAId, filmBId } = await req.json();
  if (!filmAId || !filmBId || filmAId === filmBId) {
    return NextResponse.json({ error: "Need two distinct film ids" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const a = await tx.film.findUniqueOrThrow({ where: { id: filmAId } });
    const b = await tx.film.findUniqueOrThrow({ where: { id: filmBId } });
    await tx.film.update({ where: { id: filmAId }, data: { managerId: b.managerId } });
    await tx.film.update({ where: { id: filmBId }, data: { managerId: a.managerId } });
    await tx.auditLog.create({
      data: {
        action: "trade",
        payload: JSON.stringify({
          filmA: { id: a.id, fromManager: a.managerId, toManager: b.managerId },
          filmB: { id: b.id, fromManager: b.managerId, toManager: a.managerId },
        }),
      },
    });
    return { ok: true };
  });

  return NextResponse.json(result);
}
