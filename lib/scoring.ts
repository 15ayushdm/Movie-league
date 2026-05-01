// Movie Fantasy League scoring engine.
// Owns every rule used to convert raw events into ScoreEvent rows.
// The engine is pure: it never writes to the DB. API routes do the writing.

export const BOX_OFFICE_TIERS = [
  { threshold: 50, points: 5 },
  { threshold: 100, points: 10 },
  { threshold: 200, points: 15 },
  { threshold: 300, points: 20 },
  { threshold: 400, points: 25 },
  { threshold: 500, points: 30 },
] as const;

export const OSCAR_WEIGHTS = {
  best_picture: { win: 150, nom: 50 },
  director: { win: 100, nom: 35 },
  lead_actor: { win: 100, nom: 35 },
  lead_actress: { win: 100, nom: 35 },
  supporting_actor: { win: 75, nom: 25 },
  supporting_actress: { win: 75, nom: 25 },
  original_screenplay: { win: 75, nom: 25 },
  adapted_screenplay: { win: 75, nom: 25 },
  below_the_line: { win: 20, nom: 5 },
} as const;

export type OscarCategory = keyof typeof OSCAR_WEIGHTS;

export const OTHER_CEREMONY_MULTIPLIER = 0.3;
export const ELIGIBLE_CEREMONIES = [
  "oscars",
  "golden_globes",
  "bafta",
  "sag",
  "venice",
  "berlin",
  "critics_choice",
] as const;
export type Ceremony = (typeof ELIGIBLE_CEREMONIES)[number];

export const SEQUEL_BO_MULTIPLIER = 0.75;
export const ORIGINAL_IP_AWARDS_MULTIPLIER = 1.25;
export const SLEEPER_BONUS = { budgetCap: 40, grossThreshold: 100, points: 20 };
export const OPENING_WEEKEND_NUMBER_ONE = 5;

// ---- Category enum used in ScoreEvent.category ----

export const BOX_OFFICE_CATEGORIES = BOX_OFFICE_TIERS.map(
  (t) => `box_office_tier_${t.threshold}M` as const,
);

export type ScoreCategory =
  | (typeof BOX_OFFICE_CATEGORIES)[number]
  | "sleeper_bonus"
  | "opening_weekend_no1"
  | `${Ceremony}_nom_${OscarCategory}`
  | `${Ceremony}_win_${OscarCategory}`;

// ---- Inputs ----

export interface FilmInput {
  id: string;
  title: string;
  isSequel: boolean;
  productionBudget: number | null;
}

export interface ProposedEvent {
  filmId: string;
  category: string;
  rawPoints: number;
  multiplier: number;
  finalPoints: number;
  reasoning?: string;
}

// ---- Box office tiers ----

/**
 * Returns proposed events for every box office tier the film has crossed
 * but does NOT yet have a recorded ScoreEvent for.
 */
export function calculateBoxOfficePoints(
  film: FilmInput,
  currentDomesticGrossM: number,
  alreadyRecordedCategories: Set<string>,
): ProposedEvent[] {
  const events: ProposedEvent[] = [];
  for (const tier of BOX_OFFICE_TIERS) {
    const category = `box_office_tier_${tier.threshold}M`;
    if (currentDomesticGrossM < tier.threshold) continue;
    if (alreadyRecordedCategories.has(category)) continue;

    const multiplier = film.isSequel ? SEQUEL_BO_MULTIPLIER : 1.0;
    events.push({
      filmId: film.id,
      category,
      rawPoints: tier.points,
      multiplier,
      finalPoints: round2(tier.points * multiplier),
      reasoning: `Crossed $${tier.threshold}M domestic${film.isSequel ? " (sequel 0.75×)" : ""}`,
    });
  }
  return events;
}

// ---- Awards ----

/**
 * Calculates points for a single award outcome (nom or win) at a given ceremony.
 * For Oscars, full weight. For other eligible ceremonies, 30% of Oscar weight.
 * Original-IP films get 1.25× on awards points.
 */
export function calculateAwardsPoints(
  film: FilmInput,
  ceremony: Ceremony,
  category: OscarCategory,
  isWin: boolean,
): { rawPoints: number; multiplier: number; finalPoints: number } {
  const weights = OSCAR_WEIGHTS[category];
  const base = isWin ? weights.win : weights.nom;
  const ceremonyMult = ceremony === "oscars" ? 1 : OTHER_CEREMONY_MULTIPLIER;
  const rawPoints = base * ceremonyMult;
  const multiplier = film.isSequel ? 1.0 : ORIGINAL_IP_AWARDS_MULTIPLIER;
  return {
    rawPoints: round2(rawPoints),
    multiplier,
    finalPoints: round2(rawPoints * multiplier),
  };
}

// ---- Sleeper bonus ----

export function calculateSleeperBonus(
  film: FilmInput,
  currentDomesticGrossM: number,
  alreadyAwarded: boolean,
): ProposedEvent | null {
  if (alreadyAwarded) return null;
  if (film.isSequel) return null;
  if (film.productionBudget == null) return null;
  if (film.productionBudget > SLEEPER_BONUS.budgetCap) return null;
  if (currentDomesticGrossM < SLEEPER_BONUS.grossThreshold) return null;

  return {
    filmId: film.id,
    category: "sleeper_bonus",
    rawPoints: SLEEPER_BONUS.points,
    multiplier: 1.0,
    finalPoints: SLEEPER_BONUS.points,
    reasoning: `Original-IP film with budget ≤ $${SLEEPER_BONUS.budgetCap}M crossed $${SLEEPER_BONUS.grossThreshold}M`,
  };
}

// ---- Helpers ----

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Aggregate a collection of (non-reversed) events into per-source totals.
export interface PointsBreakdown {
  boxOffice: number;
  awards: number;
  bonus: number;
  total: number;
}

export function bucketEvent(category: string): keyof PointsBreakdown {
  if (category.startsWith("box_office_tier_")) return "boxOffice";
  if (category === "sleeper_bonus" || category === "opening_weekend_no1") return "bonus";
  return "awards";
}

export function summarize(
  events: { category: string; finalPoints: number; reversedAt: Date | null }[],
): PointsBreakdown {
  const out: PointsBreakdown = { boxOffice: 0, awards: 0, bonus: 0, total: 0 };
  for (const e of events) {
    if (e.reversedAt) continue;
    const bucket = bucketEvent(e.category);
    if (bucket !== "total") out[bucket] += e.finalPoints;
    out.total += e.finalPoints;
  }
  out.boxOffice = round2(out.boxOffice);
  out.awards = round2(out.awards);
  out.bonus = round2(out.bonus);
  out.total = round2(out.total);
  return out;
}
