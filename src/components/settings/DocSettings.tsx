"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Collaborator, DocumentDetail } from "@/lib/documents";
import type { SessionUser } from "@/lib/auth";
import type { textStats } from "@/lib/editor/stats";
import { can } from "@/lib/access";
import { api, timeAgo } from "@/lib/client";
import { formatBytes } from "@/lib/client-actions";
import { docToMarkdown } from "@/lib/editor/markdown";
import { downloadMarkdown } from "@/lib/editor/download";
import { DeleteDocumentDialog } from "../dashboard/DocumentsBrowser";
import { Icon } from "../Icon";
import { RoleBadge } from "../RoleBadge";
import { ShareDialog } from "../ShareDialog";
import { AppShell } from "../shell/AppShell";
import { Avatar } from "../shell/Avatar";

type Stats = ReturnType<typeof textStats>;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export function DocSettings({
  doc,
  user,
  stats,
  initialCollaborators,
}: {
  doc: DocumentDetail;
  user: SessionUser;
  stats: Stats;
  /** Only provided to the owner (only owners may list collaborators). */
  initialCollaborators: Collaborator[] | null;
}) {
  const canEdit = can(doc.role, "edit");
  const isOwner = can(doc.role, "share");
  const [title, setTitle] = useState(doc.title);
  const [savedTitle, setSavedTitle] = useState(doc.title);
  const [renameState, setRenameState] = useState<{ busy: boolean; msg: string | null; error: boolean }>({ busy: false, msg: null, error: false });
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Refresh after the share dialog closes (roles may have changed).
  async function loadCollaborators() {
    if (!isOwner) return;
    const res = await api<{ collaborators: Collaborator[] }>(`/api/documents/${doc.id}/shares`).catch(() => null);
    if (res) setCollaborators(res.collaborators);
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setRenameState({ busy: false, msg: "Title can't be empty.", error: true });
    setRenameState({ busy: true, msg: null, error: false });
    try {
      await api(`/api/documents/${doc.id}`, { method: "PATCH", body: JSON.stringify({ title: t }) });
      setTitle(t);
      setSavedTitle(t);
      setRenameState({ busy: false, msg: "Title updated.", error: false });
    } catch (err) {
      setRenameState({ busy: false, msg: (err as Error).message, error: true });
    }
  }

  const metrics = [
    { icon: "schedule", label: "Read time", value: `${stats.readMinutes} min` },
    { icon: "article", label: "Words", value: stats.words.toLocaleString() },
    { icon: "format_quote", label: "Characters", value: stats.characters.toLocaleString() },
    ...(isOwner && collaborators ? [{ icon: "group", label: "People with access", value: String(collaborators.length + 1) }] : []),
  ];

  return (
    <AppShell user={user} breadcrumb="Document settings">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        {/* Header banner */}
        <section className="card mb-6 p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="min-w-0 space-y-2">
              <Link href={`/doc/${doc.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-display text-[11px] font-semibold text-on-surface-variant hover:text-primary">
                <Icon name="arrow_back" className="text-[14px]" /> Back to document
              </Link>
              <h1 className="font-display text-2xl font-semibold tracking-tight break-words text-on-surface sm:text-3xl">
                {savedTitle} <span className="text-on-surface-variant">· Settings</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-on-surface-variant">
                <Icon name="update" className="text-[16px]" />
                <span suppressHydrationWarning>Updated {timeAgo(doc.updatedAt)}</span>
                <span className="text-outline-variant">•</span>
                <RoleBadge role={doc.role} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 self-start rounded-lg bg-surface-container-low p-2">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center gap-2 rounded-md bg-surface-container-lowest px-3 py-1.5 shadow-card">
                  <Icon name={m.icon} className="text-[16px] text-primary" />
                  <div className="flex flex-col">
                    <span className="font-display text-[9px] leading-none font-semibold tracking-wider text-on-surface-variant uppercase">{m.label}</span>
                    <span className="font-display text-[13px] leading-tight font-semibold text-on-surface">{m.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <Panel icon="tune" title="General" subtitle="Name and export">
              <form onSubmit={rename} className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4">
                <label htmlFor="settings-title" className="flex items-center gap-2 font-display text-[13px] font-semibold text-on-surface">
                  <Icon name="edit_note" className="text-[16px] text-primary" /> Rename document
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-title"
                    className="input flex-1"
                    value={title}
                    maxLength={200}
                    disabled={!canEdit}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <button className="btn-primary" disabled={!canEdit || renameState.busy || title.trim() === savedTitle}>
                    <Icon name="check" className="text-[16px]" /> {renameState.busy ? "Saving…" : "Save"}
                  </button>
                </div>
                {!canEdit && <p className="text-xs text-on-surface-variant">You have view-only access, so you can&apos;t rename this document.</p>}
                {renameState.msg && (
                  <p role={renameState.error ? "alert" : "status"} className={`flex items-center gap-1 text-xs ${renameState.error ? "text-error" : "text-tertiary-container"}`}>
                    <Icon name={renameState.error ? "error" : "done"} className="text-[14px]" /> {renameState.msg}
                  </p>
                )}
              </form>

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-container text-on-primary shadow-card">
                    <Icon name="code_blocks" className="text-[20px]" />
                  </span>
                  <div>
                    <p className="font-display text-[13px] font-semibold text-on-surface">Export as Markdown (.md)</p>
                    <p className="text-xs text-on-surface-variant">Headings, lists, emphasis, links and code are kept. Underline is exported as &lt;u&gt;.</p>
                  </div>
                </div>
                <button type="button" className="btn-secondary shrink-0" onClick={() => downloadMarkdown(savedTitle, docToMarkdown(doc.content))}>
                  <Icon name="download" className="text-[16px] text-primary" /> Export
                </button>
              </div>
            </Panel>

            {isOwner && (
              <Panel icon="lock" title="People with access" subtitle="Only people listed here can open this document">
                <ul className="space-y-1 rounded-lg bg-surface-container-low p-3">
                  <li className="flex items-center gap-3 py-1.5">
                    <Avatar name={user.name} seed={user.email} size="sm" />
                    <span className="flex-1 font-display text-[13px] text-on-surface">You</span>
                    <RoleBadge role="owner" />
                  </li>
                  {collaborators === null ? (
                    <li className="py-2 text-xs text-on-surface-variant">Loading…</li>
                  ) : collaborators.length === 0 ? (
                    <li className="py-2 text-xs text-on-surface-variant">Not shared with anyone yet.</li>
                  ) : (
                    collaborators.map((c) => (
                      <li key={c.userId} className="flex items-center gap-3 py-1.5">
                        <Avatar name={c.name} seed={c.email} size="sm" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-display text-[13px] text-on-surface">{c.name}</span>
                          <span className="truncate font-mono text-[11px] text-on-surface-variant">{c.email}</span>
                        </div>
                        <RoleBadge role={c.role} />
                      </li>
                    ))
                  )}
                </ul>
                <button type="button" className="btn-secondary self-start" onClick={() => setShareOpen(true)}>
                  <Icon name="person_add" className="text-[16px]" /> Manage access
                </button>
              </Panel>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Panel icon="info" title="Details" subtitle="Ownership and history">
              <div className="grid grid-cols-2 gap-3">
                <Meta label="Created" value={fmtDate(doc.createdAt)} />
                <Meta label="Last modified" value={fmtDate(doc.updatedAt)} />
                <Meta label="Stored size" value={formatBytes(doc.contentBytes)} />
                <Meta label="Your access" value={{ owner: "Owner", editor: "Can edit", viewer: "View only" }[doc.role]} />
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3.5">
                <Avatar name={doc.owner.name} seed={doc.owner.email} size="lg" />
                <div className="flex flex-col">
                  <span className="font-display text-[9px] font-semibold tracking-wider text-on-surface-variant uppercase">Owner</span>
                  <span className="font-display text-[13px] font-semibold text-on-surface">{doc.role === "owner" ? `${doc.owner.name} (you)` : doc.owner.name}</span>
                  <span className="font-mono text-[11px] text-on-surface-variant">{doc.owner.email}</span>
                </div>
              </div>
            </Panel>

            {isOwner && (
              <section className="flex flex-col gap-4 rounded-xl bg-error-container/40 p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-error text-white shadow-card">
                    <Icon name="warning" className="text-[18px]" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg leading-tight font-semibold text-error">Danger zone</h2>
                    <p className="text-[13px] text-on-surface-variant">Only the owner can do this</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-card sm:flex-row sm:items-center">
                  <div>
                    <p className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-error">
                      <Icon name="delete" className="text-[16px]" /> Delete document
                    </p>
                    <p className="text-xs text-on-surface-variant">Removes it for you and everyone it&apos;s shared with. This can&apos;t be undone.</p>
                  </div>
                  <button type="button" className="btn-danger shrink-0" onClick={() => setDeleteOpen(true)}>
                    Delete
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {isOwner && (
        <ShareDialog
          open={shareOpen}
          onClose={() => {
            setShareOpen(false);
            void loadCollaborators();
          }}
          docId={doc.id}
          docTitle={savedTitle}
        />
      )}
      <DeleteDocumentDialog doc={deleteOpen ? { id: doc.id, title: savedTitle } : null} onDone={() => setDeleteOpen(false)} redirectTo="/" />
    </AppShell>
  );
}

function Panel({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-5 p-6">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container text-primary">
          <Icon name={icon} className="text-[20px]" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight font-semibold text-on-surface">{title}</h2>
          <p className="text-[13px] text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-3">
      <span className="font-display text-[10px] font-semibold tracking-wider text-on-surface-variant uppercase">{label}</span>
      <span className="text-xs font-semibold text-on-surface" suppressHydrationWarning>
        {value}
      </span>
    </div>
  );
}
