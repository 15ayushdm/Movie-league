import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DemoPick {
  manager: string;
  title: string;
  price: number;
  isSequel: boolean;
  budget?: number;
}

const PICKS: DemoPick[] = [
  { manager: "Alex",    title: "Avatar: Fire and Ash",      price: 52, isSequel: true,  budget: 250 },
  { manager: "Alex",    title: "The Bride!",                 price: 28, isSequel: false, budget: 60 },
  { manager: "Alex",    title: "Mickey 17",                  price: 22, isSequel: false, budget: 118 },
  { manager: "Alex",    title: "The Smashing Machine",       price: 14, isSequel: false, budget: 50 },

  { manager: "Bailey",  title: "Mission: Impossible 8",      price: 48, isSequel: true,  budget: 290 },
  { manager: "Bailey",  title: "Wicked: For Good",           price: 44, isSequel: true,  budget: 150 },
  { manager: "Bailey",  title: "Sinners",                    price: 18, isSequel: false, budget: 90 },
  { manager: "Bailey",  title: "A Big Bold Beautiful Journey",price: 9,  isSequel: false, budget: 35 },

  { manager: "Casey",   title: "Superman",                   price: 41, isSequel: true,  budget: 225 },
  { manager: "Casey",   title: "Wuthering Heights",          price: 19, isSequel: false, budget: 75 },
  { manager: "Casey",   title: "Marty Supreme",              price: 17, isSequel: false, budget: 30 },
  { manager: "Casey",   title: "After the Hunt",             price: 12, isSequel: false, budget: 22 },

  { manager: "Dakota",  title: "Zootopia 2",                 price: 38, isSequel: true,  budget: 180 },
  { manager: "Dakota",  title: "Bugonia",                    price: 21, isSequel: false, budget: 35 },
  { manager: "Dakota",  title: "Tron: Ares",                 price: 16, isSequel: true,  budget: 170 },
  { manager: "Dakota",  title: "Black Bag",                  price: 11, isSequel: false, budget: 50 },

  { manager: "Emerson", title: "Jurassic World Rebirth",     price: 36, isSequel: true,  budget: 180 },
  { manager: "Emerson", title: "One Battle After Another",   price: 26, isSequel: false, budget: 130 },
  { manager: "Emerson", title: "Tron: Ares",                 price: 0,  isSequel: true,  budget: 170 },
  { manager: "Emerson", title: "The Roses",                  price: 7,  isSequel: false, budget: 25 },

  { manager: "Finley",  title: "Frankenstein",               price: 27, isSequel: false, budget: 120 },
  { manager: "Finley",  title: "Hamnet",                     price: 23, isSequel: false, budget: 38 },
  { manager: "Finley",  title: "The Running Man",            price: 19, isSequel: true,  budget: 110 },
  { manager: "Finley",  title: "Eternity",                   price: 9,  isSequel: false, budget: 40 },

  { manager: "Greer",   title: "Tron: Ares",                 price: 0,  isSequel: true,  budget: 170 },
  { manager: "Greer",   title: "F1",                         price: 33, isSequel: false, budget: 200 },
  { manager: "Greer",   title: "Nouvelle Vague",             price: 10, isSequel: false, budget: 14 },
  { manager: "Greer",   title: "Train Dreams",               price: 8,  isSequel: false, budget: 18 },

  { manager: "Harper",  title: "How to Train Your Dragon",   price: 31, isSequel: true,  budget: 150 },
  { manager: "Harper",  title: "Kiss of the Spider Woman",   price: 18, isSequel: false, budget: 35 },
  { manager: "Harper",  title: "Honey Don't!",               price: 13, isSequel: false, budget: 28 },
  { manager: "Harper",  title: "Roofman",                    price: 9,  isSequel: false, budget: 22 },
];

interface ScoreSeed {
  filmTitle: string;
  category: string;
  rawPoints: number;
  multiplier: number;
  sourceUrl: string;
  notes: string;
}

