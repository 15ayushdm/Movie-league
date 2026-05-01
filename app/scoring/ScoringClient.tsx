"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCategory } from "@/lib/format";

interface ProposedEvent {
  film_title: string;
  category: string;
  raw_points: number;
  multiplier: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  source_url?: string;
  filmId: string | null;
  managerName: string | null;
}

interface Proposal {
  proposedEvents: ProposedEvent[];
  unmatched: string[];
  rawText: string;
  cacheRead: number;
  cacheWrite: number;
}

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export function ScoringClient() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("");
  const [history, setHistory] = useState<HistoryTurn[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setProposal(null);
    setSelected({});

    const userTurn: HistoryTurn = {
      role: "user",
      content: [url ? `URL: ${url}` : null, instruction ? `Instruction: ${instruction}` : null]
        .filter(Boolean)
        .join("\n\n"),
    };

    const res = await fetch("/api/scoring/propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, instruction, history }),
    });
    setLoading(false);

    const j = await res.json();
    if (!res.ok) {
      setError(j.error ?? "Failed");
      return;
    }
    setProposal(j as Proposal);
    const initial: Record<number, boolean> = {};
    (j.proposedEvents as ProposedEvent[]).forEach((e, i) => {
      initial[i] = !!e.filmId; // pre-check matched events
    });
    setSelected(initial);
    setHistory([
      ...history,
      userTurn,
      { role: "assistant", content: j.rawText as string },
    ]);
  }

  async function applySelected() {
    if (!proposal) return;
    const events = proposal.proposedEvents
      .map((e, i) => ({ e, i }))
      .filter(({ i }) => selected[i])
      .filter(({ e }) => e.filmId)
      .map(({ e }) => ({
        filmId: e.filmId!,
        category: e.category,
        rawPoints: e.raw_points,
        multiplier: e.multiplier,
        sourceUrl: e.source_url ?? url,
        notes: e.reasoning,
      }));

    if (events.length === 0) {
      setError("Nothing selected (or no events match the roster).");
      return;
    }

    setApplying(true);
    const res = await fetch("/api/scoring/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events }),
    });
    setApplying(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Apply failed.");
      return;
    }
    setProposal(null);
    setSelected({});
    setUrl("");
    setInstruction("");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl film-title mb-1">Scoring updates</h1>
        <p className="text-sm" style={{ color: "#a8a29e" }}>
          Paste a URL — Box Office Mojo, Variety, Deadline, Academy Awards, etc. Claude reads it, proposes score events
          for films on the league roster. Review, then apply.
        </p>
      </header>

      <form onSubmit={submit} className="card space-y-3">
        <input
          className="input"
          placeholder="https://www.boxofficemojo.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <textarea
          className="textarea"
          rows={2}
          placeholder='Optional instruction — e.g. "score the Oscar nominations" or "update box office for all my films"'
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "#a8a29e" }}>
            {history.length > 0 && `${history.length / 2} prior turn${history.length > 2 ? "s" : ""} in context. `}
            <button
              type="button"
              className="underline"
              style={{ background: "none", border: 0, color: "#a8a29e", cursor: "pointer" }}
              onClick={() => setHistory([])}
            >
              Clear conversation
            </button>
          </span>
          <button type="submit" className="btn btn-primary" disabled={loading || (!url && !instruction)}>
            {loading ? "Reading source..." : "Propose updates"}
          </button>
        </div>
        {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
      </form>

      {proposal && (
        <section className="space-y-4">
          <h2 className="text-lg film-title">Proposed score events</h2>
          {proposal.proposedEvents.length === 0 ? (
            <p style={{ color: "#a8a29e" }}>The model found no events to propose.</p>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Film</th>
                    <th>Manager</th>
                    <th>Category</th>
                    <th className="text-right">Raw</th>
                    <th className="text-right">×</th>
                    <th className="text-right">Final</th>
                    <th>Conf</th>
                    <th>Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.proposedEvents.map((e, i) => {
                    const final = Math.round(e.raw_points * e.multiplier * 100) / 100;
                    const noMatch = !e.filmId;
                    return (
                      <tr key={i} style={noMatch ? { opacity: 0.55 } : {}}>
                        <td>
                          <input
                            type="checkbox"
                            disabled={noMatch}
                            checked={!!selected[i]}
                            onChange={(ev) => setSelected({ ...selected, [i]: ev.target.checked })}
                          />
                        </td>
                        <td className="film-title">
                          {e.film_title}
                          {noMatch && <span className="chip ml-2" style={{ color: "#ef4444" }}>not on roster</span>}
                        </td>
                        <td>{e.managerName ?? "—"}</td>
                        <td className="text-xs">{formatCategory(e.category)}</td>
                        <td className="text-right tabular">{e.raw_points}</td>
                        <td className="text-right tabular">{e.multiplier}</td>
                        <td className="text-right tabular" style={{ fontWeight: 600 }}>{final}</td>
                        <td className="text-xs" style={{ color: e.confidence === "low" ? "#f59e0b" : "#a8a29e" }}>
                          {e.confidence}
                        </td>
                        <td className="text-xs" style={{ color: "#a8a29e", maxWidth: 320 }}>
                          {e.reasoning}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {proposal.unmatched.length > 0 && (
            <div className="card">
              <h3 className="text-sm uppercase tracking-wider mb-1" style={{ color: "#a8a29e" }}>
                Unmatched observations
              </h3>
              <ul className="text-sm space-y-1">
                {proposal.unmatched.map((u, i) => <li key={i}>· {u}</li>)}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "#57534e" }}>
              Cache: {proposal.cacheRead} read · {proposal.cacheWrite} written
            </span>
            <button className="btn btn-primary" onClick={applySelected} disabled={applying}>
              {applying ? "Applying..." : "Apply selected"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
