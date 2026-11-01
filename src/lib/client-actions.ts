"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./client";

export const IMPORT_ACCEPT = ".txt,.md,.markdown,.docx";
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

/** Create a blank document and open it. Shared by the sidebar, hero and quick tiles. */
export function useCreateDocument() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("/api/documents", { method: "POST", body: "{}" });
      router.push(`/doc/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }, [router]);

  return { create, busy, error };
}

/** Upload a .txt/.md/.docx file as a new document and open it. */
export function useImportFile() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importFile = useCallback(
    async (file: File) => {
      setError(null);
      const problem = checkImportFile(file);
      if (problem) return setError(problem);
      setBusy(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const { id } = await api<{ id: string }>("/api/documents/import", { method: "POST", body });
        router.push(`/doc/${id}`);
      } catch (err) {
        setError((err as Error).message);
        setBusy(false);
      }
    },
    [router],
  );

  return { importFile, busy, error, setError };
}

/** Fast client-side check; the server validates again. */
export function checkImportFile(file: File): string | null {
  if (!/\.(txt|md|markdown|docx)$/i.test(file.name)) return "Unsupported file type. Please choose a .txt, .md or .docx file.";
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_IMPORT_BYTES) return "File is too large (max 2 MB).";
  return null;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
