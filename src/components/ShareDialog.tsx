"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Collaborator } from "@/lib/documents";
import { api } from "@/lib/client";
import { Icon } from "./Icon";
import { RoleBadge } from "./RoleBadge";
import { Avatar } from "./shell/Avatar";

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
      className="m-auto w-full max-w-lg rounded-xl bg-surface-container-lowest p-0 shadow-xl backdrop:bg-on-surface/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">
              <Icon name="person_add" className="text-[22px]" />
            </span>
            <h2 className="font-display text-lg font-semibold text-on-surface">
              Share &ldquo;<span className="break-all">{docTitle}</span>&rdquo;
            </h2>
          </div>
          <button className="btn-ghost -mt-1 -mr-2 h-8 w-8 justify-center" aria-label="Close" onClick={onClose}>
            <Icon name="close" className="text-[20px]" />
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
        <p className="mt-1.5 font-mono text-[11px] text-on-surface-variant">
          Demo users: bob@ajaia.dev, carol@ajaia.dev, alice@ajaia.dev
        </p>

        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-tertiary-fixed px-3 py-2 text-sm text-on-tertiary-fixed">
            {notice}
          </p>
        )}

        <h3 className="eyebrow mt-6 mb-2">People with access</h3>
        <ul className="space-y-1 rounded-lg bg-surface-container-low px-3 py-1.5">
          <li className="flex items-center gap-3 py-1.5 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-container font-display text-[10px] font-semibold text-on-primary">You</span>
            <span className="flex-1 font-display text-on-surface">You</span>
            <RoleBadge role="owner" />
          </li>
          {collaborators === null && !error && <li className="py-2 text-sm text-on-surface-variant">Loading…</li>}
          {collaborators?.map((c) => (
            <li key={c.userId} className="flex items-center gap-3 py-1.5 text-sm">
              <Avatar name={c.name} seed={c.email} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-on-surface">{c.name}</div>
                <div className="truncate font-mono text-[11px] text-on-surface-variant">{c.email}</div>
              </div>
              <select
                aria-label={`Access for ${c.name}`}
                className="cursor-pointer rounded-md bg-transparent px-1 py-1 font-display text-xs text-on-surface outline-none hover:bg-surface-container-low"
                value={c.role}
                onChange={(e) => void share(c.email, e.target.value as ShareRole)}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button className="btn-ghost text-xs hover:text-error" onClick={() => void revoke(c)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
