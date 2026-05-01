import Link from "next/link";
import { notFound } from "next/navigation";
import { getStandings, getTeamWithFilms } from "@/lib/queries";
import { formatCategory } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: { managerId: string } }) {
  const team = await getTeamWithFilms(params.managerId);
  if (!team) notFound();
  const standings = await getStandings();
  const rank = standings.findIndex((s) => s.id === team.manager.id) + 1;

  const allEvents = team.films
    .flatMap((f) => f.scoreEvents.map((e) => ({ ...e, filmTitle: f.title })))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/" className="text-xs no-underline" style={{ color: "#a8a29e" }}>
            ← Standings
          </Link>
          <h1 className="text-3xl mt-1 film-title">{team.manager.name}</h1>
          <p className="text-sm" style={{ color: "#a8a29e" }}>
            Rank #{rank} · {team.films.length}/8 films · ${team.films.reduce((a, f) => a + f.auctionPrice, 0)} of $200 spent
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: "#a8a29e" }}>Total Points</div>
          <div className="text-4xl tabular" style={{ color: "#D97706", fontWeight: 600 }}>
            {team.totals.total}
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-lg mb-2 film-title">Roster</h2>
        <div className="card p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Film</th>
                <th className="text-right">Price</th>
                <th>Tags</th>
                <th className="text-right">BO</th>
                <th className="text-right">Awards</th>
                <th className="text-right">Bonus</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {team.films.length === 0 ? (
                <tr><td colSpan={7} style={{ color: "#a8a29e" }}>No films yet — head to <Link href="/draft">/draft</Link>.</td></tr>
              ) : (
                team.films.map((f) => (
                  <tr key={f.id}>
                    <td className="film-title">{f.title}</td>
                    <td className="text-right tabular">${f.auctionPrice}</td>
                    <td>
                      {f.isSequel && <span className="chip chip-amber mr-1">Sequel</span>}
                      {!f.isRosterStarter && <span className="chip">Bench</span>}
                    </td>
                    <td className="text-right tabular">{f.breakdown.boxOffice}</td>
                    <td className="text-right tabular">{f.breakdown.awards}</td>
                    <td className="text-right tabular">{f.breakdown.bonus}</td>
                    <td className="text-right tabular" style={{ fontWeight: 600 }}>
                      {f.breakdown.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg mb-2 film-title">Score event history</h2>
        {allEvents.length === 0 ? (
          <p style={{ color: "#a8a29e" }}>No events yet.</p>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Film</th>
                  <th>Category</th>
                  <th className="text-right">Pts</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((e) => (
                  <tr key={e.id} style={e.reversedAt ? { opacity: 0.4, textDecoration: "line-through" } : {}}>
                    <td className="tabular text-xs" style={{ color: "#a8a29e" }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="film-title">{e.filmTitle}</td>
                    <td className="text-xs">{formatCategory(e.category)}</td>
                    <td className="text-right tabular" style={{ color: e.reversedAt ? "#a8a29e" : "#22c55e" }}>
                      {e.reversedAt ? "" : "+"}{e.finalPoints}
                    </td>
                    <td className="text-xs">
                      {e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noreferrer">link</a> : <span style={{ color: "#57534e" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
