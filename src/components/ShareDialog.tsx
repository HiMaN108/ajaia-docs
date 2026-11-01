"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Collaborator } from "@/lib/documents";
import { api } from "@/lib/client";
import { Avatar } from "./AppHeader";

type ShareRole = Collaborator["role"];

export function ShareDialog({
  open,
  onClose,
  docId,
  docTitle,
}: {
  open: boolean;
  onClose: () => void;
  docId: string;
  docTitle: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const base = `/api/documents/${docId}/shares`;

  const load = useCallback(async () => {
    try {
      const { collaborators } = await api<{ collaborators: Collaborator[] }>(base);
      setCollaborators(collaborators);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [base]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setError(null);
      setNotice(null);
      void load();
    } else if (!open && d.open) d.close();
  }, [open, load]);

  async function share(targetEmail: string, targetRole: ShareRole) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { collaborator } = await api<{ collaborator: Collaborator }>(base, {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, role: targetRole }),
      });
      setCollaborators((list) => [...(list ?? []).filter((c) => c.userId !== collaborator.userId), collaborator]);
      setNotice(`${collaborator.name} ${targetRole === "editor" ? "can now edit" : "can now view"} this document.`);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function revoke(c: Collaborator) {
    setError(null);
    setNotice(null);
    try {
      await api(`${base}/${c.userId}`, { method: "DELETE" });
      setCollaborators((list) => (list ?? []).filter((x) => x.userId !== c.userId));
      setNotice(`Removed ${c.name}'s access.`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-auto w-full max-w-lg rounded-xl p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Share &ldquo;<span className="break-all">{docTitle}</span>&rdquo;
          </h2>
          <button className="btn-ghost -mr-2 -mt-1 text-xl leading-none" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await share(email, role)) setEmail("");
          }}
        >
          <input
            className="input flex-1"
            type="email"
            required
            placeholder="Add people by email"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select className="input w-auto" aria-label="Access level" value={role} onChange={(e) => setRole(e.target.value as ShareRole)}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Sharing…" : "Share"}
          </button>
        </form>
        <p className="mt-1.5 text-xs text-slate-500">
          Demo users: bob@ajaia.dev, carol@ajaia.dev, alice@ajaia.dev
        </p>

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        <h3 className="mb-2 mt-6 text-sm font-medium text-slate-700">People with access</h3>
        <ul className="space-y-1">
          <li className="flex items-center gap-3 py-1.5 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-semibold text-white">You</span>
            <span className="flex-1 text-slate-800">You</span>
            <span className="text-xs text-slate-500">Owner</span>
          </li>
          {collaborators === null && !error && <li className="py-2 text-sm text-slate-400">Loading…</li>}
          {collaborators?.map((c) => (
            <li key={c.userId} className="flex items-center gap-3 py-1.5 text-sm">
              <Avatar name={c.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-slate-800">{c.name}</div>
                <div className="truncate text-xs text-slate-500">{c.email}</div>
              </div>
              <select
                aria-label={`Access for ${c.name}`}
                className="rounded-md border-0 bg-transparent py-1 text-xs text-slate-700 hover:bg-slate-100"
                value={c.role}
                onChange={(e) => void share(c.email, e.target.value as ShareRole)}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button className="btn-ghost text-xs text-slate-500 hover:text-red-600" onClick={() => void revoke(c)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
