// Builds the system prompt used by the /scoring chat. Includes the full
// scoring rubric inline + the league roster, then directives for output shape.

import {
  BOX_OFFICE_TIERS,
  ELIGIBLE_CEREMONIES,
  ORIGINAL_IP_AWARDS_MULTIPLIER,
  OSCAR_WEIGHTS,
  OTHER_CEREMONY_MULTIPLIER,
  SEQUEL_BO_MULTIPLIER,
  SLEEPER_BONUS,
} from "./scoring";

export interface RosterFilm {
  id: string;
  title: string;
  managerName: string;
  isSequel: boolean;
}

export function buildScoringSystemPrompt(
  roster: RosterFilm[],
  config: { seasonYear: number; excludedCeremonies: string[] },
): string {
  const rosterLines = roster
    .map(
      (f) =>
        `- "${f.title}" — owner: ${f.managerName} — ${f.isSequel ? "SEQUEL/IP-CONT" : "ORIGINAL-IP"}`,
    )
    .join("\n");

  const oscarLines = Object.entries(OSCAR_WEIGHTS)
    .map(([cat, w]) => `  - ${cat}: ${w.nom} nom / ${w.win} win`)
    .join("\n");

  const tierLines = BOX_OFFICE_TIERS.map(
    (t) => `  - ≥ $${t.threshold}M domestic = ${t.points} pts`,
  ).join("\n");

  return `You are the scoring assistant for a private movie fantasy auction league (${config.seasonYear} season).

When the user pastes a URL, fetch it with the web_fetch tool, identify any films from the league roster, and compute the appropriate score events using the rubric below. Return ONLY a single JSON code block matching the schema. No prose outside the code block.

LEAGUE ROSTER (only propose scoring for these exact titles):
${rosterLines}

SCORING RUBRIC:

Box office tiers (each tier awards points once when the film crosses it, domestic gross in $M):
${tierLines}
Sequel multiplier on box office: ${SEQUEL_BO_MULTIPLIER}× (raw_points × 0.75).

Awards — Oscar weights (nominations / wins):
${oscarLines}

Other ceremonies score at ${OTHER_CEREMONY_MULTIPLIER}× the Oscar weight. Eligible ceremonies: ${ELIGIBLE_CEREMONIES.filter(
    (c) => !config.excludedCeremonies.includes(c),
  ).join(", ")}.
EXCLUDED ceremonies for this season: ${config.excludedCeremonies.join(", ") || "(none)"}.

Original-IP films get a ${ORIGINAL_IP_AWARDS_MULTIPLIER}× bonus on awards points (not box office).

Sleeper bonus: ${SLEEPER_BONUS.points} points if an ORIGINAL-IP film with production budget ≤ $${SLEEPER_BONUS.budgetCap}M crosses $${SLEEPER_BONUS.grossThreshold}M domestic.

CATEGORY ENUM (use exactly one of these for each event):
- box_office_tier_50M, box_office_tier_100M, box_office_tier_200M, box_office_tier_300M, box_office_tier_400M, box_office_tier_500M
- sleeper_bonus, opening_weekend_no1
- For awards, use \`<ceremony>_<nom|win>_<oscar_category>\`. Example: oscars_nom_best_picture, golden_globes_win_lead_actor.

DIRECTIVES:
1. Only propose events for films currently on the roster. If you see a film not on the roster, list it under unmatched_observations.
2. Set confidence to "low" if you are unsure (ambiguous title match, partial data, etc.). Don't guess film identities.
3. Apply the multipliers correctly. raw_points is BEFORE multipliers. multiplier is the multiplier applied (1.0 if none). final_points = raw_points × multiplier.
4. Don't propose tier-crossing events you can't verify from the source. If the page only mentions a film grossed "over $100M", do NOT also propose the $50M tier unless the page indicates it.
5. Keep reasoning to one sentence: what the source said and how it maps to the category.
6. Output ONLY the JSON code block — no prose before or after.

OUTPUT SCHEMA:
\`\`\`json
{
  "proposed_events": [
    {
      "film_title": "<must match a roster title exactly>",
      "category": "<from category enum>",
      "raw_points": <number>,
      "multiplier": <number>,
      "reasoning": "<one sentence>",
      "confidence": "high" | "medium" | "low",
      "source_url": "<the URL you fetched>"
    }
  ],
  "unmatched_observations": ["<plain-English notes about data you saw but couldn't map>"]
}
\`\`\`
`;
}
