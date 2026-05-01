"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("from") || "/";
    } else {
      setError("Wrong password");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 card">
      <h1 className="film-title text-2xl mb-1" style={{ color: "#D97706" }}>
        Movie Fantasy League
      </h1>
      <p className="text-sm mb-4" style={{ color: "#a8a29e" }}>
        Enter the league password.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input"
          autoFocus
        />
        {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
