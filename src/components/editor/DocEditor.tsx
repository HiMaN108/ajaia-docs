"use client";

import Link from "next/link";
import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import type { DocumentDetail } from "@/lib/documents";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/access";
import { editorExtensions } from "@/lib/editor/extensions";
import { docToMarkdown } from "@/lib/editor/markdown";
import { Avatar, Logo } from "../AppHeader";
import { RoleBadge } from "../RoleBadge";
import { ShareDialog } from "../ShareDialog";
import { Toolbar } from "./Toolbar";
import { useAutosave, type SaveStatus } from "./useAutosave";

// Defined once at module level: useEditor compares options by reference on every render,
// so inline arrays/objects would make it call setOptions on each keystroke.
const extensions = [...editorExtensions, Placeholder.configure({ placeholder: "Start writing…" })];
const editorProps = { attributes: { class: "doc-content", "aria-label": "Document body" } };

export function DocEditor({ doc, user }: { doc: DocumentDetail; user: SessionUser }) {
  const canEdit = can(doc.role, "edit");
  const canShare = can(doc.role, "share");
  const { status, error, queue, flush } = useAutosave(doc.id);
  const [title, setTitle] = useState(doc.title);
  const [savedTitle, setSavedTitle] = useState(doc.title);
  const [shareOpen, setShareOpen] = useState(false);

  const editor = useEditor({
    extensions,
    content: doc.content,
    editable: canEdit,
    immediatelyRender: false, // avoid SSR hydration mismatch
    editorProps,
    onUpdate: ({ editor }) => queue({ content: editor.getJSON() }),
  });

  function commitTitle() {
    const t = title.trim();
    if (!t) return setTitle(savedTitle); // empty title: revert
    if (t.length > 200) return setTitle(savedTitle);
    if (t === savedTitle) return;
    setTitle(t);
    setSavedTitle(t);
    queue({ title: t }, true);
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-4 pt-2">
          <Link href="/" title="Back to documents" onClick={() => void flush()}>
            <Logo />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                aria-label="Document title"
                className="min-w-0 max-w-xl truncate rounded px-1.5 py-0.5 text-lg font-medium text-slate-900 hover:ring-1 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:hover:ring-0"
                value={title}
                size={Math.max(title.length + 1, 12)} // grow with the text, like Google Docs
                maxLength={200}
                disabled={!canEdit}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    setTitle(savedTitle);
                    requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
                  }
                }}
              />
              {doc.role !== "owner" && <RoleBadge role={doc.role} />}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 px-1.5 text-xs text-slate-500">
              <span>{doc.role === "owner" ? "Owned by you" : `Owned by ${doc.owner.name} (${doc.owner.email})`}</span>
              {canEdit && <span aria-hidden>·</span>}
              <SaveIndicator status={canEdit ? status : null} error={error} onRetry={() => void flush()} />
            </div>
          </div>
          <button
            className="btn-secondary hidden sm:inline-flex"
            title="Download as Markdown"
            disabled={!editor}
            onClick={() => editor && downloadMarkdown(title, docToMarkdown(editor.getJSON()))}
          >
            Download .md
          </button>
          {canShare && (
            <button className="btn-primary" onClick={() => setShareOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Share
            </button>
          )}
          <span title={`${user.name} (${user.email})`}>
            <Avatar name={user.name} />
          </span>
        </div>
        <div className="flex justify-center px-4 py-2">
          {canEdit && editor ? (
            <Toolbar editor={editor} />
          ) : (
            <p className="rounded-full bg-amber-50 px-4 py-1.5 text-sm text-amber-800">
              View only: you can read this document but not edit it. Ask {doc.owner.name} for edit access.
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 px-2 py-6 sm:px-6">
        <div
          className="mx-auto min-h-[70vh] max-w-[816px] cursor-text rounded-sm bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200 sm:px-16 sm:py-14"
          onClick={() => canEdit && editor && !editor.isFocused && editor.commands.focus("end")}
        >
          <EditorContent editor={editor} />
        </div>
      </main>

      {canShare && <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} docId={doc.id} docTitle={title} />}
    </div>
  );
}

function SaveIndicator({ status, error, onRetry }: { status: SaveStatus | null; error: string | null; onRetry: () => void }) {
  if (!status) return null;
  if (status === "error") {
    return (
      <span role="alert" className="flex shrink-0 items-center gap-2 text-xs text-red-600">
        Not saved: {error}
        <button className="font-medium underline" onClick={onRetry}>
          Retry
        </button>
      </span>
    );
  }
  const text = { saved: "All changes saved", unsaved: "Unsaved changes", saving: "Saving…" }[status];
  return (
    <span aria-live="polite" className="shrink-0 text-xs text-slate-500">
      {text}
    </span>
  );
}

function downloadMarkdown(title: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\w\- ]+/g, "").trim() || "document"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
