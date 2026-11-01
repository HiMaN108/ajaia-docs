"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DocumentSummary } from "@/lib/documents";
import { api, timeAgo } from "@/lib/client";
import { ConfirmDialog } from "../ConfirmDialog";
import { Icon } from "../Icon";
import { RoleBadge } from "../RoleBadge";
import { Avatar } from "../shell/Avatar";

type Tab = "all" | "owned" | "shared";
type Sort = "modified" | "title";
type View = "list" | "grid";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All documents" },
  { id: "owned", label: "Owned by me" },
  { id: "shared", label: "Shared with me" },
];

/**
 * Searchable, sortable document list with list/grid views.
 * - `tabs`: show the All / Owned / Shared filter (dashboard).
 * - `ownerFilter`: show a "shared by" dropdown (Shared with me page).
 */
export function DocumentsBrowser({
  docs,
  tabs = false,
  ownerFilter = false,
  emptyState,
}: {
  docs: DocumentSummary[];
  tabs?: boolean;
  ownerFilter?: boolean;
  emptyState: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("all");
  const [sort, setSort] = useState<Sort>("modified");
  const [view, setView] = useState<View>("list");
  const [toDelete, setToDelete] = useState<DocumentSummary | null>(null);

  const counts = useMemo(
    () => ({
      all: docs.length,
      owned: docs.filter((d) => d.role === "owner").length,
      shared: docs.filter((d) => d.role !== "owner").length,
    }),
    [docs],
  );

  const owners = useMemo(() => {
    const map = new Map(docs.map((d) => [d.owner.id, d.owner]));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [docs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs
      .filter((d) => tab === "all" || (tab === "owned" ? d.role === "owner" : d.role !== "owner"))
      .filter((d) => owner === "all" || d.owner.id === owner)
      .filter(
        (d) =>
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.preview.toLowerCase().includes(q) ||
          d.owner.name.toLowerCase().includes(q),
      )
      .sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt)));
  }, [docs, tab, owner, query, sort]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        {tabs ? (
          <div role="tablist" aria-label="Filter documents" className="flex w-fit items-center gap-1 rounded-xl bg-surface-container-low p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-display text-xs font-medium transition ${
                  tab === t.id ? "bg-surface-container-lowest text-on-surface shadow-card" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t.label}
                <span className="rounded-full bg-surface-container px-1.5 font-mono text-[10px] text-on-surface-variant">{counts[t.id]}</span>
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex w-full items-center sm:w-64">
            <Icon name="search" className="absolute left-3 text-[17px] text-on-surface-variant" />
            <input
              className="input h-8 pl-9 text-xs"
              placeholder="Filter by title, content or owner…"
              aria-label="Filter documents"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {ownerFilter && (
            <select className="input h-8 w-auto pr-8 text-xs" aria-label="Shared by" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">Shared by anyone</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          <select className="input h-8 w-auto pr-8 text-xs" aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="modified">Recently modified</option>
            <option value="title">Title (A–Z)</option>
          </select>
          <div className="flex items-center rounded-lg bg-surface-container-low p-0.5" role="group" aria-label="View">
            {(["list", "grid"] as const).map((v) => (
              <button
                key={v}
                title={v === "list" ? "List view" : "Grid view"}
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`grid h-7 w-7 place-items-center rounded-md ${
                  view === v ? "bg-surface-container-lowest text-primary shadow-card" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon name={v === "list" ? "view_list" : "grid_view"} className="text-[18px]" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {docs.length === 0 ? (
        emptyState
      ) : visible.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-on-surface-variant">No documents match your filters.</div>
      ) : view === "list" ? (
        <ListView docs={visible} onDelete={setToDelete} />
      ) : (
        <GridView docs={visible} onDelete={setToDelete} />
      )}

      <DeleteDocumentDialog doc={toDelete} onDone={() => setToDelete(null)} />
    </section>
  );
}

function DocGlyph({ doc, size = "md" }: { doc: DocumentSummary; size?: "md" | "lg" }) {
  const tone =
    doc.role === "owner"
      ? "bg-primary-fixed text-primary"
      : doc.role === "editor"
        ? "bg-tertiary-fixed text-tertiary"
        : "bg-surface-container-high text-on-surface-variant";
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg transition-colors ${tone} ${size === "lg" ? "h-10 w-10" : "h-9 w-9"}`}>
      <Icon name={doc.role === "owner" ? "description" : "folder_shared"} className="text-[20px]" />
    </span>
  );
}

function OwnerCell({ doc }: { doc: DocumentSummary }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar name={doc.owner.name} seed={doc.owner.email} size="sm" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-display text-xs font-medium text-on-surface">{doc.role === "owner" ? "You" : doc.owner.name}</span>
        <span className="truncate font-mono text-[11px] text-on-surface-variant">{doc.owner.email}</span>
      </div>
    </div>
  );
}

function ListView({ docs, onDelete }: { docs: DocumentSummary[]; onDelete: (d: DocumentSummary) => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="eyebrow hidden items-center bg-surface-container-low/60 px-6 py-3 md:flex">
        <div className="w-6/12">Name</div>
        <div className="w-2/12">Access</div>
        <div className="w-2/12">Owner</div>
        <div className="w-2/12 text-right">Last modified</div>
      </div>
      <ul className="divide-y divide-surface-container-low">
        {docs.map((d) => (
          <li key={d.id} className="group relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-container-low/50 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3.5 md:w-6/12 md:flex-none md:pr-4">
              <DocGlyph doc={d} />
              <div className="flex min-w-0 flex-col">
                {/* The title link covers the whole row (stretched link) */}
                <Link
                  href={`/doc/${d.id}`}
                  className="truncate font-display text-sm font-semibold text-on-surface after:absolute after:inset-0 group-hover:text-primary"
                >
                  {d.title}
                </Link>
                <span className="mt-0.5 truncate text-xs text-on-surface-variant">{d.preview || "Empty document"}</span>
              </div>
            </div>
            <div className="hidden w-2/12 md:block">
              <RoleBadge role={d.role} />
            </div>
            <div className="hidden w-2/12 md:block">
              <OwnerCell doc={d} />
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 md:w-2/12">
              <span className="text-right font-display text-xs text-on-surface" suppressHydrationWarning>
                {timeAgo(d.updatedAt)}
              </span>
              {d.role === "owner" && (
                <button
                  onClick={() => onDelete(d)}
                  title="Delete"
                  aria-label={`Delete ${d.title}`}
                  className="relative z-10 grid h-7 w-7 place-items-center rounded-md text-on-surface-variant opacity-0 transition hover:bg-error-container hover:text-error focus:opacity-100 group-hover:opacity-100"
                >
                  <Icon name="delete" className="text-[18px]" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GridView({ docs, onDelete }: { docs: DocumentSummary[]; onDelete: (d: DocumentSummary) => void }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {docs.map((d) => (
        <li key={d.id} className="card group relative flex flex-col justify-between gap-4 p-5 transition hover:shadow-md">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <DocGlyph doc={d} size="lg" />
              <RoleBadge role={d.role} />
            </div>
            <div>
              <Link
                href={`/doc/${d.id}`}
                className="line-clamp-1 font-display text-base font-semibold text-on-surface after:absolute after:inset-0 group-hover:text-primary"
              >
                {d.title}
              </Link>
              <p className="mt-1 line-clamp-2 min-h-9 text-xs text-on-surface-variant">{d.preview || "Empty document"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <OwnerCell doc={d} />
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px] text-on-surface-variant" suppressHydrationWarning>
                {timeAgo(d.updatedAt)}
              </span>
              {d.role === "owner" && (
                <button
                  onClick={() => onDelete(d)}
                  aria-label={`Delete ${d.title}`}
                  className="relative z-10 grid h-7 w-7 place-items-center rounded-md text-on-surface-variant hover:bg-error-container hover:text-error"
                >
                  <Icon name="delete" className="text-[18px]" />
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DeleteDocumentDialog({
  doc,
  onDone,
  redirectTo,
}: {
  doc: Pick<DocumentSummary, "id" | "title"> | null;
  onDone: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={!!doc}
      title="Delete document?"
      confirmLabel="Delete permanently"
      busy={busy}
      onConfirm={confirm}
      onCancel={() => {
        setError(null);
        onDone();
      }}
    >
      <span className="font-semibold">&ldquo;{doc?.title}&rdquo;</span> will be deleted for you and everyone it&apos;s shared with. This
      can&apos;t be undone.
      {error && <span className="mt-2 block text-error">{error}</span>}
    </ConfirmDialog>
  );
}
