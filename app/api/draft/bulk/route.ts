import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface BulkPick {
  managerName: string;
  title: string;
  price: number;
  isSequel: boolean;
}

export async function POST(req: Request) {
  const { picks } = (await req.json()) as { picks: BulkPick[] };
  if (!Array.isArray(picks) || picks.length === 0) {
    return NextResponse.json({ error: "No picks" }, { status: 400 });
  }

  const managers = await prisma.manager.findMany();
  const byName = new Map(managers.map((m) => [m.name.toLowerCase(), m]));

  const created: string[] = [];
  for (const p of picks) {
    const m = byName.get(p.managerName.toLowerCase());
    if (!m) {
      return NextResponse.json({ error: `Unknown manager: ${p.managerName}` }, { status: 400 });
    }
    const film = await prisma.film.create({
      data: {
        managerId: m.id,
        title: p.title,
        auctionPrice: p.price,
        isSequel: !!p.isSequel,
      },
    });
    created.push(film.id);
    await prisma.auditLog.create({
      data: {
        action: "draft_pick",
        payload: JSON.stringify({
          filmId: film.id,
          managerId: m.id,
          title: p.title,
          price: p.price,
          isSequel: p.isSequel,
          source: "bulk",
        }),
      },
    });
  }

  return NextResponse.json({ ok: true, count: created.length });
}
