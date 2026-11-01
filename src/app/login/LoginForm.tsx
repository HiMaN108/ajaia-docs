"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/shell/Avatar";

type Demo = { email: string; name: string; note: string };

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
      window.location.assign("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <p className="eyebrow">
          Demo accounts · password <code className="rounded bg-surface-container px-1 font-mono normal-case">demo1234</code>
        </p>
        <ul className="space-y-2">
          {demoAccounts.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                disabled={busy}
                onClick={() => login(d.email, "demo1234")}
                className="group flex w-full items-center gap-3 rounded-lg bg-surface-container-low px-3 py-2.5 text-left transition hover:bg-surface-container disabled:opacity-60"
              >
                <Avatar name={d.name} seed={d.email} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-display text-[13px] font-semibold text-on-surface">{d.email}</span>
                  <span className="text-xs text-on-surface-variant">{d.note}</span>
                </span>
                <Icon name="arrow_forward" className="text-[18px] text-primary opacity-0 transition group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-on-surface-variant">
        <span className="h-px flex-1 bg-outline-variant/50" /> or sign in manually <span className="h-px flex-1 bg-outline-variant/50" />
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}
      >
        <label className="block">
          <span className="mb-1 block font-display text-[13px] font-medium text-on-surface">Email</span>
          <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block font-display text-[13px] font-medium text-on-surface">Password</span>
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
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
            <Icon name="error" className="text-[18px]" /> {error}
          </p>
        )}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
    </>
  );
}
