import { describe, expect, it } from "vitest";
import {
  calculateAwardsPoints,
  calculateBoxOfficePoints,
  calculateSleeperBonus,
  summarize,
} from "./scoring";

const original = {
  id: "f1",
  title: "Test Original",
  isSequel: false,
  productionBudget: 80,
};

const sequel = {
  id: "f2",
  title: "Test Sequel",
  isSequel: true,
  productionBudget: 200,
};

describe("box office", () => {
  it("original-IP film grossing $250M earns 30 BO points", () => {
    const events = calculateBoxOfficePoints(original, 250, new Set());
    const total = events.reduce((acc, e) => acc + e.finalPoints, 0);
    expect(total).toBe(30); // 5 + 10 + 15
  });

  it("sequel grossing $250M earns 22.5 BO points (30 × 0.75)", () => {
    const events = calculateBoxOfficePoints(sequel, 250, new Set());
    const total = events.reduce((acc, e) => acc + e.finalPoints, 0);
    expect(total).toBe(22.5);
  });

  it("does not double-count tiers already recorded", () => {
    const recorded = new Set(["box_office_tier_50M", "box_office_tier_100M"]);
    const events = calculateBoxOfficePoints(original, 250, recorded);
    expect(events.map((e) => e.category)).toEqual(["box_office_tier_200M"]);
  });
});

describe("awards", () => {
  it("original-IP Best Picture nomination = 62.5", () => {
    const r = calculateAwardsPoints(original, "oscars", "best_picture", false);
    expect(r.finalPoints).toBe(62.5); // 50 × 1.25
  });

  it("Golden Globes win for original-IP Best (lead category) = 56.25", () => {
    // 150 × 0.3 × 1.25 — using best_picture as the lead category equivalent
    const r = calculateAwardsPoints(original, "golden_globes", "best_picture", true);
    expect(r.finalPoints).toBe(56.25);
  });

  it("sequel Best Picture nom = 50 (no original-IP bonus)", () => {
    const r = calculateAwardsPoints(sequel, "oscars", "best_picture", false);
    expect(r.finalPoints).toBe(50);
  });
});

describe("sleeper bonus", () => {
  it("sub-$40M original film crossing $100M earns 20 bonus points", () => {
    const film = { ...original, productionBudget: 35 };
    const bonus = calculateSleeperBonus(film, 100, false);
    expect(bonus?.finalPoints).toBe(20);
  });

  it("returns null for sequels", () => {
    const film = { ...sequel, productionBudget: 35 };
    expect(calculateSleeperBonus(film, 200, false)).toBeNull();
  });

  it("returns null when already awarded", () => {
    const film = { ...original, productionBudget: 35 };
    expect(calculateSleeperBonus(film, 150, true)).toBeNull();
  });

  it("returns null when budget over cap", () => {
    expect(calculateSleeperBonus(original, 200, false)).toBeNull();
  });
});

describe("summarize", () => {
  it("buckets events into BO / awards / bonus and totals", () => {
    const breakdown = summarize([
      { category: "box_office_tier_50M", finalPoints: 5, reversedAt: null },
      { category: "box_office_tier_100M", finalPoints: 10, reversedAt: null },
      { category: "oscars_nom_best_picture", finalPoints: 62.5, reversedAt: null },
      { category: "sleeper_bonus", finalPoints: 20, reversedAt: null },
      { category: "box_office_tier_200M", finalPoints: 15, reversedAt: new Date() },
    ]);
    expect(breakdown.boxOffice).toBe(15);
    expect(breakdown.awards).toBe(62.5);
    expect(breakdown.bonus).toBe(20);
    expect(breakdown.total).toBe(97.5);
  });
});
