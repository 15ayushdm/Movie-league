"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCategory } from "@/lib/format";

interface Film {
  id: string;
  title: string;
  managerId: string;
  managerName: string;
  isSequel: boolean;
  productionBudget: number | null;
  auctionPrice: number;
}
interface RecentEvent {
  id: string;
  filmTitle: string;
  managerName: string;
  category: string;
  finalPoints: number;
  sourceUrl: string | null;
  createdAt: string;
  reversedAt: string | null;
}
interface Manager {
  id: string;
  name: string;
}

export function AdminClient({
  films,
  recentEvents,
  managers,
}: {
  films: Film[];
  recentEvents: RecentEvent[];
  managers: Manager[];
}) {
  return (
    <div className="space-y-10">
      <h1 className="text-2xl film-title">Admin</h1>

      <ManualScoreSection films={films} />
      <ReverseEventSection events={recentEvents} />
      <FilmMetadataSection films={films} />
      <TradeSection films={films} managers={managers} />
      <OctoberSwapSection films={films} managers={managers} />
    </div>
  );
}

function ManualScoreSection({ films }: { films: Film[] }) {
  const router = useRouter();
  const [filmId, setFilmId] = useState(films[0]?.id ?? "");
  const [category, setCategory] = useState("");
  const [rawPoints, setRawPoints] = useState("");
  const [multiplier, setMultiplier] = useState("1.0");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filmId,
        category,
        rawPoints: Number(rawPoints),
        multiplier: Number(multiplier),
        sourceUrl: sourceUrl || null,
        notes: notes || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Failed");
      return;
    }
    setCategory("");
    setRawPoints("");
    setMultiplier("1.0");
    setSourceUrl("");
    setNotes("");
    router.refresh();
  }

  return (
    <section className="card space-y-3">
      <h2 className="film-title text-lg">Manually add a score event</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <select className="select" value={filmId} onChange={(e) => setFilmId(e.target.value)}>
          {films.map((f) => (
            <option key={f.id} value={f.id}>{f.managerName} — {f.title}</option>
          ))}
        </select>
        <input className="input" placeholder="category (e.g. box_office_tier_50M, oscars_win_director)" value={category} onChange={(e) => setCategory(e.target.value)} required />
        <input className="input" type="number" step="0.01" placeholder="raw points" value={rawPoints} onChange={(e) => setRawPoints(e.target.value)} required />
        <input className="input" type="number" step="0.01" placeholder="multiplier (1.0 default)" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} required />
        <input className="input col-span-2" placeholder="source URL (optional)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
        <input className="input col-span-2" placeholder="notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="col-span-2 flex justify-end items-center gap-3">
          {msg && <span className="text-sm" style={{ color: "#ef4444" }}>{msg}</span>}
          <button type="submit" className="btn btn-primary">Add event</button>
        </div>
      </form>
    </section>
  );
}

