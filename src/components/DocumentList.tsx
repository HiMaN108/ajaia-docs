"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DocumentSummary } from "@/lib/documents";
import { api, timeAgo } from "@/lib/client";
import { RoleBadge } from "./RoleBadge";

export function DocumentList({
  title,
  docs,
  emptyText,
}: {
  title: string;
  docs: DocumentSummary[];
  emptyText: string;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{docs.length}</span>
      </h2>
      {docs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {docs.map((d) => (
            <DocumentRow key={d.id} doc={d} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DocumentRow({ doc }: { doc: DocumentSummary }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
      setDeleting(false);
    }
  }

  return (
    <li className={`group flex items-center gap-4 px-4 py-3 hover:bg-slate-50 ${deleting ? "opacity-50" : ""}`}>
      <DocIcon />
      <Link href={`/doc/${doc.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-900">{doc.title}</span>
          {doc.role !== "owner" && <RoleBadge role={doc.role} />}
        </div>
        <div className="truncate text-sm text-slate-500">{doc.preview || "Empty document"}</div>
      </Link>
      <div className="hidden shrink-0 text-right text-xs text-slate-500 sm:block">
        {doc.role !== "owner" && <div>Owner: {doc.owner.name}</div>}
        {/* Relative time can differ by a minute between server render and hydration. */}
        <div suppressHydrationWarning>Edited {timeAgo(doc.updatedAt)}</div>
      </div>
      {doc.role === "owner" && (
        <button
          onClick={remove}
          disabled={deleting}
          className="btn-ghost text-xs text-slate-400 opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
          aria-label={`Delete ${doc.title}`}
        >
          Delete
        </button>
      )}
    </li>
  );
}

function DocIcon() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    </span>
  );
}
