"use client";

import { useRef } from "react";
import { IMPORT_ACCEPT, useCreateDocument, useImportFile } from "@/lib/client-actions";
import { Icon } from "../Icon";

type TileAction = "blank" | "markdown" | "word";
const TILES: { action: TileAction; title: string; body: string; icon: string; tag: string; tone: string }[] = [
  { action: "blank", title: "Blank document", body: "Start from an empty page with headings, lists and rich text.", icon: "edit_note", tag: "New", tone: "text-primary group-hover:bg-primary-container" },
  { action: "markdown", title: "Import Markdown", body: "Turn a .md file into an editable doc. Headings, lists and emphasis are kept.", icon: "code_blocks", tag: ".md", tone: "text-tertiary group-hover:bg-tertiary-container" },
  { action: "word", title: "Import Word or text", body: "Bring in a .docx or .txt file. Formatting from Word is preserved.", icon: "article", tag: ".docx .txt", tone: "text-secondary group-hover:bg-on-surface" },
];

export function DashboardHero({ firstName, ownedCount, sharedCount }: { firstName: string; ownedCount: number; sharedCount: number }) {
  const { create, busy: creating, error: createError } = useCreateDocument();
  const { importFile, busy: importing, error: importError } = useImportFile();
  const fileInput = useRef<HTMLInputElement>(null);
  const pickFile = (accept = IMPORT_ACCEPT) => {
    if (!fileInput.current) return;
    fileInput.current.accept = accept;
    fileInput.current.click();
  };
  const error = createError ?? importError;
  const runTile = (action: TileAction) => {
    if (action === "blank") void create();
    else pickFile(action === "markdown" ? ".md,.markdown" : ".docx,.txt");
  };


  return (
    <>
      <section className="card relative mb-6 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-16 h-96 w-96 rounded-full bg-gradient-to-br from-primary-fixed/60 via-surface-container/40 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-gradient-to-tr from-secondary-container/50 to-transparent blur-2xl" />
        <div className="relative flex flex-col justify-between gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface-container px-2.5 py-1 font-display text-[11px] font-semibold text-on-surface-variant">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary-container" />
              {ownedCount} owned · {sharedCount} shared with you
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-on-surface">Welcome back, {firstName}</h1>
            <p className="mt-1.5 text-sm text-on-surface-variant">Create, import and share documents with your team. Changes save automatically.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button className="btn-secondary" onClick={() => pickFile()} disabled={importing}>
              <Icon name="upload_file" className="text-[18px] text-on-surface-variant" />
              {importing ? "Importing…" : "Import file"}
            </button>
            <button className="btn-primary group" onClick={() => void create()} disabled={creating}>
              <Icon name="add" className="text-[18px] transition-transform group-hover:rotate-90" />
              {creating ? "Creating…" : "New document"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-error-container px-4 py-2.5 text-sm text-on-error-container">
          <Icon name="error" className="text-[18px]" /> {error}
        </p>
      )}

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Quick start">
        {TILES.map((t) => (
          <button
            key={t.title}
            onClick={() => runTile(t.action)}
            disabled={creating || importing}
            className="card group flex flex-col justify-between p-5 text-left transition hover:shadow-md disabled:opacity-60"
          >
            <div className="flex items-start justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-lg bg-surface-container transition-colors group-hover:text-on-primary ${t.tone}`}>
                <Icon name={t.icon} className="text-[20px]" />
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant/70">{t.tag}</span>
            </div>
            <div className="mt-4">
              <span className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-on-surface">
                {t.title}
                <Icon name="arrow_forward" className="text-[16px] text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-xs text-on-surface-variant">{t.body}</span>
            </div>
          </button>
        ))}
      </section>

      <input
        ref={fileInput}
        type="file"
        accept={IMPORT_ACCEPT}
        className="hidden"
        aria-label="Import file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void importFile(f);
        }}
      />
    </>
  );
}
