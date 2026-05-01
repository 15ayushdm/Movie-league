import {
  BOX_OFFICE_TIERS,
  ELIGIBLE_CEREMONIES,
  OPENING_WEEKEND_NUMBER_ONE,
  ORIGINAL_IP_AWARDS_MULTIPLIER,
  OSCAR_WEIGHTS,
  OTHER_CEREMONY_MULTIPLIER,
  SEQUEL_BO_MULTIPLIER,
  SLEEPER_BONUS,
} from "@/lib/scoring";

export default function RulesPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl film-title mb-1">Scoring Rules — 2026 Inaugural Season</h1>
        <p className="text-sm" style={{ color: "#a8a29e" }}>
          Rendered straight from <code>lib/scoring.ts</code> so the engine and rules can never drift.
        </p>
      </header>

      <section className="card">
        <h2 className="text-lg film-title mb-2">Box office tiers</h2>
        <p className="text-sm mb-3" style={{ color: "#a8a29e" }}>
          Each tier awards points once, when the film crosses it (domestic gross, $M).
          Sequels score box office at <strong>{SEQUEL_BO_MULTIPLIER}×</strong>.
        </p>
        <table>
          <thead>
            <tr><th>Threshold</th><th className="text-right">Points (original)</th><th className="text-right">Points (sequel)</th></tr>
          </thead>
          <tbody>
            {BOX_OFFICE_TIERS.map((t) => (
              <tr key={t.threshold}>
                <td className="tabular">${t.threshold}M</td>
                <td className="text-right tabular">{t.points}</td>
                <td className="text-right tabular">{t.points * SEQUEL_BO_MULTIPLIER}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="text-lg film-title mb-2">Awards — Oscar weights</h2>
        <p className="text-sm mb-3" style={{ color: "#a8a29e" }}>
          Original-IP films get a <strong>{ORIGINAL_IP_AWARDS_MULTIPLIER}×</strong> bonus on awards points.
        </p>
        <table>
          <thead>
            <tr><th>Category</th><th className="text-right">Nom</th><th className="text-right">Win</th></tr>
          </thead>
          <tbody>
            {Object.entries(OSCAR_WEIGHTS).map(([cat, w]) => (
              <tr key={cat}>
                <td>{cat.replace(/_/g, " ")}</td>
                <td className="text-right tabular">{w.nom}</td>
                <td className="text-right tabular">{w.win}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="text-lg film-title mb-2">Other ceremonies</h2>
        <p className="text-sm" style={{ color: "#a8a29e" }}>
          Non-Oscar eligible ceremonies score at <strong>{OTHER_CEREMONY_MULTIPLIER}×</strong> the Oscar weight.
          Cannes is excluded for the inaugural 2026 season.
        </p>
        <p className="text-sm mt-2">
          Eligible: {ELIGIBLE_CEREMONIES.filter((c) => c !== "oscars").map((c) => (
            <span key={c} className="chip mr-1">{c.replace(/_/g, " ")}</span>
          ))}
        </p>
      </section>

      <section className="card">
        <h2 className="text-lg film-title mb-2">Bonuses</h2>
        <ul className="text-sm space-y-1" style={{ color: "#d6d3d1" }}>
          <li>
            <strong>Sleeper bonus:</strong> Original-IP film with production budget ≤ ${SLEEPER_BONUS.budgetCap}M
            crossing ${SLEEPER_BONUS.grossThreshold}M domestic earns {SLEEPER_BONUS.points} bonus points (one-time).
          </li>
          <li>
            <strong>Opening weekend #1:</strong> {OPENING_WEEKEND_NUMBER_ONE} points for opening at #1 domestic.
          </li>
        </ul>
      </section>

      <section className="card">
        <h2 className="text-lg film-title mb-2">Roster & draft</h2>
        <ul className="text-sm space-y-1" style={{ color: "#d6d3d1" }}>
          <li>$200 budget per manager</li>
          <li>8 films total, 6 starters + 2 bench</li>
          <li>Maximum 3 sequels per roster</li>
          <li>Films released before the draft date are not eligible</li>
        </ul>
      </section>
    </div>
  );
}
