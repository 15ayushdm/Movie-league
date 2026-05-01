import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildScoringSystemPrompt } from "@/lib/scoringPrompt";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ProposeRequest {
  url?: string;
  instruction?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

interface ProposedEvent {
  film_title: string;
  category: string;
  raw_points: number;
  multiplier: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  source_url?: string;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  const body = (await req.json()) as ProposeRequest;
  const userMessage = [
    body.url ? `URL: ${body.url}` : null,
    body.instruction ? `Instruction: ${body.instruction}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!userMessage) {
    return NextResponse.json(
      { error: "Provide a URL or instruction." },
      { status: 400 },
    );
  }

  const [films, config] = await Promise.all([
    prisma.film.findMany({ include: { manager: true }, orderBy: { title: "asc" } }),
    prisma.leagueConfig.findUnique({ where: { id: "singleton" } }),
  ]);

  const roster = films.map((f) => ({
    id: f.id,
    title: f.title,
    managerName: f.manager.name,
    isSequel: f.isSequel,
  }));

  const systemPrompt = buildScoringSystemPrompt(roster, {
    seasonYear: config?.seasonYear ?? 2026,
    excludedCeremonies: config?.excludedCeremonies
      ? (JSON.parse(config.excludedCeremonies) as string[])
      : ["cannes"],
  });

  const client = new Anthropic();

  const messages: Anthropic.MessageParam[] = [
    ...(body.history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: systemPrompt,
          // Cache the rubric + roster — it's stable across most requests.
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [{ type: "web_fetch_20260209", name: "web_fetch" } as Anthropic.ToolUnion],
      messages,
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API ${err.status}: ${err.message}` },
        { status: 502 },
      );
    }
    throw err;
  }

  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const fullText = textBlocks.map((b) => b.text).join("\n");

  const parsed = parseProposalJSON(fullText);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "Couldn't parse JSON from model output.",
        raw: fullText,
      },
      { status: 502 },
    );
  }

  const titleMap = new Map(roster.map((f) => [f.title.toLowerCase(), f]));
  const validated = parsed.proposed_events.map((e) => {
    const match = titleMap.get(e.film_title.toLowerCase());
    return {
      ...e,
      filmId: match?.id ?? null,
      managerName: match?.managerName ?? null,
    };
  });

  return NextResponse.json({
    rawText: fullText,
    proposedEvents: validated,
    unmatched: parsed.unmatched_observations ?? [],
    cacheRead: response.usage.cache_read_input_tokens ?? 0,
    cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
  });
}

function parseProposalJSON(
  text: string,
): { proposed_events: ProposedEvent[]; unmatched_observations: string[] } | null {
  // Try fenced JSON block first.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  try {
    const obj = JSON.parse(candidate);
    if (!Array.isArray(obj.proposed_events)) return null;
    return {
      proposed_events: obj.proposed_events,
      unmatched_observations: Array.isArray(obj.unmatched_observations)
        ? obj.unmatched_observations
        : [],
    };
  } catch {
    return null;
  }
}
