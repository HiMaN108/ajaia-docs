"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { IMPORT_ACCEPT, checkImportFile, formatBytes, useImportFile } from "@/lib/client-actions";
import { Icon } from "../Icon";

const KIND: Record<string, string> = { txt: "Plain text", md: "Markdown", markdown: "Markdown", docx: "Word document" };

/** Drag-and-drop (or browse) → staged file card → "Import as document". */
export function ImportPanel() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const { importFile, busy, error, setError } = useImportFile();

  function stage(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setError(checkImportFile(f));
  }

  const ext = file?.name.split(".").pop()?.toLowerCase() ?? "";
  const invalid = !!file && !!checkImportFile(file);

  return (
    <>
      <section
        role="button"
        tabIndex={0}
        aria-label="Upload a file: drop it here or press Enter to browse"
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click())}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          stage(e.dataTransfer.files?.[0]);
        }}
        className={`card group relative cursor-pointer overflow-hidden p-10 outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-container ${
          dragging ? "bg-surface-container-low ring-2 ring-primary-container" : ""
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-fixed/30 via-transparent to-transparent" />
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute -inset-2 rounded-2xl bg-primary-container/20 blur-xl transition group-hover:bg-primary-container/30" />
            <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-surface-container text-primary-container shadow-card transition-transform group-hover:scale-105">
              <Icon name="cloud_upload" className="text-[32px]" />
            </span>
          </div>
          <h2 className="font-display text-lg font-semibold text-on-surface">{dragging ? "Drop to stage this file" : "Drag and drop a file here"}</h2>
          <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">or browse your computer. The file becomes a new document you own.</p>
          <span className="btn-primary mt-6">
            <Icon name="folder_open" className="text-[18px]" /> Browse files
          </span>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[".TXT Plain text", ".MD Markdown", ".DOCX Word"].map((t) => (
              <span key={t} className="rounded-md bg-surface-container px-2.5 py-1 font-mono text-xs text-on-surface-variant">
                {t}
              </span>
            ))}
            <span className="flex items-center gap-1 font-display text-[11px] font-semibold text-on-surface-variant">
              <Icon name="straighten" className="text-[15px]" /> Max 2 MB
            </span>
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept={IMPORT_ACCEPT}
          className="hidden"
          aria-label="Choose file to import"
          onChange={(e) => {
            stage(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </section>

      {file && (
        <section className="card p-5" aria-label="Selected file">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-fixed/70 font-mono text-[11px] font-semibold text-primary uppercase">
                {ext.slice(0, 4) || "?"}
              </span>
              <div className="flex min-w-0 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-display text-[15px] font-semibold text-on-surface">{file.name}</span>
                  {invalid ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-0.5 font-display text-[11px] font-semibold text-on-error-container">
                      <Icon name="error" className="text-[13px]" /> Can&apos;t import
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 font-display text-[11px] font-semibold text-on-tertiary-fixed">
                      <Icon name="check_circle" className="text-[13px]" /> Ready to import
                    </span>
                  )}
                </div>
                <span className="mt-0.5 font-mono text-xs text-on-surface-variant">
                  {formatBytes(file.size)} · {KIND[ext] ?? "Unsupported type"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" title="Choose another file" aria-label="Choose another file" className="btn-ghost h-8 w-8 justify-center" onClick={() => input.current?.click()}>
                <Icon name="sync" className="text-[18px]" />
              </button>
              <button
                type="button"
                title="Remove file"
                aria-label="Remove file"
                className="btn-ghost h-8 w-8 justify-center hover:text-error"
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
              >
                <Icon name="delete" className="text-[18px]" />
              </button>
            </div>
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-2.5 text-sm text-on-error-container">
          <Icon name="error" className="text-[18px]" /> {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link href="/" className="btn-secondary">
          Cancel
        </Link>
        <button type="button" className="btn-primary px-6" disabled={!file || invalid || busy} onClick={() => file && void importFile(file)}>
          <Icon name={busy ? "progress_activity" : "check_circle"} className={`text-[18px] ${busy ? "animate-spin" : ""}`} />
          {busy ? "Importing…" : "Import as document"}
        </button>
      </div>
    </>
  );
}
