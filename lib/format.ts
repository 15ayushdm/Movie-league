// Map raw category strings into human-readable labels.
export function formatCategory(category: string): string {
  if (category.startsWith("box_office_tier_")) {
    const m = category.match(/box_office_tier_(\d+)M/);
    return m ? `Box office ≥ $${m[1]}M` : category;
  }
  if (category === "sleeper_bonus") return "Sleeper bonus";
  if (category === "opening_weekend_no1") return "Opening weekend #1";

  const awardsMatch = category.match(/^([a-z_]+)_(nom|win)_([a-z_]+)$/);
  if (awardsMatch) {
    const [, ceremony, kind, oscarCat] = awardsMatch;
    const ceremonyLabel = ceremony.replace(/_/g, " ");
    const catLabel = oscarCat.replace(/_/g, " ");
    return `${ceremonyLabel} — ${kind === "win" ? "Win" : "Nom"} — ${catLabel}`;
  }
  return category;
}
