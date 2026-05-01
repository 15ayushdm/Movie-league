import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { managerId, title, price, isSequel, productionBudget, releaseDate } = body ?? {};

  if (!managerId || !title || typeof price !== "number") {
    return NextResponse.json({ error: "managerId, title, price required" }, { status: 400 });
  }

  const film = await prisma.film.create({
    data: {
      managerId,
      title,
      auctionPrice: price,
      isSequel: !!isSequel,
      productionBudget: productionBudget ?? null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "draft_pick",
      payload: JSON.stringify({ filmId: film.id, managerId, title, price, isSequel }),
    },
  });

  return NextResponse.json({ ok: true, film });
}
