# Movie Fantasy League

A private web app to run an 8-team movie fantasy auction league: capture the
draft, track rosters, and update scoring through the year using a Claude-powered
chat that reads URLs (Box Office Mojo, Variety, Deadline, Academy Awards, etc.)
and proposes score events for your roster.

Built from `movie fantasy league app spec.pdf` — see that file for the full
product spec.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Prisma** + SQLite (dev) / Postgres (prod)
- **Anthropic SDK** (`claude-sonnet-4-6`) with the `web_fetch` tool
- Single shared-password gate via middleware (no per-user accounts)

## First-time setup

```bash
npm install
cp .env.example .env             # fill in LEAGUE_PASSWORD + ANTHROPIC_API_KEY
npx prisma db push               # create the SQLite db
npm run db:seed                  # seed league config + 8 placeholder managers
npm run dev
```

Visit http://localhost:3000, enter the password, and start drafting.

## Pages

- `/` — League leaderboard + recent score events
- `/draft` — Auction entry: single-pick form + bulk paste mode
- `/team/[managerId]` — Team detail with roster, breakdown, and event history
- `/scoring` — Paste a URL → Claude proposes events → review + apply
- `/admin` — Manual score events, reverse, edit film metadata, trades, October swap
- `/rules` — Static scoring rubric (rendered from `lib/scoring.ts` so it can't drift)

## Scoring engine

All rules live in `lib/scoring.ts`. The 2026 inaugural-season config is seeded
into the `LeagueConfig` row. Worked examples from the spec are covered by
`lib/scoring.test.ts` — run with `npm test`.

## Claude integration

`/scoring` calls the Anthropic API with `web_fetch_20260209` enabled and the
full roster + rubric as a cached system prompt. The model returns a JSON list
of proposed events, the server validates them against the roster, and the UI
renders a confirmation table — only events you explicitly check are applied.

## Production

Set `DATABASE_URL` to a Postgres URL and change the Prisma datasource provider
to `postgresql`, then deploy on Vercel. `LEAGUE_PASSWORD` and
`ANTHROPIC_API_KEY` belong in the Vercel env vars.
