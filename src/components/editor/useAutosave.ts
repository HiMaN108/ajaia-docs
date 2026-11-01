"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

/**
 * Debounced autosave that never runs two saves at the same time.
 * Edits made while a save is in progress are queued and sent right after it finishes,
 * so the last edit always wins and nothing is lost.
 */
export function useAutosave(docId: string, delayMs = 800) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Record<string, unknown> | null>(null);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = `/api/documents/${docId}`;

  const flush = useCallback(async (): Promise<void> => {
    if (timer.current) clearTimeout(timer.current);
    if (inFlight.current || !pending.current) return;
    inFlight.current = true;
    try {
      // Keep sending until no edits are left (edits can arrive while a save is in flight).
      while (pending.current) {
        const body: Record<string, unknown> = pending.current;
        pending.current = null;
        setStatus("saving");
        try {
          await api(url, { method: "PATCH", body: JSON.stringify(body) });
        } catch (err) {
          // Keep the failed changes for retry, with any newer edits layered on top.
          const newer = pending.current as Record<string, unknown> | null;
          pending.current = { ...body, ...newer };
          setStatus("error");
          setError((err as Error).message);
          return;
        }
      }
      setStatus("saved");
      setError(null);
    } finally {
      inFlight.current = false;
    }
  }, [url]);

  /** Queue a partial update ({ content } and/or { title }) and save after a short pause. */
  const queue = useCallback(
    (patch: Record<string, unknown>, immediate = false) => {
      pending.current = { ...pending.current, ...patch };
      setStatus((s) => (s === "saving" ? s : "unsaved"));
      if (timer.current) clearTimeout(timer.current);
      if (immediate) void flush();
      else timer.current = setTimeout(() => void flush(), delayMs);
    },
    [flush, delayMs],
  );

  // Warn before closing the tab with unsaved changes; send a final save if the page goes away.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current || inFlight.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (timer.current) clearTimeout(timer.current);
      if (pending.current) {
        fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending.current),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [url]);

  return { status, error, queue, flush };
}
