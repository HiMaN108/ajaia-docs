"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

const ACCEPT = ".txt,.md,.markdown,.docx";
const MAX_BYTES = 2 * 1024 * 1024;

export function DashboardActions() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"new" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createBlank() {
    setBusy("new");
    setError(null);
    try {
      const { id } = await api<{ id: string }>("/api/documents", { method: "POST", body: "{}" });
      router.push(`/doc/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  async function importFile(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) return setError("File is too large (max 2 MB).");
    setBusy("import");
    try {
      const body = new FormData();
      body.append("file", file);
      const { id } = await api<{ id: string }>("/api/documents/import", { method: "POST", body });
      router.push(`/doc/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={!!busy} onClick={() => fileInput.current?.click()}>
          <UploadIcon /> {busy === "import" ? "Importing…" : "Import file"}
        </button>
        <button className="btn-primary" disabled={!!busy} onClick={createBlank}>
          <span className="text-lg leading-none">+</span> {busy === "new" ? "Creating…" : "New document"}
        </button>
      </div>
      <p className="text-xs text-slate-500">Import supports .txt, .md and .docx (max 2 MB)</p>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFile(f);
        }}
      />
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
