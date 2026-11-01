"use client";

import { useState } from "react";
import { api } from "@/lib/client";

type Demo = { email: string; note: string };

export function LoginForm({ demoAccounts }: { demoAccounts: Demo[] }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: string, p: string) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: e, password: p }) });
// Full reload on purpose: auth changed, so drop all client-side cached server state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input
            className="input"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Demo accounts · password <code className="rounded bg-slate-100 px-1">demo1234</code>
        </p>
        <ul className="space-y-1.5">
          {demoAccounts.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                disabled={busy}
                onClick={() => login(d.email, "demo1234")}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="font-medium text-slate-800">{d.email}</span>
                <span className="text-xs text-slate-500">{d.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
