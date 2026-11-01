"use client";

import Link from "next/link";
import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import type { DocumentDetail } from "@/lib/documents";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/access";
import { timeAgo } from "@/lib/client";
import { editorExtensions } from "@/lib/editor/extensions";
import { docToMarkdown } from "@/lib/editor/markdown";
import { downloadMarkdown } from "@/lib/editor/download";
import { textStats } from "@/lib/editor/stats";
import { Icon } from "../Icon";
import { RoleBadge } from "../RoleBadge";
import { ShareDialog } from "../ShareDialog";
import { AppShell } from "../shell/AppShell";
import { Avatar } from "../shell/Avatar";
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
  const [focusMode, setFocusMode] = useState(false);

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
    if (!t || t.length > 200) return setTitle(savedTitle); // invalid: revert
    if (t === savedTitle) return;
    setTitle(t);
    setSavedTitle(t);
    queue({ title: t }, true);
  }

  const topbar = (
    <header className="sticky top-0 z-30 border-b border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            onClick={() => void flush()}
            className="hidden shrink-0 font-display text-[13px] font-medium text-on-surface-variant hover:text-primary sm:block"
          >
            Documents
          </Link>
          <span className="hidden text-outline-variant sm:block">/</span>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary-fixed text-on-primary-fixed">
            <Icon name="description" className="text-[16px]" />
          </span>
          <input
            aria-label="Document title"
            className="max-w-[28rem] min-w-[6rem] truncate rounded bg-transparent px-2 py-0.5 [field-sizing:content] font-display text-lg font-semibold text-on-surface outline-none transition hover:bg-surface-container-low focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/30 disabled:hover:bg-transparent"
            value={title}
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
          {canEdit && <SavePill status={status} error={error} onRetry={() => void flush()} />}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="mr-1 hidden items-center gap-2 rounded-full bg-surface-container-low py-1 pr-3 pl-1 lg:flex" title={doc.owner.email}>
            <Avatar name={doc.owner.name} seed={doc.owner.email} size="xs" />
            <span className="font-display text-[11px] text-on-surface-variant">
              {doc.role === "owner" ? "Owned by you" : <>Owned by <strong className="font-medium text-on-surface">{doc.owner.name}</strong></>}
            </span>
          </div>
          <button
            type="button"
            className="btn-ghost h-8"
            title="Download as Markdown"
            disabled={!editor}
            onClick={() => editor && downloadMarkdown(title, docToMarkdown(editor.getJSON()))}
          >
            <Icon name="download" className="text-[18px]" />
            <span className="hidden sm:inline">Download .md</span>
          </button>
          <Link href={`/doc/${doc.id}/settings`} onClick={() => void flush()} className="btn-ghost h-8" title="Document settings">
            <Icon name="settings" className="text-[18px]" />
            <span className="sr-only">Settings</span>
          </Link>
          {canShare && (
            <button type="button" className="btn-primary h-8 px-3.5" onClick={() => setShareOpen(true)}>
              <Icon name="person_add" className="text-[18px]" />
              Share
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/20 px-4 py-1.5 sm:px-6">
        {canEdit && editor ? (
          <Toolbar editor={editor} />
        ) : !canEdit ? (
          <p className="flex items-center gap-2 py-1 text-[13px] text-on-warning-container">
            <Icon name="visibility" className="text-[18px]" />
            View only: you can read this document but not edit it. Ask {doc.owner.name} for edit access.
          </p>
        ) : (
          <div className="h-7" />
        )}
      </div>
    </header>
  );

  return (
    <AppShell user={user} topbar={topbar} sidebarHidden={focusMode}>
      <main className="flex flex-1 justify-center px-3 pt-8 pb-24 sm:px-8">
        <article
          className="w-full max-w-[860px] cursor-text rounded-2xl bg-surface-container-lowest px-6 py-10 shadow-md ring-1 ring-outline-variant/20 sm:px-14 sm:py-14 md:px-20"
          onClick={() => canEdit && editor && !editor.isFocused && editor.commands.focus("end")}
        >
          <EditorContent editor={editor} />
        </article>
      </main>

      {/* Mounted once the editor exists, so the stats selector sees it from the first render. */}
      {editor && (
        <StatusBar
          editor={editor}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          readOnly={!canEdit}
          updatedAt={doc.updatedAt}
        />
      )}

      {canShare && <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} docId={doc.id} docTitle={title} />}
    </AppShell>
  );
}

const SAVE_TEXT: Record<Exclude<SaveStatus, "error">, string> = {
  saved: "All changes saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
};

function SavePill({ status, error, onRetry }: { status: SaveStatus; error: string | null; onRetry: () => void }) {
  if (status === "error") {
    return (
      <span role="alert" className="inline-flex shrink-0 items-center gap-2 rounded-full whitespace-nowrap bg-error-container px-2.5 py-0.5 font-display text-[11px] font-semibold text-on-error-container">
        Not saved: {error}
        <button className="underline" onClick={onRetry}>
          Retry
        </button>
      </span>
    );
  }
  const tone = status === "saved" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container text-on-surface-variant";
  return (
    <span
      title={SAVE_TEXT[status]}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 font-display text-[11px] font-semibold whitespace-nowrap sm:px-2.5 sm:py-0.5 ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status === "saved" ? "bg-tertiary-container" : "animate-pulse bg-primary-container"}`} />
      {/* Label collapses to just the dot on small screens */}
      <span className="sr-only sm:not-sr-only">{SAVE_TEXT[status]}</span>
    </span>
  );
}

function StatusBar({
  editor,
  focusMode,
  onToggleFocus,
  readOnly,
  updatedAt,
}: {
  editor: Editor;
  focusMode: boolean;
  onToggleFocus: () => void;
  readOnly: boolean;
  updatedAt: string;
}) {
  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) => textStats(e.getText()),
  });

  return (
    <footer
      className={`fixed right-0 bottom-0 z-20 flex h-10 items-center justify-between gap-3 border-t border-outline-variant/30 bg-surface-container-lowest/90 px-4 backdrop-blur-md sm:px-6 ${
        focusMode ? "left-0" : "left-0 lg:left-64"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 font-mono text-[11px] text-on-surface-variant">
        {readOnly && (
          <span className="flex items-center gap-1.5 font-display" suppressHydrationWarning>
            <Icon name="visibility" className="text-[15px]" /> Read-only · edited {timeAgo(updatedAt)}
          </span>
        )}
        {stats && (
          <span className="hidden items-center gap-2 md:flex">
            {readOnly && <span>·</span>}
            <span>{stats.words.toLocaleString()} words</span>
            <span>·</span>
            <span>{stats.characters.toLocaleString()} characters</span>
            <span>·</span>
            <span>{stats.readMinutes} min read</span>
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleFocus}
        aria-pressed={focusMode}
        title="Hide the sidebar for distraction-free writing"
        className="btn-ghost hidden h-7 text-[11px] lg:inline-flex"
      >
        <Icon name={focusMode ? "fullscreen_exit" : "fullscreen"} className="text-[16px]" />
        {focusMode ? "Exit focus mode" : "Focus mode"}
      </button>
    </footer>
  );
}