function ReverseEventSection({ events }: { events: RecentEvent[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reverse(id: string) {
    if (!confirm("Reverse this score event? It will be soft-deleted and removed from totals.")) return;
    setBusyId(id);
    const res = await fetch("/api/admin/reverse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  async function unreverse(id: string) {
    setBusyId(id);
    const res = await fetch("/api/admin/reverse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, undo: true }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  return (
    <section>
      <h2 className="film-title text-lg mb-2">Recent score events (reverse / restore)</h2>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Film</th>
              <th>Category</th>
              <th className="text-right">Pts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={e.reversedAt ? { opacity: 0.4 } : {}}>
                <td className="text-xs tabular" style={{ color: "#a8a29e" }}>{new Date(e.createdAt).toLocaleString()}</td>
                <td className="film-title">{e.filmTitle} <span style={{ color: "#a8a29e" }}>· {e.managerName}</span></td>
                <td className="text-xs">{formatCategory(e.category)}</td>
                <td className="text-right tabular">{e.finalPoints}</td>
                <td className="text-right">
                  {e.reversedAt ? (
                    <button className="btn" onClick={() => unreverse(e.id)} disabled={busyId === e.id}>Restore</button>
                  ) : (
                    <button className="btn" onClick={() => reverse(e.id)} disabled={busyId === e.id}>Reverse</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilmMetadataSection({ films }: { films: Film[] }) {
  const router = useRouter();
  const [edits, setEdits] = useState<Record<string, { isSequel: boolean; productionBudget: string }>>(
    Object.fromEntries(
      films.map((f) => [
        f.id,
        { isSequel: f.isSequel, productionBudget: f.productionBudget?.toString() ?? "" },
      ]),
    ),
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function save(filmId: string) {
    setBusy(filmId);
    const e = edits[filmId];
    await fetch("/api/admin/film", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filmId,
        isSequel: e.isSequel,
        productionBudget: e.productionBudget ? Number(e.productionBudget) : null,
      }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <section>
      <h2 className="film-title text-lg mb-2">Film metadata</h2>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Manager</th>
              <th>Film</th>
              <th>Sequel?</th>
              <th>Budget ($M)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {films.map((f) => (
              <tr key={f.id}>
                <td>{f.managerName}</td>
                <td className="film-title">{f.title}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={edits[f.id].isSequel}
                    onChange={(ev) => setEdits({ ...edits, [f.id]: { ...edits[f.id], isSequel: ev.target.checked } })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input"
                    style={{ width: "8rem" }}
                    value={edits[f.id].productionBudget}
                    onChange={(ev) =>
                      setEdits({ ...edits, [f.id]: { ...edits[f.id], productionBudget: ev.target.value } })
                    }
                  />
                </td>
                <td>
                  <button className="btn" onClick={() => save(f.id)} disabled={busy === f.id}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TradeSection({ films, managers }: { films: Film[]; managers: Manager[] }) {
  const router = useRouter();
  const [filmAId, setFilmAId] = useState(films[0]?.id ?? "");
  const [filmBId, setFilmBId] = useState(films[1]?.id ?? "");
  const [busy, setBusy] = useState(false);

  async function execute() {
    if (filmAId === filmBId) return alert("Pick two different films.");
    setBusy(true);
    const res = await fetch("/api/admin/trade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filmAId, filmBId }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <section className="card space-y-3">
      <h2 className="film-title text-lg">Execute a trade</h2>
      <p className="text-sm" style={{ color: "#a8a29e" }}>
        Swap ownership of two films between two managers. Auction prices and score events follow the films.
      </p>
      <div className="flex gap-3 items-center">
        <select className="select" value={filmAId} onChange={(e) => setFilmAId(e.target.value)}>
          {films.map((f) => <option key={f.id} value={f.id}>{f.managerName} — {f.title}</option>)}
        </select>
        <span style={{ color: "#a8a29e" }}>↔</span>
        <select className="select" value={filmBId} onChange={(e) => setFilmBId(e.target.value)}>
          {films.map((f) => <option key={f.id} value={f.id}>{f.managerName} — {f.title}</option>)}
        </select>
        <button className="btn btn-primary" onClick={execute} disabled={busy}>Trade</button>
      </div>
    </section>
  );
}

function OctoberSwapSection({ films, managers }: { films: Film[]; managers: Manager[] }) {
  const router = useRouter();
  const [dropFilmId, setDropFilmId] = useState(films[0]?.id ?? "");
  const [newTitle, setNewTitle] = useState("");
  const [isSequel, setIsSequel] = useState(false);
  const [busy, setBusy] = useState(false);

  async function execute(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("This will reverse all score events for the dropped film and add the new pick at $0.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/swap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dropFilmId, newTitle: newTitle.trim(), isSequel }),
    });
    setBusy(false);
    if (res.ok) {
      setNewTitle("");
      router.refresh();
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="film-title text-lg">October Swap</h2>
      <p className="text-sm" style={{ color: "#a8a29e" }}>
        Drop one film and add a new one for the same manager at auction price $0.
      </p>
      <form onSubmit={execute} className="flex flex-wrap gap-3 items-center">
        <select className="select" style={{ flex: 1 }} value={dropFilmId} onChange={(e) => setDropFilmId(e.target.value)}>
          {films.map((f) => <option key={f.id} value={f.id}>Drop: {f.managerName} — {f.title}</option>)}
        </select>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="New film title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <label className="text-xs flex items-center gap-2" style={{ color: "#a8a29e" }}>
          <input type="checkbox" checked={isSequel} onChange={(e) => setIsSequel(e.target.checked)} />
          Sequel
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>Swap</button>
      </form>
    </section>
  );
}
