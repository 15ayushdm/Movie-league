import { prisma } from "./db";
import { bucketEvent, summarize, type PointsBreakdown } from "./scoring";

export interface ManagerStanding {
  id: string;
  name: string;
  filmCount: number;
  spend: number;
  breakdown: PointsBreakdown;
}

export async function getStandings(): Promise<ManagerStanding[]> {
  const managers = await prisma.manager.findMany({
    include: {
      films: {
        include: { scoreEvents: true },
      },
    },
  });

  const standings = managers.map((m) => {
    const allEvents = m.films.flatMap((f) => f.scoreEvents);
    const breakdown = summarize(allEvents);
    const spend = m.films.reduce((acc, f) => acc + f.auctionPrice, 0);
    return {
      id: m.id,
      name: m.name,
      filmCount: m.films.length,
      spend,
      breakdown,
    };
  });

  standings.sort((a, b) => b.breakdown.total - a.breakdown.total);
  return standings;
}

export async function getRecentScoreEvents(limit = 20) {
  return prisma.scoreEvent.findMany({
    where: { reversedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      film: {
        include: { manager: true },
      },
    },
  });
}

export async function getTeamWithFilms(managerId: string) {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: {
      films: {
        include: { scoreEvents: { orderBy: { createdAt: "desc" } } },
        orderBy: { auctionPrice: "desc" },
      },
    },
  });
  if (!manager) return null;

  const films = manager.films.map((f) => {
    const breakdown = summarize(f.scoreEvents);
    return { ...f, breakdown };
  });

  const totals = summarize(manager.films.flatMap((f) => f.scoreEvents));
  return { manager, films, totals };
}

export async function getRoster() {
  return prisma.film.findMany({
    include: { manager: true },
    orderBy: { title: "asc" },
  });
}

export { bucketEvent };
