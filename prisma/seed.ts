import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MANAGERS = [
  "Alex",
  "Bailey",
  "Casey",
  "Dakota",
  "Emerson",
  "Finley",
  "Greer",
  "Harper",
];

async function main() {
  await prisma.leagueConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      seasonYear: 2026,
      draftDate: new Date("2026-06-15"),
      excludePreDraftReleases: true,
      excludedCeremonies: JSON.stringify(["cannes"]),
      rosterSize: 8,
      starterCount: 6,
      budgetCap: 200,
      sequelCap: 3,
    },
  });

  for (const name of MANAGERS) {
    await prisma.manager.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeded league config and 8 managers.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