const SCORES: ScoreSeed[] = [
  // Avatar 3 — sequel, big BO
  { filmTitle: "Avatar: Fire and Ash", category: "box_office_tier_50M",  rawPoints: 5,  multiplier: 0.75, sourceUrl: "https://www.boxofficemojo.com/title/avatar3/", notes: "Crossed $50M domestic" },
  { filmTitle: "Avatar: Fire and Ash", category: "box_office_tier_100M", rawPoints: 10, multiplier: 0.75, sourceUrl: "https://www.boxofficemojo.com/title/avatar3/", notes: "Crossed $100M domestic" },
  { filmTitle: "Avatar: Fire and Ash", category: "box_office_tier_200M", rawPoints: 15, multiplier: 0.75, sourceUrl: "https://www.boxofficemojo.com/title/avatar3/", notes: "Crossed $200M domestic" },

  // Wicked 2
  { filmTitle: "Wicked: For Good", category: "box_office_tier_50M",  rawPoints: 5,  multiplier: 0.75, sourceUrl: "https://variety.com/wicked-2-opening", notes: "Opening weekend > $50M" },
  { filmTitle: "Wicked: For Good", category: "box_office_tier_100M", rawPoints: 10, multiplier: 0.75, sourceUrl: "https://variety.com/wicked-2-week2",   notes: "Crossed $100M" },
  { filmTitle: "Wicked: For Good", category: "opening_weekend_no1",  rawPoints: 5,  multiplier: 1.0,  sourceUrl: "https://variety.com/wicked-2-opening", notes: "#1 opening" },

  // Sinners — sleeper
  { filmTitle: "Sinners", category: "box_office_tier_50M",  rawPoints: 5,  multiplier: 1.0, sourceUrl: "https://www.boxofficemojo.com/title/sinners",   notes: "Crossed $50M" },
  { filmTitle: "Sinners", category: "box_office_tier_100M", rawPoints: 10, multiplier: 1.0, sourceUrl: "https://www.boxofficemojo.com/title/sinners",   notes: "Crossed $100M" },
  // Note: Sinners budget is 90M so not eligible for sleeper (≤40M cap)

  // F1
  { filmTitle: "F1", category: "box_office_tier_50M",  rawPoints: 5,  multiplier: 1.0, sourceUrl: "https://deadline.com/f1-bo", notes: "Crossed $50M" },
  { filmTitle: "F1", category: "box_office_tier_100M", rawPoints: 10, multiplier: 1.0, sourceUrl: "https://deadline.com/f1-bo", notes: "Crossed $100M" },
  { filmTitle: "F1", category: "box_office_tier_200M", rawPoints: 15, multiplier: 1.0, sourceUrl: "https://deadline.com/f1-bo", notes: "Crossed $200M" },

  // Superman
  { filmTitle: "Superman", category: "box_office_tier_50M",  rawPoints: 5,  multiplier: 0.75, sourceUrl: "https://www.boxofficemojo.com/title/superman", notes: "Opening weekend" },
  { filmTitle: "Superman", category: "box_office_tier_100M", rawPoints: 10, multiplier: 0.75, sourceUrl: "https://www.boxofficemojo.com/title/superman", notes: "Crossed $100M" },
  { filmTitle: "Superman", category: "box_office_tier_200M", rawPoints: 15, multiplier: 0.75, sourceUrl: "https://www.boxofficemojo.com/title/superman", notes: "Crossed $200M" },
  { filmTitle: "Superman", category: "opening_weekend_no1",  rawPoints: 5,  multiplier: 1.0,  sourceUrl: "https://www.boxofficemojo.com/title/superman", notes: "#1 opening" },

  // Awards — Oscar noms
  { filmTitle: "Hamnet",                 category: "oscars_nom_best_picture",      rawPoints: 50, multiplier: 1.25, sourceUrl: "https://www.oscars.org/2026-noms", notes: "Best Picture nomination" },
  { filmTitle: "Hamnet",                 category: "oscars_nom_lead_actress",      rawPoints: 35, multiplier: 1.25, sourceUrl: "https://www.oscars.org/2026-noms", notes: "Lead Actress nomination" },
  { filmTitle: "One Battle After Another", category: "oscars_nom_best_picture",    rawPoints: 50, multiplier: 1.25, sourceUrl: "https://www.oscars.org/2026-noms", notes: "Best Picture nomination" },
  { filmTitle: "One Battle After Another", category: "oscars_nom_director",        rawPoints: 35, multiplier: 1.25, sourceUrl: "https://www.oscars.org/2026-noms", notes: "Director nomination" },
  { filmTitle: "Sinners",                category: "oscars_nom_original_screenplay", rawPoints: 25, multiplier: 1.25, sourceUrl: "https://www.oscars.org/2026-noms", notes: "Original Screenplay nomination" },
  { filmTitle: "Frankenstein",           category: "golden_globes_win_best_picture", rawPoints: 45, multiplier: 1.25, sourceUrl: "https://www.goldenglobes.com/2026", notes: "150 × 0.3 = 45 (Drama)" },
  { filmTitle: "Marty Supreme",          category: "oscars_nom_lead_actor",        rawPoints: 35, multiplier: 1.25, sourceUrl: "https://www.oscars.org/2026-noms", notes: "Lead Actor nomination" },
  { filmTitle: "Bugonia",                category: "oscars_nom_supporting_actress",rawPoints: 25, multiplier: 1.25, sourceUrl: "https://www.oscars.org/2026-noms", notes: "Supporting Actress nomination" },
];

async function main() {
  // Wipe existing demo data
  await prisma.scoreEvent.deleteMany();
  await prisma.film.deleteMany();
  await prisma.auditLog.deleteMany();

  const managers = await prisma.manager.findMany();
  const byName = new Map(managers.map((m) => [m.name, m]));

  for (const pick of PICKS) {
    const m = byName.get(pick.manager);
    if (!m) throw new Error(`Unknown manager ${pick.manager}`);
    await prisma.film.create({
      data: {
        managerId: m.id,
        title: pick.title,
        auctionPrice: pick.price,
        isSequel: pick.isSequel,
        productionBudget: pick.budget ?? null,
      },
    });
  }

  const films = await prisma.film.findMany();
  const byTitle = new Map<string, string[]>();
  for (const f of films) {
    const ids = byTitle.get(f.title) ?? [];
    ids.push(f.id);
    byTitle.set(f.title, ids);
  }

  // Spread events across past 12 days for realistic timestamps
  const now = Date.now();
  let i = 0;
  for (const s of SCORES) {
    const ids = byTitle.get(s.filmTitle) ?? [];
    for (const filmId of ids) {
      const finalPoints = Math.round(s.rawPoints * s.multiplier * 100) / 100;
      const minutesAgo = i * 47 + Math.floor(Math.random() * 30);
      i++;
      await prisma.scoreEvent.create({
        data: {
          filmId,
          category: s.category,
          rawPoints: s.rawPoints,
          multiplier: s.multiplier,
          finalPoints,
          sourceUrl: s.sourceUrl,
          notes: s.notes,
          createdAt: new Date(now - minutesAgo * 60_000),
        },
      });
    }
  }

  console.log(`Seeded ${PICKS.length} films and ${SCORES.length} score event templates.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
