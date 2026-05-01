import { prisma } from "@/lib/db";
import { DraftClient } from "./DraftClient";

export const dynamic = "force-dynamic";

export default async function DraftPage() {
  const [managers, films, config] = await Promise.all([
    prisma.manager.findMany({ orderBy: { name: "asc" } }),
    prisma.film.findMany({ include: { manager: true }, orderBy: { createdAt: "desc" } }),
    prisma.leagueConfig.findUnique({ where: { id: "singleton" } }),
  ]);

  const totals = managers.map((m) => {
    const owned = films.filter((f) => f.managerId === m.id);
    return {
      managerId: m.id,
      name: m.name,
      filmCount: owned.length,
      spend: owned.reduce((a, f) => a + f.auctionPrice, 0),
      sequelCount: owned.filter((f) => f.isSequel).length,
    };
  });

  return (
    <DraftClient
      managers={managers.map((m) => ({ id: m.id, name: m.name }))}
      totals={totals}
      films={films.map((f) => ({
        id: f.id,
        title: f.title,
        managerName: f.manager.name,
        price: f.auctionPrice,
        isSequel: f.isSequel,
      }))}
      config={
        config
          ? {
              budgetCap: config.budgetCap,
              rosterSize: config.rosterSize,
              sequelCap: config.sequelCap,
              draftDate: config.draftDate.toISOString(),
            }
          : null
      }
    />
  );
}
