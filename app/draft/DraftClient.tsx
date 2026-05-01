"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Manager {
  id: string;
  name: string;
}
interface Totals {
  managerId: string;
  name: string;
  filmCount: number;
  spend: number;
  sequelCount: number;
}
interface FilmRow {
  id: string;
  title: string;
  managerName: string;
  price: number;
  isSequel: boolean;
}
interface Config {
  budgetCap: number;
  rosterSize: number;
  sequelCap: number;
  draftDate: string;
}

interface ParsedPick {
  managerName: string;
  title: string;
  price: number;
  isSequel: boolean;
  releaseDate?: string;
  productionBudget?: number;
  error?: string;
}

export function DraftClient({
  managers,
  totals,
  films,
  config,
}: {
  managers: Manager[];
  totals: Totals[];
  films: FilmRow[];
  config: Config | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"bulk" | "single">("single");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl film-title mb-1">Auction Draft</h1>
        <p className="text-sm" style={{ color: "#a8a29e" }}>
          {config ? (
            <>
              ${config.budgetCap} budget · {config.rosterSize} films · ≤{config.sequelCap} sequels · draft date {new Date(config.draftDate).toLocaleDateString()}
            </>
          ) : (
            "Run the seed script to populate league config."
          )}
        </p>
      </header>

      <section>
        <h2 className="text-sm uppercase tracking-wider mb-2" style={{ color: "#a8a29e" }}>
          Running totals
        </h2>
        <div className="card p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Manager</th>
                <th className="text-right">Films</th>
                <th className="text-right">Spend</th>
                <th className="text-right">Sequels</th>
                <th className="text-right">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => {
                const remaining = (config?.budgetCap ?? 200) - t.spend;
                const overSequels = config && t.sequelCount > config.sequelCap;
                return (
                  <tr key={t.managerId}>
                    <td>{t.name}</td>
                    <td className="text-right tabular">
                      {t.filmCount}/{config?.rosterSize ?? 8}
                    </td>
                    <td className="text-right tabular">${t.spend}</td>
                    <td className="text-right tabular" style={{ color: overSequels ? "#ef4444" : undefined }}>
                      {t.sequelCount}/{config?.sequelCap ?? 3}
                    </td>
                    <td className="text-right tabular" style={{ color: remaining < 0 ? "#ef4444" : "#a8a29e" }}>
                      ${remaining}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex gap-2 mb-3">
          <button className={`btn ${mode === "single" ? "btn-primary" : ""}`} onClick={() => setMode("single")}>
            Single pick
          </button>
          <button className={`btn ${mode === "bulk" ? "btn-primary" : ""}`} onClick={() => setMode("bulk")}>
            Bulk paste
          </button>
        </div>

        {mode === "single" ? (
          <SinglePickForm managers={managers} onSaved={() => router.refresh()} draftDateIso={config?.draftDate} />
        ) : (
          <BulkPasteForm managers={managers} onSaved={() => router.refresh()} />
        )}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider mb-2" style={{ color: "#a8a29e" }}>
          All picks ({films.length})
        </h2>
        {films.length === 0 ? (
          <p style={{ color: "#a8a29e" }}>None yet.</p>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Film</th>
                  <th className="text-right">Price</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {films.map((f) => (
                  <tr key={f.id}>
                    <td>{f.managerName}</td>
                    <td className="film-title">{f.title}</td>
                    <td className="text-right tabular">${f.price}</td>
                    <td>{f.isSequel && <span className="chip chip-amber">Sequel</span>}</td>
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

function SinglePickForm({
  managers,
  onSaved,
  draftDateIso,
}: {
  managers: Manager[];
  onSaved: () => void;
  draftDateIso?: string;
}) {
  const [managerId, setManagerId] = useState(managers[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [isSequel, setIsSequel] = useState(false);
  const [productionBudget, setProductionBudget] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setWarning(null);

    if (releaseDate && draftDateIso && new Date(releaseDate) < new Date(draftDateIso)) {
      const ok = confirm(
        `Release date ${releaseDate} is before the draft date. The league rules say pre-draft releases aren't eligible. Add anyway?`,
      );
      if (!ok) return;
    }

    setSubmitting(true);
    const res = await fetch("/api/draft/pick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        managerId,
        title: title.trim(),
        price: Number(price),
        isSequel,
        productionBudget: productionBudget ? Number(productionBudget) : null,
        releaseDate: releaseDate || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setWarning(j.error || "Failed to add pick.");
      return;
    }
    setTitle("");
    setPrice("");
    setIsSequel(false);
    setProductionBudget("");
    setReleaseDate("");
    onSaved();
  }

  return (
    <form onSubmit={submit} className="card grid grid-cols-2 gap-3">
      <label className="text-xs" style={{ color: "#a8a29e" }}>
        Manager
        <select className="select mt-1" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <label className="text-xs" style={{ color: "#a8a29e" }}>
        Film title
        <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="text-xs" style={{ color: "#a8a29e" }}>
        Auction price ($)
        <input className="input mt-1" type="number" min="0" max="200" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </label>
      <label className="text-xs" style={{ color: "#a8a29e" }}>
        Production budget ($M, optional)
        <input className="input mt-1" type="number" min="0" value={productionBudget} onChange={(e) => setProductionBudget(e.target.value)} />
      </label>
      <label className="text-xs" style={{ color: "#a8a29e" }}>
        Release date (optional)
        <input className="input mt-1" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
      </label>
      <label className="text-xs flex items-center gap-2 mt-5" style={{ color: "#a8a29e" }}>
        <input type="checkbox" checked={isSequel} onChange={(e) => setIsSequel(e.target.checked)} />
        Sequel / IP continuation
      </label>
      <div className="col-span-2 flex justify-end items-center gap-3">
        {warning && <span className="text-sm" style={{ color: "#ef4444" }}>{warning}</span>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Add pick"}
        </button>
      </div>
    </form>
  );
}

function BulkPasteForm({ managers, onSaved }: { managers: Manager[]; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedPick[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parse() {
    setError(null);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const out: ParsedPick[] = [];
    for (const line of lines) {
      const parts = line.split(/[|,]/).map((p) => p.trim());
      if (parts.length < 3) {
        out.push({
          managerName: "",
          title: line,
          price: 0,
          isSequel: false,
          error: "Need: Manager | Title | Price | sequel?",
        });
        continue;
      }
      const [name, title, priceStr, sequelStr] = parts;
      const matchedManager = managers.find((m) => m.name.toLowerCase() === name.toLowerCase());
      const price = Number(priceStr);
      out.push({
        managerName: matchedManager?.name ?? name,
        title,
        price: Number.isFinite(price) ? price : 0,
        isSequel: !!sequelStr && /^(y|yes|true|sequel|1)$/i.test(sequelStr.trim()),
        error: !matchedManager
          ? `Unknown manager "${name}"`
          : !Number.isFinite(price)
          ? `Bad price "${priceStr}"`
          : undefined,
      });
    }
    setParsed(out);
  }

  async function commit() {
    setError(null);
    if (parsed.some((p) => p.error)) {
      setError("Fix parse errors before committing.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/draft/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        picks: parsed.map((p) => ({
          managerName: p.managerName,
          title: p.title,
          price: p.price,
          isSequel: p.isSequel,
        })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Bulk commit failed");
      return;
    }
    setParsed([]);
    setText("");
    onSaved();
  }

  return (
    <div className="space-y-3">
      <textarea
        className="textarea font-mono"
        rows={8}
        placeholder={"Alex | Wicked | 42 | no\nBailey | Avatar 3 | 35 | yes\nCasey, The Brutalist, 18, no"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="button" className="btn" onClick={parse} disabled={!text.trim()}>
          Parse & preview
        </button>
        {parsed.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={commit} disabled={submitting}>
            {submitting ? "Saving..." : `Commit ${parsed.length} picks`}
          </button>
        )}
      </div>
      {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
      {parsed.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Manager</th>
                <th>Film</th>
                <th className="text-right">Price</th>
                <th>Sequel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((p, i) => (
                <tr key={i}>
                  <td>{p.managerName}</td>
                  <td className="film-title">{p.title}</td>
                  <td className="text-right tabular">${p.price}</td>
                  <td>{p.isSequel ? "yes" : ""}</td>
                  <td className="text-xs" style={{ color: p.error ? "#ef4444" : "#22c55e" }}>
                    {p.error || "OK"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
