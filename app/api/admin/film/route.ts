import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { filmId, isSequel, productionBudget } = await req.json();
  if (!filmId) return NextResponse.json({ error: "filmId required" }, { status: 400 });
  const film = await prisma.film.update({
    where: { id: filmId },
    data: {
      isSequel: typeof isSequel === "boolean" ? isSequel : undefined,
      productionBudget: productionBudget ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "film_metadata_edited",
      payload: JSON.stringify({ filmId, isSequel: film.isSequel, productionBudget: film.productionBudget }),
    },
  });
  return NextResponse.json({ ok: true, film });
}
