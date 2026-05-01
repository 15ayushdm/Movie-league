import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { dropFilmId, newTitle, isSequel } = await req.json();
  if (!dropFilmId || !newTitle) {
    return NextResponse.json({ error: "dropFilmId and newTitle required" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const drop = await tx.film.findUniqueOrThrow({ where: { id: dropFilmId } });
    // Reverse all unreversed score events for the dropped film.
    await tx.scoreEvent.updateMany({
      where: { filmId: dropFilmId, reversedAt: null },
      data: { reversedAt: new Date() },
    });
    const newFilm = await tx.film.create({
      data: {
        managerId: drop.managerId,
        title: newTitle,
        auctionPrice: 0,
        isSequel: !!isSequel,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "october_swap",
        payload: JSON.stringify({
          dropped: { id: drop.id, title: drop.title },
          added: { id: newFilm.id, title: newFilm.title },
          managerId: drop.managerId,
        }),
      },
    });
    return { ok: true, newFilm };
  });

  return NextResponse.json(result);
}
