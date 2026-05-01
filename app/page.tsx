import Link from "next/link";
import { getRecentScoreEvents, getStandings } from "@/lib/queries";
import { formatCategory } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [standings, recent] = await Promise.all([
    getStandings(),
    getRecentScoreEvents(20),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl mb-4 film-title">League Standings</h1>
        {standings.length === 0 ? (
          <p style={{ color: "#a8a29e" }}>
            No managers yet. Run <code>npm run db:seed</code> to seed the league.
          </p>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "3rem" }}>#</th>
                  <th>Manager</th>
                  <th className="text-right">Films</th>
                  <th className="text-right">Spend</th>
                  <th className="text-right">Box Office</th>
                  <th className="text-right">Awards</th>
                  <th className="text-right">Bonus</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.id}>
                    <td className="tabular" style={{ color: "#a8a29e" }}>{i + 1}</td>
                    <td>
                      <Link href={`/team/${s.id}`} className="no-underline">{s.name}</Link>
                    </td>
                    <td className="text-right tabular">{s.filmCount}/8</td>
                    <td className="text-right tabular" style={{ color: "#a8a29e" }}>
                      ${s.spend}
                    </td>
                    <td className="text-right tabular">{s.breakdown.boxOffice}</td>
                    <td className="text-right tabular">{s.breakdown.awards}</td>
                    <td className="text-right tabular">{s.breakdown.bonus}</td>
                    <td className="text-right tabular" style={{ color: "#D97706", fontWeight: 600 }}>
                      {s.breakdown.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg mb-3 film-title">Recent score events</h2>
        {recent.length === 0 ? (
          <p style={{ color: "#a8a29e" }}>No score events yet.</p>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Manager</th>
                  <th>Film</th>
                  <th>Category</th>
                  <th className="text-right">Pts</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => (
                  <tr key={e.id}>
                    <td className="tabular text-xs" style={{ color: "#a8a29e" }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td>{e.film.manager.name}</td>
                    <td className="film-title">{e.film.title}</td>
                    <td className="text-xs" style={{ color: "#a8a29e" }}>
                      {formatCategory(e.category)}
                    </td>
                    <td className="text-right tabular" style={{ color: "#22c55e" }}>
                      +{e.finalPoints}
                    </td>
                    <td className="text-xs">
                      {e.sourceUrl ? (
                        <a href={e.sourceUrl} target="_blank" rel="noreferrer">
                          link
                        </a>
                      ) : (
                        <span style={{ color: "#57534e" }}>—</span>
                      )}
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
