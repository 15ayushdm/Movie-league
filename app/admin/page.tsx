import { prisma } from "@/lib/db";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [films, recentEvents, managers] = await Promise.all([
    prisma.film.findMany({
      include: { manager: true },
      orderBy: [{ manager: { name: "asc" } }, { title: "asc" }],
    }),
    prisma.scoreEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { film: { include: { manager: true } } },
    }),
    prisma.manager.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminClient
      films={films.map((f) => ({
        id: f.id,
        title: f.title,
        managerId: f.managerId,
        managerName: f.manager.name,
        isSequel: f.isSequel,
        productionBudget: f.productionBudget,
        auctionPrice: f.auctionPrice,
      }))}
      recentEvents={recentEvents.map((e) => ({
        id: e.id,
        filmTitle: e.film.title,
        managerName: e.film.manager.name,
        category: e.category,
        finalPoints: e.finalPoints,
        sourceUrl: e.sourceUrl,
        createdAt: e.createdAt.toISOString(),
        reversedAt: e.reversedAt?.toISOString() ?? null,
      }))}
      managers={managers.map((m) => ({ id: m.id, name: m.name }))}
    />
  );
}
